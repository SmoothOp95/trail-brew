import type { AdjusterKey, PointType, SettingChart } from '../data/schema/tables';
import type { BikeContext, Capability, Provenance, PublishedRange, SettingField, Settings, StartingValue } from './types';
import { resolveCapability } from './capability';

export const ALL_FIELDS: SettingField[] = [
  'fork_psi', 'fork_spacers', 'fork_lsr', 'fork_hsr', 'fork_lsc', 'fork_hsc',
  'shock_psi', 'shock_spacers', 'shock_lsr', 'shock_hsr', 'shock_lsc', 'shock_hsc',
  'tyre_front', 'tyre_rear', 'flip_chip',
];

export type ChartRead = { value: number } | { value: null; why: string };

/**
 * Read a weight-indexed chart. `curve` interpolates linearly. `bracket` returns the band value and never
 * interpolates across a boundary: points are band lower bounds, the last band is open-ended.
 * Outside the chart's range returns null rather than extrapolating.
 */
export function readChart(points: [number, number][], kg: number, pointType: PointType | null | undefined): ChartRead {
  if (!points.length) return { value: null, why: 'chart has no points' };
  const [firstKg] = points[0];
  const [lastKg, lastV] = points[points.length - 1];
  if (kg < firstKg) return { value: null, why: `below the chart's lowest weight (${firstKg} kg)` };
  if ((pointType ?? 'curve') === 'bracket') {
    let v = points[0][1];
    for (const [k, val] of points) if (kg >= k) v = val;
    return { value: v };
  }
  if (kg > lastKg) return { value: null, why: `above the chart's highest weight (${lastKg} kg)` };
  if (kg === lastKg) return { value: lastV };
  for (let i = 1; i < points.length; i++) {
    const [k0, v0] = points[i - 1];
    const [k1, v1] = points[i];
    if (kg <= k1) return { value: v0 + ((v1 - v0) * (kg - k0)) / (k1 - k0) };
  }
  return { value: null, why: 'outside chart' };
}

type Band = { kg_min: number | null; kg_max: number | null; psi_min?: number | null; psi_max?: number | null };
export const describePsiBand = (b: Band) =>
  b.psi_min == null ? `under ${b.psi_max} psi` : b.psi_max == null ? `${b.psi_min} psi or more` : `${b.psi_min} to ${b.psi_max} psi`;
export const describeKgBand = (b: Band) =>
  b.kg_min == null ? `under ${b.kg_max} kg` : b.kg_max == null ? `${b.kg_min} kg or more` : `${b.kg_min} to ${b.kg_max} kg`;

const provenanceOf = (confidence: string): Provenance =>
  confidence === 'published' || confidence === 'measured' ? 'published' : confidence === 'derived' ? 'derived' : 'estimated';

const basisNote = (basis: string | null | undefined): string | null =>
  basis === 'rider_only'
    ? 'This chart uses rider weight without kit; you entered kitted weight, so it reads slightly high.'
    : basis == null
      ? 'The chart does not say whether its weights are rider only or rider in kit.'
      : null;

/**
 * Starting value for one field, following 07 v0.2 exactly:
 *   1. setting_chart for this damper and adjuster  -> published (or estimated if the chart is)
 *   2. pressure_chart for this air spring          -> published
 *   3. model with real inputs                      -> derived
 *   4. unknown                                     -> never a guess
 * Where a chart covers the field the model does not run.
 */
export function startingValue(field: SettingField, bike: BikeContext, riderKg: number | null): StartingValue {
  const cap = resolveCapability(field, bike);
  const base = { field, notes: [] as string[] };
  if (cap.state === 'absent' || cap.state === 'pending') return { ...base, value: null, provenance: 'unknown', source: null, settleWith: null };

  const end = field.startsWith('fork_') ? 'fork' : field.startsWith('shock_') ? 'shock' : null;
  const what = end ? (field.slice(end.length + 1) as AdjusterKey | 'psi' | 'spacers') : null;

  // 1. setting_chart
  if (end && what && ['lsc', 'hsc', 'lsr', 'hsr'].includes(what)) {
    const charts = (end === 'fork' ? bike.fork!.settingCharts : bike.shock!.settingCharts).filter((c) => c.adjuster === what);
    for (const chart of charts) {
      const v = settingFromChart(chart, cap, what as AdjusterKey, riderKg);
      if (v) return { ...v, field };
    }
    // 3. model: only with real inputs, which means a documented total.
    if (cap.state === 'counted' && cap.max && riderKg != null) {
      const isRebound = what === 'lsr' || what === 'hsr';
      const value = Math.round(cap.max.value * (isRebound ? 0.7 : 0.5));
      return {
        ...base, value, provenance: 'derived',
        source: isRebound ? `70% of the documented ${cap.max.value}-click range` : `middle of the documented ${cap.max.value}-click range`,
        notes: ['Derived from the adjuster range, not from a manufacturer recommendation.'], settleWith: null,
      };
    }
    return {
      ...base, value: null, provenance: 'unknown', source: null,
      settleWith:
        cap.state === 'coarse'
          ? 'No recommended starting position published. Enter where yours is set.'
          : 'No recommended setting or documented range published for this adjuster. Enter your current clicks.',
    };
  }

  // 2. pressure_chart
  if (field === 'fork_psi') {
    const chart = bike.fork!.pressureChart;
    if (chart && riderKg != null && !chart.points?.length && chart.bands?.length) {
      // Band chart (RockShox, 02C section 5): show the published range, never collapse it to one number.
      const band = chart.bands.find((b) => (b.kg_min == null || riderKg >= b.kg_min) && (b.kg_max == null || riderKg < b.kg_max));
      if (!band) {
        return { ...base, value: null, provenance: 'unknown', source: null, settleWith: 'Your weight is outside the published chart. Set pressure by sag and enter it.' };
      }
      const notes = [basisNote(chart.basis)].filter((n): n is string => !!n);
      if (chart.ebike_offset_psi) notes.push(`On an e-bike the chart adds ${chart.ebike_offset_psi} psi (not applied here).`);
      return {
        ...base, value: null, provenance: provenanceOf(chart.confidence), notes,
        range: { min: band.psi_min, max: band.psi_max, text: describePsiBand(band), forWeight: describeKgBand(band) },
        source: `${bike.fork!.airSpring?.name ?? 'Air spring'} pressure chart, ${describeKgBand(band)}`,
        settleWith: `Set yours inside ${describePsiBand(band)} and enter it.`,
      };
    }
    if (chart && riderKg != null && chart.points?.length) {
      const read = readChart(chart.points, riderKg, chart.point_type);
      if (read.value != null) {
        const notes = [basisNote(chart.basis), ...overlayNotes(bike, 'pressure_charts', chart.id)].filter((n): n is string => !!n);
        if (chart.point_type == null) notes.push('Chart shape not recorded; read as a smooth curve.');
        return {
          ...base, value: Math.round(read.value), provenance: provenanceOf(chart.confidence),
          source: `${bike.fork!.airSpring?.name ?? 'Air spring'} pressure chart at ${riderKg} kg`, notes, settleWith: null,
        };
      }
      return { ...base, value: null, provenance: 'unknown', source: null, settleWith: `Your weight is ${read.why}. Set pressure by sag instead.` };
    }
    return {
      ...base, value: null, provenance: 'unknown', source: null,
      settleWith: riderKg == null ? 'Enter your kitted weight.' : 'No pressure chart for this air spring yet. Set pressure by sag and enter it.',
    };
  }
  if (field === 'shock_psi') {
    return {
      ...base, value: null, provenance: 'unknown', source: null,
      settleWith: 'Shock pressure depends on the frame\'s leverage, which is not on file. Set it by sag and enter it.',
    };
  }

  // Spacers: the factory count is published where known.
  if (field === 'fork_spacers' || field === 'shock_spacers') {
    const n = field === 'fork_spacers' ? bike.fork!.airSpring?.spacer_factory : bike.shock!.unit?.spacer_factory;
    const conf = field === 'fork_spacers' ? bike.fork!.airSpring?.confidence : bike.shock!.unit?.confidence;
    if (n != null) {
      return { ...base, value: n, provenance: provenanceOf(conf ?? 'published'), source: 'Factory fitted count', notes: ['Only right if nobody has changed them since.'], settleWith: null };
    }
    return { ...base, value: null, provenance: 'unknown', source: null, settleWith: 'Factory spacer count not published. Count them when the air cap is off, or enter what you know.' };
  }

  if (field === 'tyre_front' || field === 'tyre_rear') {
    return {
      ...base, value: null, provenance: 'unknown', source: null,
      settleWith: 'Tyre starting pressures arrive with the tyre model (harvest stage 4). Enter what you run now, checked cold.',
    };
  }
  return { ...base, value: null, provenance: 'unknown', source: null, settleWith: null };
}

function settingFromChart(chart: SettingChart, cap: Capability, key: AdjusterKey, riderKg: number | null): Omit<StartingValue, 'field'> | null {
  if (riderKg == null) return null;
  const read = readChart(chart.points, riderKg, chart.point_type);
  if (read.value == null) return null;
  const isRebound = key === 'lsr' || key === 'hsr';
  // Store rebound as clicks from closed and clicked compression as clicks from open (see Settings).
  // Converting the other convention needs the documented total.
  const native = isRebound ? 'clicks_from_closed' : 'clicks_from_open';
  let value: number | null = null;
  if (chart.unit === 'position') value = cap.state === 'coarse' ? read.value : null;
  else if (chart.unit === native) value = read.value;
  else if (cap.max) value = cap.max.value - read.value;
  if (value == null) return null;
  const notes = [basisNote(chart.basis)].filter((n): n is string => !!n);
  if (chart.confidence !== 'published' && chart.confidence_note) notes.push(chart.confidence_note);
  return {
    value: Math.round(value), provenance: provenanceOf(chart.confidence),
    source: `Manufacturer recommendation at ${riderKg} kg (${chart.unit.replace(/_/g, ' ')})`, notes, settleWith: null,
  };
}

/** One note per overlay reason (several fields often share one), for research and estimate fills only. */
function overlayNotes(bike: BikeContext, table: string, id: string): string[] {
  const fills = bike.annotations.filter((a) => a.kind === 'overlay' && a.table === table && a.id === id && a.basis !== 'correction');
  const byReason = new Map<string, string[]>();
  for (const a of fills) byReason.set(a.reason, [...(byReason.get(a.reason) ?? []), a.path.replace(/_/g, ' ')]);
  return [...byReason].map(([reason, paths]) => `Chart ${paths.join(' and ')} filled by ${fills.find((a) => a.reason === reason)!.basis}, not read from the source document: ${reason}`);
}

export interface SpringAdvice {
  /** "Blue (Firm)", or null when no spring is listed for this weight. */
  spring: string | null;
  forWeight: string | null;
  provenance: Provenance;
  note: string;
}

/**
 * Coil forks set spring rate by swapping the spring (02C section 6). RockShox publishes colours by weight band,
 * shown as a published figure. Null for air forks.
 */
export function springAdvice(bike: BikeContext, riderKg: number | null): SpringAdvice | null {
  const s = bike.fork?.airSpring;
  if (!s || s.type !== 'coil') return null;
  if (!s.coil_chart?.length) {
    return { spring: null, forWeight: null, provenance: 'unknown', note: 'Spring options for this fork are not on file. Ask your shop which spring rates it takes.' };
  }
  if (riderKg == null) return { spring: null, forWeight: null, provenance: 'unknown', note: 'Enter your kitted weight to see which spring the manufacturer lists.' };
  const band = s.coil_chart.find((b) => (b.kg_min == null || riderKg >= b.kg_min) && (b.kg_max == null || riderKg < b.kg_max));
  if (!band) {
    const top = s.coil_chart[s.coil_chart.length - 1];
    return { spring: null, forWeight: null, provenance: 'unknown', note: `No spring is listed over ${top.kg_max} kg. Ask your shop about the firmest available.` };
  }
  return {
    spring: `${band.colour} (${band.label})`,
    forWeight: describeKgBand(band),
    provenance: provenanceOf(s.confidence),
    note: 'Coil forks change spring rate by swapping the spring, not by air pressure.',
  };
}

/** Where a rider's pressure sits against a published range. */
export function rangeStatus(value: number | null, range: PublishedRange | null | undefined): 'inside' | 'below' | 'above' | null {
  if (value == null || !range) return null;
  if (range.min != null && value < range.min) return 'below';
  if (range.max != null && value > range.max) return 'above';
  return 'inside';
}

/** Starting values for every field, keyed by field. */
export function startingValues(bike: BikeContext, riderKg: number | null): Record<SettingField, StartingValue> {
  return Object.fromEntries(ALL_FIELDS.map((f) => [f, startingValue(f, bike, riderKg)])) as Record<SettingField, StartingValue>;
}

/** "Now" values: the rider's own entries win; starting values fill the rest when published, derived or estimated. */
export function nowValues(starts: Record<SettingField, StartingValue>, entered: Settings): Settings {
  const out: Settings = {};
  for (const f of ALL_FIELDS) {
    const e = entered[f];
    out[f] = e != null ? e : starts[f].value;
  }
  return out;
}

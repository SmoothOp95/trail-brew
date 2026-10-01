import type { DataIndex } from '../data/ingest/types';
import { RESERVED_DAMPERS } from '../data/pending';
import { STAND_INS } from '../data/standins';
import { modelLabel, type ForkSpec, type ShockSpec } from '../engine/bike';

/**
 * The component picker: brand, then model, then travel. Built so there are no gaps:
 *  - every fork and shock unit on file, including composed units and units whose damper is pending;
 *  - for FOX families, every travel the chassis accepts, falling back to the nearest travel on file;
 *  - closest-match stand-ins for brands and families with no data (data/standins.ts).
 * Each entry says what it is, so the rider can always tell a documented part from a closest match.
 */
export type EntryStatus = 'on_file' | 'estimate' | 'pending' | 'closest';

export interface TravelOption<S> {
  travel: number | null;
  spec: S;
  /** False when this travel is served by the nearest travel on file. */
  exact: boolean;
  note?: string;
}

export interface CatalogueModel<S = ForkSpec | ShockSpec> {
  key: string;
  kind: 'fork' | 'shock';
  brand: string;
  model: string;
  status: EntryStatus;
  /** One line explaining a non on-file status. */
  statusNote: string | null;
  damperName: string | null;
  modelCodes: string[];
  options: TravelOption<S>[];
}

const BRAND_ORDER = ['FOX', 'RockShox', 'Marzocchi', 'X-Fusion', 'SR Suntour'];
export const brandRank = (b: string) => {
  const i = BRAND_ORDER.indexOf(b);
  return i === -1 ? BRAND_ORDER.length : i;
};

const STATUS_NOTE: Record<Exclude<EntryStatus, 'on_file'>, string> = {
  estimate: 'Composed from records on file; treat its figures as an estimate.',
  pending: 'Damper adjuster data not on file yet: spring, token and tyre advice only.',
  closest: 'Not on file yet: uses the closest documented part for its dials. No figures are borrowed.',
};

function sortModels<T extends { brand: string; model: string; status: EntryStatus }>(rows: T[]): T[] {
  const statusRank: Record<EntryStatus, number> = { on_file: 0, estimate: 1, pending: 2, closest: 3 };
  return rows.sort((a, b) => brandRank(a.brand) - brandRank(b.brand) || a.brand.localeCompare(b.brand) || statusRank[a.status] - statusRank[b.status] || a.model.localeCompare(b.model, undefined, { numeric: true }));
}

export function forkCatalogue(index: DataIndex): CatalogueModel<ForkSpec>[] {
  const groups = new Map<string, typeof index.fork_units[string][]>();
  for (const u of Object.values(index.fork_units)) {
    const k = modelLabel(u);
    groups.set(k, [...(groups.get(k) ?? []), u]);
  }
  const models: CatalogueModel<ForkSpec>[] = [];
  for (const [label, units] of groups) {
    units.sort((a, b) => a.travel_mm - b.travel_mm);
    const first = units[0];
    const chassis = index.chassis[first.chassis_id];
    const pending = !index.dampers[first.damper_id];
    const status: EntryStatus = pending ? 'pending' : units.some((u) => u.confidence === 'estimated') ? 'estimate' : 'on_file';
    const options: TravelOption<ForkSpec>[] = units.map((u) => ({ travel: u.travel_mm, spec: { unitId: u.id }, exact: true }));
    // FOX publishes one damper per tier across every travel the chassis takes; fill the travels with no record.
    if (chassis?.brand === 'FOX' && chassis.travel_options_mm) {
      for (const t of chassis.travel_options_mm) {
        if (units.some((u) => u.travel_mm === t)) continue;
        const nearest = [...units].sort((a, b) => Math.abs(a.travel_mm - t) - Math.abs(b.travel_mm - t) || b.travel_mm - a.travel_mm)[0];
        options.push({ travel: t, spec: { unitId: nearest.id, travel: t }, exact: false, note: `closest on file: ${nearest.travel_mm} mm` });
      }
      options.sort((a, b) => (a.travel ?? 0) - (b.travel ?? 0));
    }
    models.push({
      key: `fork:${label}`,
      kind: 'fork',
      brand: chassis?.brand ?? first.display_name.split(' ')[0],
      model: label.replace(new RegExp(`^${chassis?.brand ?? ''}\\s`), ''),
      status,
      statusNote: status === 'on_file' ? null : STATUS_NOTE[status],
      damperName: index.dampers[first.damper_id]?.name ?? RESERVED_DAMPERS[first.damper_id]?.name ?? null,
      modelCodes: [...new Set(units.map((u) => u.model_code).filter((c): c is string => !!c))],
      options,
    });
  }
  for (const st of STAND_INS.filter((s) => s.kind === 'fork')) {
    models.push({
      key: `fork:${st.id}`,
      kind: 'fork',
      brand: st.brand,
      model: st.model,
      status: 'closest',
      statusNote: `${STATUS_NOTE.closest} Closest: ${st.target}.`,
      damperName: null,
      modelCodes: [],
      options: (st.travels ?? [null]).map((t) => ({ travel: t, spec: { standInId: st.id, ...(t != null ? { travel: t } : {}) }, exact: false })),
    });
  }
  return sortModels(models);
}

export function shockCatalogue(index: DataIndex): CatalogueModel<ShockSpec>[] {
  const models: CatalogueModel<ShockSpec>[] = Object.values(index.shock_units).map((u) => {
    const pending = !index.dampers[u.damper_id];
    const status: EntryStatus = pending ? 'pending' : u.confidence === 'estimated' ? 'estimate' : 'on_file';
    return {
      key: `shock:${u.id}`,
      kind: 'shock' as const,
      brand: u.brand,
      model: u.display_name.replace(new RegExp(`^${u.brand}\\s`), ''),
      status,
      statusNote: status === 'on_file' ? null : STATUS_NOTE[status],
      damperName: index.dampers[u.damper_id]?.name ?? RESERVED_DAMPERS[u.damper_id]?.name ?? null,
      modelCodes: u.model_code ? [u.model_code] : [],
      options: [{ travel: null, spec: { unitId: u.id }, exact: true }],
    };
  });
  for (const st of STAND_INS.filter((s) => s.kind === 'shock')) {
    models.push({
      key: `shock:${st.id}`,
      kind: 'shock',
      brand: st.brand,
      model: st.model,
      status: 'closest',
      statusNote: `${STATUS_NOTE.closest} Closest: ${st.target}.`,
      damperName: null,
      modelCodes: [],
      options: [{ travel: null, spec: { standInId: st.id }, exact: false }],
    });
  }
  return sortModels(models);
}

/** The catalogue entry and option a spec came from, for showing the current selection in the picker. */
export function findOption<S extends ForkSpec | ShockSpec>(models: CatalogueModel<S>[], spec: S | null) {
  if (!spec) return null;
  const same = (a: object, b: object) => JSON.stringify(a) === JSON.stringify(b);
  for (const m of models) {
    const o = m.options.find((x) => same(x.spec, spec));
    if (o) return { model: m, option: o };
  }
  return null;
}

/** Free-text search over the catalogue: brand, model, damper and model code. */
export function searchCatalogue<S extends ForkSpec | ShockSpec>(models: CatalogueModel<S>[], query: string): CatalogueModel<S>[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return models;
  return models.filter((m) => {
    const hay = `${m.brand} ${m.model} ${m.damperName ?? ''} ${m.modelCodes.join(' ')} ${m.options.map((o) => o.travel ?? '').join(' ')}`.toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

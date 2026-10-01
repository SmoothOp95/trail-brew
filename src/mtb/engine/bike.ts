import type { DataIndex } from '../data/ingest/types';
import type { AirSpring, ForkUnit, ShockUnit } from '../data/schema/tables';
import { RESERVED_DAMPERS } from '../data/pending';
import { STAND_INS, type StandIn } from '../data/standins';
import { genericFork, genericShock } from './generic';
import type { BikeContext, PendingDamper, ResolvedFork, ResolvedShock, StandInInfo, SuspensionType } from './types';

/**
 * unitId: a unit on file. `travel` asks for a travel the unit family has no record for: the nearest unit is
 * used with its travel-specific figures stripped.
 * chassisId/damperId/airSpringId: manual pick.
 * standInId: a part not on file, resolved to the closest documented family (data/standins.ts).
 * generic: the rider's own part, known by travel only (engine/generic.ts).
 */
/** The high speed dials the rider says the part has. Missing means no: never offer a dial they may not have. */
export interface GenericDials { hsc?: boolean; hsr?: boolean }
export type GenericSpec = { generic: true; travel: number | null; dials?: GenericDials };
export type ForkSpec =
  | GenericSpec
  | { unitId: string; travel?: number }
  | { chassisId: string; damperId: string; airSpringId: string | null }
  | { standInId: string; travel?: number };
export type ShockSpec = GenericSpec | { unitId: string } | { damperId: string } | { standInId: string };

export interface BikeSpec {
  suspension: SuspensionType;
  fork: ForkSpec | null;
  shock: ShockSpec | null;
}

export class BikeResolutionError extends Error {}

/** The model label a unit is grouped under in the picker: its display name without the travel. */
export function modelLabel(u: { display_name: string; travel_mm?: number }): string {
  return u.travel_mm == null ? u.display_name : u.display_name.replace(new RegExp(`\\s${u.travel_mm}(?=\\s|$)`), '');
}

/** Build the engine's view of a bike. Throws only for ids that are not in the dataset at all. */
export function resolveBike(index: DataIndex, spec: BikeSpec): BikeContext {
  const fork = spec.fork ? resolveFork(index, spec.fork) : null;
  // A hardtail has no rear shock, whatever the spec says.
  const shock = spec.shock && spec.suspension === 'full_suspension' ? resolveShock(index, spec.shock) : null;

  const keys = new Set<string>();
  if (fork && !fork.standIn && !fork.generic) {
    if (fork.unit) keys.add(`fork_units:${fork.unit.id}`);
    keys.add(`chassis:${fork.chassis.id}`);
    if (fork.damper) keys.add(`dampers:${fork.damper.id}`);
    if (fork.airSpring) keys.add(`air_springs:${fork.airSpring.id}`);
    if (fork.pressureChart) keys.add(`pressure_charts:${fork.pressureChart.id}`);
    fork.settingCharts.forEach((c) => keys.add(`setting_charts:${c.id}`));
  }
  if (shock && !shock.standIn && !shock.generic) {
    if (shock.unit) keys.add(`shock_units:${shock.unit.id}`);
    if (shock.damper) keys.add(`dampers:${shock.damper.id}`);
    shock.settingCharts.forEach((c) => keys.add(`setting_charts:${c.id}`));
  }
  const annotations = [...keys].flatMap((k) => index.annotations[k] ?? []);
  return { suspension: spec.suspension, fork, shock, annotations };
}

function need<T>(value: T | undefined, what: string): T {
  if (!value) throw new BikeResolutionError(`${what} is not in the dataset`);
  return value;
}

/** A unit whose damper record is missing: pending if the unit declares it, otherwise an error. */
function damperFor(index: DataIndex, u: { damper_id: string; fields_pending?: { field: string }[] }) {
  const damper = index.dampers[u.damper_id];
  if (damper) return { damper, pendingDamper: null as PendingDamper | null };
  if (u.fields_pending?.some((p) => p.field === 'damper_id')) {
    return { damper: null, pendingDamper: { id: u.damper_id, name: RESERVED_DAMPERS[u.damper_id]?.name ?? u.damper_id } };
  }
  throw new BikeResolutionError(`Damper ${u.damper_id} is not in the dataset`);
}

function standInFor(id: string): StandIn {
  return need(STAND_INS.find((s) => s.id === id), `Stand-in ${id}`);
}

function nearestByTravel<T extends { travel_mm: number }>(units: T[], travel: number | undefined): T {
  if (!units.length) throw new BikeResolutionError('No units in the target family');
  if (travel == null) return units[Math.floor(units.length / 2)];
  return [...units].sort((a, b) => Math.abs(a.travel_mm - travel) - Math.abs(b.travel_mm - travel) || b.travel_mm - a.travel_mm)[0];
}

/** Strip the figures that belong to one specific part, keeping only its adjuster layout and spring type. */
function stripSpring(s: AirSpring | null, springType?: 'air' | 'coil'): AirSpring | null {
  if (!s) return null;
  return {
    ...s,
    type: springType ?? s.type,
    spacer_pn: null, spacer_volume_cc: null, spacer_factory: null, spacer_max: null,
    pressure_max_psi: null, pressure_min_psi: null, sag_target_pct: null, coil_chart: null, spring_rates_lbin: null,
  };
}

function resolveFork(index: DataIndex, spec: ForkSpec): ResolvedFork {
  if ('generic' in spec) return genericFork(spec.travel, spec.dials);
  if ('standInId' in spec) {
    const st = standInFor(spec.standInId);
    if (st.kind !== 'fork') throw new BikeResolutionError(`${st.model} is a shock`);
    const family = Object.values(index.fork_units).filter((u) => modelLabel(u) === st.target);
    const target = nearestByTravel(family, spec.travel);
    const base = resolveFork(index, { unitId: target.id });
    const travel = spec.travel ?? target.travel_mm;
    return {
      ...base,
      unit: null,
      label: `${st.brand} ${st.model} ${travel}`,
      airSpring: stripSpring(base.airSpring, st.spring),
      pressureChart: null,
      settingCharts: [],
      standIn: { id: st.id, label: `${st.brand} ${st.model}`, targetLabel: modelLabel(target), reason: st.reason, stage: st.stage },
    };
  }

  let unit: ForkUnit | null = null;
  let chassisId: string, airSpringId: string | null;
  let damperInfo: { damper: ResolvedFork['damper']; pendingDamper: PendingDamper | null };
  if ('unitId' in spec) {
    unit = need(index.fork_units[spec.unitId], `Fork ${spec.unitId}`);
    ({ chassis_id: chassisId, air_spring_id: airSpringId } = unit);
    damperInfo = damperFor(index, unit);
  } else {
    ({ chassisId, airSpringId } = spec);
    damperInfo = { damper: need(index.dampers[spec.damperId], `Damper ${spec.damperId}`), pendingDamper: null };
  }
  const { damper, pendingDamper } = damperInfo;
  const chassis = need(index.chassis[chassisId], `Chassis ${chassisId}`);
  if (damper && damper.type !== 'fork') throw new BikeResolutionError(`${damper.name} is a shock damper`);
  const airSpring = airSpringId ? need(index.air_springs[airSpringId], `Air spring ${airSpringId}`) : null;
  const pressureChart = airSpring ? Object.values(index.pressure_charts).find((c) => c.air_spring_id === airSpring.id) ?? null : null;
  const settingCharts = damper ? Object.values(index.setting_charts).filter((c) => c.damper_id === damper.id) : [];
  const label = unit?.display_name ?? `${chassis.brand} ${chassis.model} (${damper?.name ?? pendingDamper?.name})`;
  const resolved: ResolvedFork = { unit, label, chassis, damper, pendingDamper, airSpring, pressureChart, settingCharts, standIn: null };

  // A travel the family has no record for: nearest travel, travel-specific figures stripped.
  if (unit && 'travel' in spec && spec.travel != null && spec.travel !== unit.travel_mm) {
    const info: StandInInfo = {
      id: `travel:${unit.id}:${spec.travel}`,
      label: `${modelLabel(unit)} ${spec.travel}`,
      targetLabel: unit.display_name,
      reason: `No ${spec.travel} mm record on file, so the ${unit.travel_mm} mm version is used for its dials. Pressure, token and setting figures change with travel, so they are not borrowed.`,
      stage: unit.chassis_id.startsWith('fox_') ? '02 FOX spec sheet' : '02b',
    };
    return { ...resolved, label: info.label, airSpring: stripSpring(airSpring), pressureChart: null, settingCharts: [], standIn: info };
  }
  return resolved;
}

function stripShock(u: ShockUnit | null): ShockUnit | null {
  if (!u) return null;
  return { ...u, spacer_pn: null, spacer_volume_cc: null, spacer_factory: null, spacer_max: null, sag_target_pct: null, pressure_max_psi: null };
}

function resolveShock(index: DataIndex, spec: ShockSpec): ResolvedShock {
  if ('generic' in spec) return genericShock(spec.travel, spec.dials);
  if ('standInId' in spec) {
    const st = standInFor(spec.standInId);
    if (st.kind !== 'shock') throw new BikeResolutionError(`${st.model} is a fork`);
    const target = need(Object.values(index.shock_units).find((u) => modelLabel(u) === st.target), `Stand-in target ${st.target}`);
    const base = resolveShock(index, { unitId: target.id });
    return {
      ...base,
      unit: base.unit ? { ...stripShock(base.unit)!, display_name: `${st.brand} ${st.model}` } : null,
      label: `${st.brand} ${st.model}`,
      settingCharts: [],
      standIn: { id: st.id, label: `${st.brand} ${st.model}`, targetLabel: target.display_name, reason: st.reason, stage: st.stage },
    };
  }
  const unit = 'unitId' in spec ? need(index.shock_units[spec.unitId], `Shock ${spec.unitId}`) : null;
  const { damper, pendingDamper } = unit
    ? damperFor(index, unit)
    : { damper: need(index.dampers[(spec as { damperId: string }).damperId], 'Shock damper'), pendingDamper: null };
  if (damper && damper.type !== 'shock') throw new BikeResolutionError(`${damper.name} is a fork damper`);
  const settingCharts = damper ? Object.values(index.setting_charts).filter((c) => c.damper_id === damper.id) : [];
  const label = unit?.display_name ?? `${damper?.brand} ${damper?.name}`;
  return { unit, label, damper, pendingDamper, settingCharts, standIn: null };
}

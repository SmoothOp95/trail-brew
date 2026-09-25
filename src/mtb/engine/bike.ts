import type { DataIndex } from '../data/ingest/types';
import type { BikeContext, ResolvedFork, ResolvedShock, SuspensionType } from './types';

export type ForkSpec = { unitId: string } | { chassisId: string; damperId: string; airSpringId: string | null };
export type ShockSpec = { unitId: string } | { damperId: string };

export interface BikeSpec {
  suspension: SuspensionType;
  fork: ForkSpec | null;
  shock: ShockSpec | null;
}

export class BikeResolutionError extends Error {}

/** Build the engine's view of a bike from unit ids (component search) or hand-picked parts (manual pick). */
export function resolveBike(index: DataIndex, spec: BikeSpec): BikeContext {
  const fork = spec.fork ? resolveFork(index, spec.fork) : null;
  // A hardtail has no rear shock, whatever the spec says.
  const shock = spec.shock && spec.suspension === 'full_suspension' ? resolveShock(index, spec.shock) : null;

  const keys = new Set<string>();
  if (fork) {
    if (fork.unit) keys.add(`fork_units:${fork.unit.id}`);
    keys.add(`chassis:${fork.chassis.id}`).add(`dampers:${fork.damper.id}`);
    if (fork.airSpring) keys.add(`air_springs:${fork.airSpring.id}`);
    if (fork.pressureChart) keys.add(`pressure_charts:${fork.pressureChart.id}`);
    fork.settingCharts.forEach((c) => keys.add(`setting_charts:${c.id}`));
  }
  if (shock) {
    if (shock.unit) keys.add(`shock_units:${shock.unit.id}`);
    keys.add(`dampers:${shock.damper.id}`);
    shock.settingCharts.forEach((c) => keys.add(`setting_charts:${c.id}`));
  }
  const annotations = [...keys].flatMap((k) => index.annotations[k] ?? []);
  return { suspension: spec.suspension, fork, shock, annotations };
}

function need<T>(value: T | undefined, what: string): T {
  if (!value) throw new BikeResolutionError(`${what} is not in the dataset`);
  return value;
}

function resolveFork(index: DataIndex, spec: ForkSpec): ResolvedFork {
  let unit = null;
  let chassisId: string, damperId: string, airSpringId: string | null;
  if ('unitId' in spec) {
    unit = need(index.fork_units[spec.unitId], `Fork ${spec.unitId}`);
    ({ chassis_id: chassisId, damper_id: damperId, air_spring_id: airSpringId } = unit);
  } else {
    ({ chassisId, damperId, airSpringId } = spec);
  }
  const chassis = need(index.chassis[chassisId], `Chassis ${chassisId}`);
  const damper = need(index.dampers[damperId], `Damper ${damperId}`);
  if (damper.type !== 'fork') throw new BikeResolutionError(`${damper.name} is a shock damper`);
  const airSpring = airSpringId ? need(index.air_springs[airSpringId], `Air spring ${airSpringId}`) : null;
  const pressureChart = airSpring
    ? Object.values(index.pressure_charts).find((c) => c.air_spring_id === airSpring.id) ?? null
    : null;
  const settingCharts = Object.values(index.setting_charts).filter((c) => c.damper_id === damper.id);
  const label = unit?.display_name ?? `${chassis.brand} ${chassis.model} (${damper.name})`;
  return { unit, label, chassis, damper, airSpring, pressureChart, settingCharts };
}

function resolveShock(index: DataIndex, spec: ShockSpec): ResolvedShock {
  const unit = 'unitId' in spec ? need(index.shock_units[spec.unitId], `Shock ${spec.unitId}`) : null;
  const damper = need(index.dampers[unit ? unit.damper_id : (spec as { damperId: string }).damperId], 'Shock damper');
  if (damper.type !== 'shock') throw new BikeResolutionError(`${damper.name} is a fork damper`);
  const settingCharts = Object.values(index.setting_charts).filter((c) => c.damper_id === damper.id);
  return { unit, label: unit?.display_name ?? `${damper.brand} ${damper.name}`, damper, settingCharts };
}

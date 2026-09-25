import type { Goal, Rules } from '../rules/rules.schema';
import { resolveCapability } from './capability';
import { fieldGroup, sortByOrdering, type OrderGroupId } from './ordering';
import type { BikeContext, Capability, CapabilityState, FieldUnit, SettingField, Settings } from './types';

export const MAX_GOALS = 3;

export interface Clamp {
  bound: 'min' | 'max';
  limit: number;
  source: string;
}

export interface Change {
  field: SettingField;
  label: string;
  state: Exclude<CapabilityState, 'absent'>;
  unit: FieldUnit;
  group: OrderGroupId;
  /** Summed delta the goals asked for. */
  requested: number;
  /** Delta actually proposed after clamping. For coarse moves: -1, 0 or +1 position. */
  delta: number;
  /** Rider's now value, or null when unknown: the change is then relative. */
  from: number | null;
  to: number | null;
  goals: string[];
  rationale: string[];
  coarseNote?: string;
  positions?: string[];
  clamp?: Clamp;
  /** Opposing goals netted this field to near zero (07 net-zero rule). */
  netZero: boolean;
  /** The change is made on a nested sub adjuster (FIT4 Open Mode Adjust) because the parent sits in its position. */
  subAdjuster?: string;
  capability: Capability;
}

export interface RuledOut {
  field: SettingField;
  label: string;
  reason: string;
  goals: string[];
}

export interface NetZero {
  field: SettingField;
  label: string;
  net: number;
  gross: number;
  goals: string[];
}

export interface Proposal {
  goals: Goal[];
  /** Goals hidden because they do not apply to this bike (hardtail), never shown greyed out. */
  hiddenGoals: string[];
  changes: Change[];
  ruledOut: RuledOut[];
  netZero: NetZero[];
  /** Components whose adjustment headroom is not published, disclosed once per screen. */
  headroomUnknown: string[];
  next: Settings;
}

/** Goals that apply to this bike. Goals that do not are hidden, not greyed out (05 §3). */
export function visibleGoals(rules: Rules, bike: BikeContext): Goal[] {
  return rules.goals.filter((g) => g.applies_to.includes(bike.suspension));
}

/** The recipe this bike gets from a goal: the hardtail branch strips shock fields and redistributes (05 §3). */
export function effectiveRecipe(goal: Goal, bike: BikeContext, rules: Rules): Partial<Record<SettingField, number | string>> {
  if (bike.suspension !== 'hardtail') return goal.recipe;
  const base = goal.hardtail_recipe ?? goal.recipe;
  const out: Partial<Record<SettingField, number | string>> = {};
  for (const [f, d] of Object.entries(base) as [SettingField, number | string][]) {
    if (f.startsWith('shock_')) continue;
    out[f] = typeof d === 'number' && f.startsWith('tyre_') ? d * rules.hardtail.tyre_weight : d;
  }
  return out;
}

/** 07 v0.2: flag when |net| <= max(1 unit, 10% of the sum of |delta|), for opposing contributions only. */
export function isNetZero(contributions: number[]): boolean {
  if (!(contributions.some((d) => d > 0) && contributions.some((d) => d < 0))) return false;
  const net = contributions.reduce((a, b) => a + b, 0);
  const gross = contributions.reduce((a, b) => a + Math.abs(b), 0);
  return Math.abs(net) <= Math.max(1, 0.1 * gross);
}

const round = (field: SettingField, v: number) => (field.startsWith('tyre_') ? Math.round(v * 2) / 2 : Math.round(v));

/**
 * Compose up to three goals into a proposal (01_SCHEMA §12 composition rules, 07 v0.2 Goal composition):
 * resolve each delta against capability first, drop absent ones into ruled out, sum, clamp against real
 * component bounds only, flag net-zero fields, and record which goals drove each change.
 */
export function compose(goalIds: string[], rules: Rules, bike: BikeContext, now: Settings): Proposal {
  const visible = new Map(visibleGoals(rules, bike).map((g) => [g.id, g]));
  const hiddenGoals = goalIds.filter((id) => !visible.has(id));
  const goals = goalIds.filter((id) => visible.has(id)).slice(0, MAX_GOALS).map((id) => visible.get(id)!);

  const contributions = new Map<SettingField, { goal: string; delta: number }[]>();
  const ruled = new Map<SettingField, RuledOut>();
  const caps = new Map<SettingField, Capability>();

  for (const g of goals) {
    for (const [field, raw] of Object.entries(effectiveRecipe(g, bike, rules)) as [SettingField, number | string][]) {
      const cap = caps.get(field) ?? resolveCapability(field, bike);
      caps.set(field, cap);
      if (cap.state === 'absent' || typeof raw !== 'number') {
        const r = ruled.get(field) ?? { field, label: cap.label, reason: cap.reason ?? 'Not available on this hardware.', goals: [] };
        if (!r.goals.includes(g.id)) r.goals.push(g.id);
        ruled.set(field, r);
        continue;
      }
      const list = contributions.get(field) ?? [];
      list.push({ goal: g.id, delta: raw });
      contributions.set(field, list);
    }
  }

  const changes: Change[] = [];
  const netZero: NetZero[] = [];
  const next: Settings = { ...now };
  const headroom = new Set<string>();

  for (const [field, list] of contributions) {
    const cap = caps.get(field)!;
    const deltas = list.map((c) => c.delta);
    const requested = deltas.reduce((a, b) => a + b, 0);
    const gross = deltas.reduce((a, b) => a + Math.abs(b), 0);
    const zero = isNetZero(deltas);
    const goalsFor = [...new Set(list.map((c) => c.goal))];
    if (zero) netZero.push({ field, label: cap.label, net: requested, gross, goals: goalsFor });
    if (requested === 0) continue;

    const from = now[field] ?? null;
    let delta = cap.state === 'coarse' ? Math.sign(requested) : round(field, requested);
    let subAdjuster: string | undefined;
    let clamp: Clamp | undefined;
    let to: number | null = null;

    if (cap.state === 'coarse' && cap.sub && from === cap.sub.withinIndex) {
      // Parent sits in the sub adjuster's position: fine tune with counted clicks instead of moving the lever.
      subAdjuster = cap.sub.label;
      delta = Math.round(requested);
      if (cap.sub.headroomUnknown) headroom.add(`${cap.owner} ${cap.sub.label}`);
    } else if (from != null) {
      const target = from + delta;
      to = target;
      if (cap.max && target > cap.max.value) {
        to = cap.max.value;
        clamp = { bound: 'max', limit: cap.max.value, source: cap.max.source };
      } else if (cap.min && target < cap.min.value) {
        to = cap.min.value;
        clamp = { bound: 'min', limit: cap.min.value, source: cap.min.source };
      }
      to = round(field, to);
      delta = round(field, to - from);
      next[field] = to;
    }
    if (cap.state === 'counted' && cap.headroomUnknown && cap.owner && !subAdjuster) headroom.add(cap.owner);

    const goal = (id: string) => goals.find((g) => g.id === id)!;
    changes.push({
      field, label: subAdjuster ? `${cap.label}: ${subAdjuster}` : cap.label, state: subAdjuster ? 'counted' : (cap.state as Change['state']), unit: subAdjuster ? 'clicks' : cap.unit,
      group: fieldGroup(rules, field), requested, delta, from, to, goals: goalsFor,
      rationale: [...new Set(goalsFor.map((id) => goal(id).rationale[field]).filter((r): r is string => !!r))],
      coarseNote: subAdjuster ? undefined : cap.coarseNote, positions: cap.positions, clamp, netZero: zero, subAdjuster, capability: cap,
    });
  }

  return {
    goals,
    hiddenGoals,
    changes: sortByOrdering(rules, changes).filter((c) => c.delta !== 0 || c.clamp),
    ruledOut: sortByOrdering(rules, [...ruled.values()]),
    netZero,
    headroomUnknown: [...headroom],
    next,
  };
}

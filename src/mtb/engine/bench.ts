import { resolveCapability } from './capability';
import { MAX_GOALS, type Proposal } from './goals';
import type { BikeContext, Capability, SettingField, Settings } from './types';

/** Readout rows in prototype order, plus high speed rebound where the hardware has it. */
const READOUT_ORDER: SettingField[] = [
  'fork_psi', 'fork_spacers', 'fork_lsr', 'fork_hsr', 'fork_lsc', 'fork_hsc',
  'shock_psi', 'shock_spacers', 'shock_lsr', 'shock_hsr', 'shock_lsc', 'shock_hsc',
  'tyre_front', 'tyre_rear',
];

/**
 * Rows the readout shows. Absent fields are hidden entirely, which covers the lockout case: a lockout
 * lever is not a compression dial, so the compression row disappears (05 §10), and a hardtail has no shock rows.
 */
export function readoutRows(bike: BikeContext): Capability[] {
  return READOUT_ORDER.map((f) => resolveCapability(f, bike)).filter((c) => c.state !== 'absent');
}

// ---------- Bench state ----------

export interface BenchState {
  riderKg: number | null;
  bikeKey: string | null;
  /** The rider's own current settings. Starting values fill the gaps at render time. */
  entered: Settings;
  goals: string[];
  preconditionsDismissed: boolean;
}

export type BenchAction =
  | { type: 'setWeight'; kg: number | null }
  | { type: 'setBike'; key: string | null; entered?: Settings }
  | { type: 'toggleGoal'; id: string }
  | { type: 'clearGoals' }
  | { type: 'enter'; field: SettingField; value: number | null }
  | { type: 'apply'; next: Settings }
  | { type: 'reset'; entered?: Settings }
  | { type: 'dismissPreconditions' };

export const initialBench: BenchState = { riderKg: null, bikeKey: null, entered: {}, goals: [], preconditionsDismissed: false };

/**
 * Pure reducer. Fixes two prototype bugs: a weight edit recomputes starting values *and* clears staged
 * goals, so stale deltas are never carried forward; reset clears settings and goals but not the saved log.
 */
export function benchReducer(s: BenchState, a: BenchAction): BenchState {
  switch (a.type) {
    case 'setWeight':
      return s.riderKg === a.kg ? s : { ...s, riderKg: a.kg, goals: [] };
    case 'setBike':
      return { ...s, bikeKey: a.key, entered: a.entered ?? {}, goals: [], preconditionsDismissed: false };
    case 'toggleGoal': {
      if (s.goals.includes(a.id)) return { ...s, goals: s.goals.filter((g) => g !== a.id) };
      const goals = [...s.goals, a.id];
      // Prototype behaviour: a fourth pick drops the oldest.
      return { ...s, goals: goals.length > MAX_GOALS ? goals.slice(goals.length - MAX_GOALS) : goals };
    }
    case 'clearGoals':
      return { ...s, goals: [] };
    case 'enter':
      // The proposal is recomputed from the new value, so staged goals stay valid.
      return { ...s, entered: { ...s.entered, [a.field]: a.value } };
    case 'apply': {
      const entered: Settings = { ...s.entered };
      for (const [f, v] of Object.entries(a.next) as [SettingField, number | null][]) if (v != null) entered[f] = v;
      return { ...s, entered, goals: [] };
    }
    case 'reset':
      return { ...s, entered: a.entered ?? {}, goals: [] };
    case 'dismissPreconditions':
      return { ...s, preconditionsDismissed: true };
  }
}

// ---------- session log ----------

export type Verdict = 'better' | 'worse' | 'same';

export interface LapEntry {
  id: string;
  bike_key: string;
  date: string;
  lap: number;
  /** The label stage 6 needs: which goals were asked for. */
  goal_ids: string[];
  deltas: Partial<Record<SettingField, { from: number | null; to: number | null; delta: number }>>;
  /** Resulting settings after the change. */
  settings: Settings;
  ruled_out: SettingField[];
  note: string;
  verdict: Verdict | null;
}

/** Build a log entry that records the label (goal ids and field deltas), not just the end state. */
export function lapFromProposal(p: Proposal, meta: { id: string; bikeKey: string; date: string; lap: number }, now: Settings): LapEntry {
  const deltas: LapEntry['deltas'] = {};
  for (const c of p.changes) deltas[c.field] = { from: c.from, to: c.to, delta: c.delta };
  return {
    id: meta.id,
    bike_key: meta.bikeKey,
    date: meta.date,
    lap: meta.lap,
    goal_ids: p.goals.map((g) => g.id),
    deltas,
    settings: { ...now, ...p.next },
    ruled_out: p.ruledOut.map((r) => r.field),
    note: '',
    verdict: null,
  };
}

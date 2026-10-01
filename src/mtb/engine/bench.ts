import type { BikeSpec } from './bike';
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
/** One line per screen for a pending damper (02C section 10), or null. */
export function pendingNotices(bike: BikeContext): string[] {
  return [bike.fork, bike.shock]
    .filter((p): p is NonNullable<typeof p> => !!p && !p.damper && !!p.pendingDamper)
    .map((p) => `Damper adjuster data for the ${p.pendingDamper!.name} is not in the dataset yet, so rebound and compression rows are hidden. Spring, token and tyre settings still work.`);
}

export function readoutRows(bike: BikeContext, mode: SetupMode | null = 'advanced'): Capability[] {
  const fields = setupFields(mode);
  return READOUT_ORDER.filter((f) => fields.includes(f))
    .map((f) => resolveCapability(f, bike))
    .filter((c) => c.state !== 'absent' && c.state !== 'pending');
}

// ---------- Setup mode ----------

/**
 * Basic setup asks for tyre pressures and fork air pressure only, and the Bench proposes changes to those
 * alone. Advanced opens every setting the hardware has: rebound, compression, spacers and the shock.
 */
export type SetupMode = 'basic' | 'advanced';
export const BASIC_FIELDS: SettingField[] = ['fork_psi', 'tyre_front', 'tyre_rear'];

/** The fields a setup mode works with. No mode chosen yet reads as basic. */
export function setupFields(mode: SetupMode | null): SettingField[] {
  return mode === 'advanced' ? READOUT_ORDER : BASIC_FIELDS;
}

type PartSpec = BikeSpec['fork'] | BikeSpec['shock'];
export const isGeneric = (p: PartSpec) => !!p && 'generic' in p;
export const travelOf = (p: PartSpec) => (p && 'generic' in p ? p.travel : null);

/** What still stands between the rider and Tuning, in the order the form asks for it. Empty means ready. */
export function setupMissing(spec: BikeSpec, mode: SetupMode | null): string[] {
  const out: string[] = [];
  if (isGeneric(spec.fork) && travelOf(spec.fork) == null) out.push('Enter your fork travel');
  if (spec.suspension === 'full_suspension' && isGeneric(spec.shock) && travelOf(spec.shock) == null) out.push('Enter your rear travel');
  if (!mode) out.push('Choose Basic or Advanced setup');
  return out;
}

// ---------- Bench state ----------

export interface BenchState {
  riderKg: number | null;
  bikeKey: string | null;
  /** The rider's own current settings. Starting values fill the gaps at render time. */
  entered: Settings;
  goals: string[];
  preconditionsDismissed: boolean;
  /** Null until the rider picks Basic or Advanced; Tuning stays hidden until then. */
  mode: SetupMode | null;
}

export type BenchAction =
  | { type: 'setWeight'; kg: number | null }
  | { type: 'setBike'; key: string | null; entered?: Settings }
  | { type: 'toggleGoal'; id: string }
  | { type: 'clearGoals' }
  | { type: 'enter'; field: SettingField; value: number | null }
  | { type: 'apply'; next: Settings }
  | { type: 'reset'; entered?: Settings }
  | { type: 'dismissPreconditions' }
  | { type: 'setMode'; mode: SetupMode };

export const initialBench: BenchState = { riderKg: null, bikeKey: null, entered: {}, goals: [], preconditionsDismissed: false, mode: null };

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
    case 'setMode':
      // Goals stay staged: the proposal is recomputed against the new set of fields.
      return { ...s, mode: a.mode };
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

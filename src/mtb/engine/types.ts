import type { AirSpring, Chassis, Damper, ForkUnit, PressureChart, SettingChart, ShockUnit } from '../data/schema/tables';
import type { Annotation } from '../data/ingest/types';
import type { SettingField } from '../rules/rules.schema';

export type { SettingField };

export type SuspensionType = 'full_suspension' | 'hardtail';

/** 02C pending damper rule: the unit is known, its damper record is not written yet. */
export interface PendingDamper {
  id: string;
  name: string;
}

/** The part is not on file; the engine is using the closest documented unit's adjuster layout. */
export interface StandInInfo {
  id: string;
  label: string;
  targetLabel: string;
  reason: string;
  stage: string;
}

export interface ResolvedFork {
  /** Null when the rider picked chassis, damper and air spring by hand. */
  unit: ForkUnit | null;
  label: string;
  chassis: Chassis;
  /** Null while the damper is pending; see pendingDamper. */
  damper: Damper | null;
  pendingDamper: PendingDamper | null;
  airSpring: AirSpring | null;
  pressureChart: PressureChart | null;
  settingCharts: SettingChart[];
  standIn: StandInInfo | null;
  /** Set when the rider gave travel only (no brand or model): see engine/generic.ts. */
  generic?: { travel: number | null };
}

export interface ResolvedShock {
  unit: ShockUnit | null;
  label: string;
  damper: Damper | null;
  pendingDamper: PendingDamper | null;
  settingCharts: SettingChart[];
  standIn: StandInInfo | null;
  generic?: { travel: number | null };
}

/** Everything the engine needs to know about the rider's bike. */
export interface BikeContext {
  suspension: SuspensionType;
  fork: ResolvedFork | null;
  shock: ResolvedShock | null;
  /** Ingest annotations for the records involved, so provenance can explain an overlay or held-back figure. */
  annotations: Annotation[];
}

/**
 * The rider's own current settings, per field. null = not known. Units:
 *   *_psi, tyre_*: psi. *_spacers: count.
 *   *_lsr, *_hsr: clicks from fully closed, so higher is faster (05 §1).
 *   *_lsc, *_hsc on a clicks adjuster: clicks from fully open, so higher is firmer.
 *   *_lsc on a sweep or lever: index into the adjuster's positions (0 = first, usually open).
 *   flip_chip: index into the frame's flip chip states.
 */
export type Settings = Partial<Record<SettingField, number | null>>;

/**
 * counted / coarse / absent per 01_SCHEMA, plus pending (02C section 10): the adjuster may exist but its
 * damper record is not written yet. Pending is neither offered nor ruled out.
 */
export type CapabilityState = 'counted' | 'coarse' | 'absent' | 'pending';
export type FieldUnit = 'psi' | 'spacers' | 'clicks' | 'position' | 'state';

export interface Bound {
  value: number;
  /** Where the bound comes from, rider facing: "FOX FLOAT EVOL air spring maximum". */
  source: string;
}

export interface Capability {
  field: SettingField;
  state: CapabilityState;
  unit: FieldUnit;
  /** Rider-facing name of the thing being adjusted. */
  label: string;
  /** For absent: why, naming the hardware. */
  reason?: string;
  /** For coarse: the named positions. */
  positions?: string[];
  /** For coarse: why it is coarse. */
  coarseNote?: string;
  min: Bound | null;
  max: Bound | null;
  /** counted adjuster with no documented total: offer the change, never render a denominator. */
  headroomUnknown: boolean;
  /** For clicks: which way firmer or slower is. */
  direction?: 'cw_firmer' | 'cw_slower' | 'ccw_firmer' | 'ccw_slower';
  /** The damper or component that owns this adjuster, for headroom disclosure. */
  owner?: string;
  /** A finer adjuster nested inside one of this adjuster's positions (FIT4 Open Mode Adjust). */
  sub?: { withinIndex: number; withinPosition: string; label: string; max: Bound | null; headroomUnknown: boolean };
}

export type Provenance = 'published' | 'derived' | 'estimated' | 'unknown';

/** A published band for the rider's weight (02C section 5): shown as a range, never collapsed to one number. */
export interface PublishedRange {
  min: number | null;
  max: number | null;
  /** "75 to 85 psi", "under 75 psi", "125 psi or more". */
  text: string;
  /** "81 to 90 kg". */
  forWeight: string;
}

export interface StartingValue {
  field: SettingField;
  /** Set when the manufacturer publishes a range rather than a value. value stays null. */
  range?: PublishedRange | null;
  value: number | null;
  provenance: Provenance;
  /** Short rider-facing description of where the number came from. */
  source: string | null;
  /** Caveats a rider should see alongside the number. */
  notes: string[];
  /** For unknown: what would settle it. */
  settleWith: string | null;
}

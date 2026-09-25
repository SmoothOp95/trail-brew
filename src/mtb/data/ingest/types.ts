import type {
  AirSpring,
  Chassis,
  Damper,
  ForkUnit,
  PressureChart,
  SettingChart,
  ShockUnit,
  TableName,
} from '../schema/tables';

/** Raw input: parsed JSON per table. `undefined` means the file does not exist yet. */
export type RawTables = Partial<Record<TableName, unknown>>;

export interface Exclusion {
  table: TableName;
  id: string;
  reasons: string[];
}

/** A field ingest changed or refused on the way into the index. Raw files are never edited. */
export interface Annotation {
  table: TableName;
  id: string;
  path: string;
  kind: 'held_back' | 'derived' | 'overlay';
  original: unknown;
  value: unknown;
  reason: string;
  /** For overlay changes: why the value is trusted. */
  basis?: OverlayBasis;
}

/**
 * correction: fixes a raw record using evidence already in the project docs or the record's own note.
 * research:   taken from secondary research (search summaries of manufacturer documents that the
 *             session could not open directly). Better than nothing, not a primary source.
 * estimate:   best estimate, carried as confidence "estimated" and disclosed to the rider.
 */
export type OverlayBasis = 'correction' | 'research' | 'estimate';

export interface OverlayPatch {
  table: TableName;
  id: string;
  basis: OverlayBasis;
  reason: string;
  /** Dotted path -> value. Applied only where the raw value is null or missing, so harvests supersede it. */
  fill?: Record<string, unknown>;
  /** Dotted path -> value. Replaces the raw value, but only while it still equals `expect[path]`. */
  override?: Record<string, unknown>;
  expect?: Record<string, unknown>;
  /** Appended to fields_pending, skipping fields already listed or already populated. */
  pending?: { field: string; expected_source: string; tier?: string | null }[];
}

export interface Overlay {
  version: string;
  patches: OverlayPatch[];
  /** Whole records the harvest has not produced yet. Dropped automatically once a raw record with the same id exists. */
  records: Partial<Record<TableName, { basis: OverlayBasis; reason: string; record: Record<string, unknown> }[]>>;
}

export type FlagSeverity = 'info' | 'warning';

export interface DataFlag {
  code: string;
  severity: FlagSeverity;
  table: TableName;
  id: string;
  message: string;
}

export interface FieldStats {
  populated: number;
  /** null, and declared in fields_pending with an expected source */
  null_pending: number;
  /** null, with no fields_pending entry: indistinguishable from nobody having looked */
  null_bare: number;
  /** key missing from the record entirely (typically a field added in v0.3) */
  absent: number;
}

export interface TableCoverage {
  file_present: boolean;
  records: number;
  valid: number;
  excluded: number;
  fields: Record<string, FieldStats>;
  dangling_fks: { id: string; field: string; target: string }[];
  unknown_fields: { id: string; field: string }[];
}

export interface AdjusterCountStats {
  adjusters_present: number;
  adjusters_absent: number;
  by_type: Record<string, number>;
  count_with_basis: number;
  count_held_back: number;
  count_derived_from_positions: number;
  count_null_pending: number;
  count_null_bare: number;
  count_not_applicable: number;
}

export interface ShowableUnit {
  id: string;
  display_name: string;
  brand: string;
  tier: string;
  damper_id: string;
}

export interface BrandSummary {
  chassis: number;
  dampers: number;
  air_springs: number;
  pressure_charts: number;
  setting_charts: number;
  fork_units: number;
  shock_units: number;
}

export interface ReadinessGate {
  feature: string;
  meaningful_after: string;
  ready: boolean;
  evidence: string;
}

export interface Coverage {
  schema_version: string;
  tables: Record<TableName, TableCoverage>;
  adjuster_counts: AdjusterCountStats;
  annotations: Annotation[];
  exclusions: Exclusion[];
  flags: DataFlag[];
  showable: { fork_units: ShowableUnit[]; shock_units: ShowableUnit[] };
  brands: Record<string, BrandSummary>;
  readiness: ReadinessGate[];
}

export interface DataIndex {
  chassis: Record<string, Chassis>;
  dampers: Record<string, Damper>;
  air_springs: Record<string, AirSpring>;
  pressure_charts: Record<string, PressureChart>;
  setting_charts: Record<string, SettingChart>;
  fork_units: Record<string, ForkUnit>;
  shock_units: Record<string, ShockUnit>;
  /** Keyed `${table}:${id}` -> annotations, so the UI can explain a held-back figure. */
  annotations: Record<string, Annotation[]>;
}

export interface IngestResult {
  index: DataIndex;
  coverage: Coverage;
}

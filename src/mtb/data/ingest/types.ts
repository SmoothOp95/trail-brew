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
  kind: 'held_back' | 'derived';
  original: unknown;
  value: unknown;
  reason: string;
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

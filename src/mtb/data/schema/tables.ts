import { z } from 'zod';
import {
  Int,
  IntPair,
  NonNegInt,
  checkSag,
  checkSpacers,
  recordBase,
  requireNoteWhenEstimated,
} from './common';

/**
 * Zod schemas for 01_SCHEMA.md v0.3, harvested tables only.
 *
 * Fields the schema lists but real records leave null are `.nullable()`: in this
 * dataset null is a gap to be reported by coverage, not a reason to reject the record.
 * Fields added in v0.3 are `.optional()` because batch 1 records predate them.
 */

// ---------- 1. chassis ----------

export const Chassis = z
  .object({
    ...recordBase,
    brand: z.string().min(1),
    model: z.string().min(1),
    stanchion_mm: Int.nullable(),
    travel_options_mm: z.array(Int).nullable(),
    axle_std: z.string().nullable(),
    offset_options_mm: z.array(Int).nullable(),
    steerer: z.string().nullable(),
    wheel_sizes: z.array(z.string()).nullable(),
    max_rotor_mm: Int.nullable(),
    brake_mount: z.string().nullable(),
    year_range: IntPair.nullable(),
    /** Requested by 02B for identifier match. Not in 01_SCHEMA v0.3; accepted and flagged. */
    serial_format: z.string().nullable().optional(),
  })
  .superRefine(requireNoteWhenEstimated);
export type Chassis = z.infer<typeof Chassis>;

// ---------- 2. damper ----------

export const AdjusterType = z.enum(['clicks', 'sweep', 'lever', 'lockout']);
export type AdjusterType = z.infer<typeof AdjusterType>;

export const CountBasis = z.enum(['stated_total', 'functional_total', 'physical_count']);
export type CountBasis = z.infer<typeof CountBasis>;

export const Direction = z.enum(['cw_firmer', 'cw_slower', 'ccw_firmer', 'ccw_slower']);

/** v0.3 Nested adjusters. Offered only when the parent is in `within_position`. */
export const SubAdjuster = z.object({
  within_position: z.string().min(1),
  type: AdjusterType,
  count: NonNegInt.nullable().optional(),
  count_basis: CountBasis.nullable().optional(),
  usable_range: IntPair.nullable().optional(),
  label: z.string().min(1),
  direction: Direction.nullable().optional(),
});

export const Adjuster = z
  .object({
    type: AdjusterType,
    count: NonNegInt.nullable(),
    count_basis: CountBasis.nullable().optional(),
    usable_range: IntPair.nullable().optional(),
    positions: z.array(z.string().min(1)).nullable(),
    detented: z.boolean().nullable(),
    direction: Direction,
    sub_adjuster: SubAdjuster.nullable().optional(),
  })
  .superRefine((a, ctx) => {
    if (a.type !== 'clicks' && !(a.positions && a.positions.length >= 2)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['positions'], message: `${a.type} needs at least two named positions` });
    }
    if (a.type === 'lockout' && a.positions && a.positions.length !== 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['positions'], message: 'lockout is binary: exactly two positions' });
    }
    if (a.usable_range) {
      const [lo, hi] = a.usable_range;
      if (lo > hi) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['usable_range'], message: 'usable_range lo > hi' });
      if (a.count != null && hi > a.count) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['usable_range'], message: 'usable_range extends past count' });
      }
    }
    if (a.sub_adjuster && !a.positions?.includes(a.sub_adjuster.within_position)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sub_adjuster', 'within_position'],
        message: `within_position "${a.sub_adjuster.within_position}" is not one of the parent positions`,
      });
    }
  });
export type Adjuster = z.infer<typeof Adjuster>;

export const ADJUSTER_KEYS = ['lsc', 'hsc', 'lsr', 'hsr'] as const;
export type AdjusterKey = (typeof ADJUSTER_KEYS)[number];

/** Rule 3: all four keys present. A missing key is a hard fail, not a null. */
export const Adjusters = z.object({
  lsc: Adjuster.nullable(),
  hsc: Adjuster.nullable(),
  lsr: Adjuster.nullable(),
  hsr: Adjuster.nullable(),
});

export const Damper = z
  .object({
    ...recordBase,
    brand: z.string().min(1),
    name: z.string().min(1),
    tier: z.string().min(1),
    type: z.enum(['fork', 'shock']),
    adjusters: Adjusters,
    year_range: IntPair.nullable(),
  })
  .superRefine(requireNoteWhenEstimated);
export type Damper = z.infer<typeof Damper>;

// ---------- 3. air_spring ----------

export const AirSpring = z
  .object({
    ...recordBase,
    brand: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['air', 'coil']),
    negative: z.enum(['self_equalising', 'separate_chamber', 'none']).nullable(),
    chassis_id: z.string().min(1),
    tier_applies_to: z.array(z.string().min(1)).nullable().optional(),
    travel_mm: Int,
    spacer_pn: z.string().nullable(),
    spacer_volume_cc: z.number().nullable(),
    spacer_factory: NonNegInt.nullable(),
    spacer_max: NonNegInt.nullable(),
    pressure_max_psi: Int.nullable(),
    pressure_min_psi: Int.nullable().optional(),
    sag_target_pct: IntPair.nullable(),
    equalise_note: z.string().nullable(),
    spring_rates_lbin: z.array(Int).nullable().optional(),
  })
  .superRefine((r, ctx) => {
    requireNoteWhenEstimated(r, ctx);
    checkSag(r.sag_target_pct, ctx);
    checkSpacers(r, ctx);
    if (r.pressure_min_psi != null && r.pressure_max_psi != null && r.pressure_min_psi > r.pressure_max_psi) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['pressure_min_psi'], message: 'pressure_min_psi > pressure_max_psi' });
    }
  });
export type AirSpring = z.infer<typeof AirSpring>;

// ---------- 4. pressure_chart / 4b. setting_chart ----------

export const Basis = z.enum(['rider_only', 'rider_plus_kit']);
export const PointType = z.enum(['curve', 'bracket']);
export type PointType = z.infer<typeof PointType>;

/** Rule 4: ascending by kg, at least three points. */
function checkPoints(points: [number, number][], ctx: z.RefinementCtx) {
  if (points.length < 3) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['points'], message: 'fewer than three points (rule 4)' });
  }
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] <= points[i - 1][0]) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['points', i], message: 'points not strictly ascending by kg (rule 4)' });
      break;
    }
  }
}

export const PressureChart = z
  .object({
    ...recordBase,
    air_spring_id: z.string().min(1),
    points: z.array(z.tuple([z.number(), z.number()])),
    basis: Basis.nullable(),
    point_type: PointType.nullable().optional(),
    applies_to_travel_mm: z.array(Int).nullable().optional(),
  })
  .superRefine((r, ctx) => {
    requireNoteWhenEstimated(r, ctx);
    checkPoints(r.points, ctx);
  });
export type PressureChart = z.infer<typeof PressureChart>;

export const SettingChart = z
  .object({
    ...recordBase,
    damper_id: z.string().min(1),
    adjuster: z.enum(['lsc', 'hsc', 'lsr', 'hsr']),
    /** Required. Stored exactly as the source states it, never normalised. */
    unit: z.enum(['clicks_from_closed', 'clicks_from_open', 'position']),
    points: z.array(z.tuple([z.number(), z.number()])),
    basis: Basis.nullable(),
    point_type: PointType.nullable().optional(),
  })
  .superRefine((r, ctx) => {
    requireNoteWhenEstimated(r, ctx);
    checkPoints(r.points, ctx);
  });
export type SettingChart = z.infer<typeof SettingChart>;

// ---------- 5. fork_unit / 6. shock_unit ----------

const SaAvailability = z.enum(['oem_common', 'oem_rare', 'aftermarket', 'import_only']);
const ServiceInterval = z.record(z.string(), z.number());

export const ForkUnit = z
  .object({
    ...recordBase,
    display_name: z.string().min(1),
    chassis_id: z.string().min(1),
    damper_id: z.string().min(1),
    air_spring_id: z.string().min(1),
    travel_mm: Int,
    offset_mm: Int.nullable(),
    tier: z.string().min(1),
    model_year: Int,
    part_number: z.string().nullable(),
    /** Requested by 02B for identifier match. Not in 01_SCHEMA v0.3; accepted and flagged. */
    model_code: z.string().nullable().optional(),
    service_interval_h: ServiceInterval.nullable(),
    oil: z.record(z.string(), z.union([z.number(), z.string()])).nullable(),
    known_issues: z.array(z.string()),
    sa_availability: SaAvailability.nullable(),
  })
  .superRefine(requireNoteWhenEstimated);
export type ForkUnit = z.infer<typeof ForkUnit>;

export const ShockUnit = z
  .object({
    ...recordBase,
    display_name: z.string().min(1),
    brand: z.string().min(1),
    model: z.string().min(1),
    tier: z.string().min(1),
    model_year: Int,
    damper_id: z.string().min(1),
    mount: z.enum(['trunnion', 'eyelet']).nullable(),
    sizes: z.array(z.object({ ee_mm: z.number(), stroke_mm: z.number() })),
    air_can: z.enum(['evol_lv', 'evol_hv', 'standard', 'coil']).nullable(),
    spacer_pn: z.string().nullable(),
    spacer_volume_cc: z.number().nullable(),
    spacer_factory: NonNegInt.nullable(),
    spacer_max: NonNegInt.nullable(),
    sag_target_pct: IntPair.nullable(),
    pressure_max_psi: Int.nullable(),
    service_interval_h: ServiceInterval.nullable(),
    oem_tune: z.string().nullable(),
    part_number: z.string().nullable(),
    /** Requested by 02B for identifier match. Not in 01_SCHEMA v0.3; accepted and flagged. */
    model_code: z.string().nullable().optional(),
    sa_availability: SaAvailability.nullable(),
  })
  .superRefine((r, ctx) => {
    requireNoteWhenEstimated(r, ctx);
    checkSag(r.sag_target_pct, ctx);
    checkSpacers(r, ctx);
  });
export type ShockUnit = z.infer<typeof ShockUnit>;

// ---------- table registry ----------

export const TABLES = {
  chassis: { file: 'chassis.json', schema: Chassis },
  dampers: { file: 'dampers.json', schema: Damper },
  air_springs: { file: 'air_springs.json', schema: AirSpring },
  pressure_charts: { file: 'pressure_charts.json', schema: PressureChart },
  setting_charts: { file: 'setting_charts.json', schema: SettingChart },
  fork_units: { file: 'fork_units.json', schema: ForkUnit },
  shock_units: { file: 'shock_units.json', schema: ShockUnit },
} as const;

export type TableName = keyof typeof TABLES;
export const TABLE_NAMES = Object.keys(TABLES) as TableName[];

export interface TableRecords {
  chassis: Chassis[];
  dampers: Damper[];
  air_springs: AirSpring[];
  pressure_charts: PressureChart[];
  setting_charts: SettingChart[];
  fork_units: ForkUnit[];
  shock_units: ShockUnit[];
}

/** Top-level keys each schema knows about, for reporting fields a record carries that the schema does not. */
export function knownKeys(table: TableName): string[] {
  const s = TABLES[table].schema as unknown as z.ZodEffects<z.AnyZodObject>;
  return Object.keys(s._def.schema.shape);
}

/** Fields that exist in the schema only because 02B asked for them. */
export const NON_SCHEMA_FIELDS: Partial<Record<TableName, string[]>> = {
  chassis: ['serial_format'],
  fork_units: ['model_code'],
  shock_units: ['model_code'],
};

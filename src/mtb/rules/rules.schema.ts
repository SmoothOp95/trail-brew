import { z } from 'zod';

/** 05_RULES_ENGINE.md section 1. Fixed vocabulary: do not extend without a schema change. */
export const SETTING_FIELDS = [
  'fork_psi', 'fork_spacers', 'fork_lsr', 'fork_hsr', 'fork_lsc', 'fork_hsc',
  'shock_psi', 'shock_spacers', 'shock_lsr', 'shock_hsr', 'shock_lsc', 'shock_hsc',
  'tyre_front', 'tyre_rear', 'flip_chip',
] as const;
export const SettingField = z.enum(SETTING_FIELDS);
export type SettingField = z.infer<typeof SettingField>;

const Recipe = z.record(SettingField, z.union([z.number(), z.string()]));

export const Goal = z.object({
  id: z.string(),
  name: z.string(),
  sub: z.string(),
  applies_to: z.array(z.enum(['full_suspension', 'hardtail'])).min(1),
  recipe: Recipe,
  rationale: z.record(SettingField, z.string()),
  /** 05 §3 Hardtail branching: the redistributed recipe, where 05 states one. */
  hardtail_recipe: Recipe.optional(),
});
export type Goal = z.infer<typeof Goal>;

export const Conflict = z.object({
  id: z.string(),
  goal_a: z.string(),
  goal_b: z.string(),
  axis: z.string(),
  severity: z.enum(['cancels', 'trades', 'mild']),
  text: z.string(),
});
export type Conflict = z.infer<typeof Conflict>;

export const AttributeInput = z.enum(['p', 'spc', 'rb', 'cp', 'ty']);
export type AttributeInput = z.infer<typeof AttributeInput>;

export const Attribute = z.object({
  id: z.enum(['grip', 'support', 'comfort', 'pop', 'bottom_out', 'pedalling']),
  label: z.string(),
  weights: z.record(AttributeInput, z.number()),
  fit_basis: z.enum(['expert_prior', 'fitted']),
  fit_note: z.string(),
});
export type Attribute = z.infer<typeof Attribute>;

export const AttributeModel = z.object({
  baseline: z.number(),
  range: z.tuple([z.number(), z.number()]),
  /** Divisors from 05 §5 normalised inputs. */
  normalisation: z.object({
    fork_psi: z.number(),
    shock_psi: z.number(),
    spacers: z.number(),
    rebound: z.number(),
    compression: z.number(),
    tyre: z.number(),
  }),
});

export const OrderGroup = z.object({
  group: z.enum(['tyre', 'spring', 'ramp', 'rebound', 'compression', 'geometry']),
  label: z.string(),
  fields: z.array(SettingField),
});

export const Rules = z
  .object({
    version: z.string(),
    status: z.string(),
    setting_fields: z.array(SettingField),
    goals: z.array(Goal),
    /** 05's proposed goals, ids only: not selectable, but conflicts may name them. */
    proposed_goal_ids: z.array(z.string()),
    conflicts: z.array(Conflict),
    attributes: z.array(Attribute).length(6),
    attribute_model: AttributeModel,
    symptoms: z.array(z.unknown()),
    causes: z.array(z.unknown()),
    ordering: z.array(OrderGroup),
    diagnostics: z.array(z.object({ test: z.string(), reads: z.string() })),
    sag_method: z.object({ summary: z.string(), steps: z.array(z.string()) }),
    preconditions: z.array(z.unknown()),
    hardtail: z.object({ tyre_weight: z.number(), tyre_weight_note: z.string() }),
  })
  .superRefine((r, ctx) => {
    const ids = new Set([...r.goals.map((g) => g.id), ...r.proposed_goal_ids]);
    for (const c of r.conflicts) {
      for (const g of [c.goal_a, c.goal_b]) {
        if (!ids.has(g)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `conflict ${c.id} names unknown goal ${g}` });
      }
    }
    const ordered = r.ordering.flatMap((o) => o.fields);
    for (const f of SETTING_FIELDS) {
      if (!ordered.includes(f)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `ordering is missing ${f}` });
    }
  });
export type Rules = z.infer<typeof Rules>;

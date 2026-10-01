import { z } from 'zod';

/** 01_SCHEMA.md v0.3, Conventions. */

export const Confidence = z.enum(['measured', 'published', 'derived', 'estimated']);
export type Confidence = z.infer<typeof Confidence>;

export const SourceMethod = z.enum(['public_pdf', 'session_page', 'manual_entry', 'cross_check']);

export const SourceEntry = z.object({
  url: z.string().min(1, 'source.url is empty'),
  document: z.string().nullable().optional(),
  retrieved: z.string().min(1, 'source.retrieved is empty'),
  method: SourceMethod,
});

/** "Where a record is assembled from more than one source, `source` becomes an array." */
export const Source = z.union([SourceEntry, z.array(SourceEntry).min(1)]);

/** v0.3 Pending fields: a deliberate null with a known source. `field` may be a dotted path. */
export const FieldPending = z.object({
  field: z.string().min(1),
  expected_source: z.string().min(1),
  tier: z.string().nullable().optional(),
});
export type FieldPending = z.infer<typeof FieldPending>;

export const Int = z.number().int();
export const NonNegInt = z.number().int().nonnegative();
export const IntPair = z.tuple([Int, Int]);

/** Fields every harvested record carries. */
export const recordBase = {
  id: z.string().regex(/^[a-z0-9_]+$/, 'id must be a lowercase snake_case slug'),
  confidence: Confidence,
  confidence_note: z.string().nullable().optional(),
  source: Source,
  fields_pending: z.array(FieldPending).optional(),
};

/** Validation rule 9: no `estimated` without a `confidence_note`. */
export function requireNoteWhenEstimated(
  r: { confidence: Confidence; confidence_note?: string | null },
  ctx: z.RefinementCtx,
) {
  if (r.confidence === 'estimated' && !r.confidence_note?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['confidence_note'], message: 'estimated without a confidence_note (rule 9)' });
  }
}

/** Validation rule 5, relaxed in v0.3: a <= b, so [30, 30] passes. */
export function checkSag(sag: [number, number] | null | undefined, ctx: z.RefinementCtx) {
  if (sag && sag[0] > sag[1]) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sag_target_pct'], message: 'sag_target_pct[0] > sag_target_pct[1] (rule 5)' });
  }
}

/** Validation rule 6. */
export function checkSpacers(
  r: { spacer_factory?: number | null; spacer_max?: number | null },
  ctx: z.RefinementCtx,
) {
  if (r.spacer_factory != null && r.spacer_max != null && r.spacer_factory > r.spacer_max) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['spacer_factory'], message: 'spacer_factory > spacer_max (rule 6)' });
  }
}

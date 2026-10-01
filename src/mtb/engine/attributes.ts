import type { Attribute, AttributeInput, Rules } from '../rules/rules.schema';
import type { Change } from './goals';
import type { SettingField, SuspensionType } from './types';

export interface AttributeScore {
  id: Attribute['id'];
  label: string;
  now: number;
  proposed: number;
  /** proposed - now, one decimal at most. */
  delta: number;
}

export interface AttributeResult {
  scores: AttributeScore[];
  fitBasis: Attribute['fit_basis'];
  /** Rider-facing disclosure. Required on the radar while fit_basis is expert_prior. */
  disclosure: string;
}

const one = (v: number) => Math.round(v * 10) / 10;

/**
 * The six-axis model, exactly as 05 §5 specifies it. "Now" is the rider's current setup and scores the
 * baseline on every axis; proposed moves by the deltas actually proposed (after capability and clamping).
 * Expert priors only: at most one decimal, never used to rank goals or make an unrequested recommendation.
 */
export function attributeScores(rules: Rules, changes: Pick<Change, 'field' | 'delta'>[], suspension: SuspensionType): AttributeResult {
  const d = (f: SettingField) => changes.filter((c) => c.field === f).reduce((a, c) => a + c.delta, 0);
  const n = rules.attribute_model.normalisation;
  const pTerms = [d('fork_psi') / n.fork_psi];
  if (suspension === 'full_suspension') pTerms.push(d('shock_psi') / n.shock_psi);

  const inputs: Record<AttributeInput, number> = {
    p: pTerms.reduce((a, b) => a + b, 0) / pTerms.length,
    spc: (d('fork_spacers') + d('shock_spacers')) / n.spacers,
    rb: (d('fork_lsr') + d('shock_lsr')) / n.rebound,
    cp: (d('fork_lsc') + d('fork_hsc') + d('shock_lsc')) / n.compression,
    ty: (d('tyre_front') + d('tyre_rear')) / 2 / n.tyre,
  };
  const [lo, hi] = rules.attribute_model.range;
  const base = rules.attribute_model.baseline;
  const scores = rules.attributes.map((a) => {
    const raw = (Object.entries(a.weights) as [AttributeInput, number][]).reduce((s, [k, w]) => s + w * inputs[k], base);
    const proposed = one(Math.max(lo, Math.min(hi, raw)));
    return { id: a.id, label: a.label, now: base, proposed, delta: one(proposed - base) };
  });
  const fitted = rules.attributes.every((a) => a.fit_basis === 'fitted');
  return {
    scores,
    fitBasis: fitted ? 'fitted' : 'expert_prior',
    disclosure: fitted
      ? 'Fitted against logged sessions.'
      : 'Directional only. These trade-offs come from expert judgement, not measurement, and will be fitted against logged sessions.',
  };
}

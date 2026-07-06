import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTrailScoring } from './useTrailScoring';

const makeTrail = (id, types, difficulty = [1, 1, 0, 0]) => ({
  id,
  name: id,
  types,
  difficulty,
});

const trails = [
  makeTrail('flow-park', ['Trail', 'Flow']),
  makeTrail('enduro-line', ['Enduro', 'Technical'], [0, 1, 2, 1]),
  makeTrail('xc-loop', ['Cross Country'], [2, 1, 0, 0]),
];

describe('useTrailScoring', () => {
  it('returns all trails scored and sorted descending', () => {
    const { result } = renderHook(() => useTrailScoring(trails, {}));
    expect(result.current.scored).toHaveLength(3);
    const scores = result.current.scored.map((t) => t.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('neutral answers give every trail the baseline score of 50', () => {
    const { result } = renderHook(() =>
      useTrailScoring(trails, { style: 'any', terrain: 'any' })
    );
    for (const t of result.current.scored) expect(t.score).toBe(50);
  });

  it('boosts trails matching the requested style and penalises mismatches', () => {
    const { result } = renderHook(() =>
      useTrailScoring(trails, { style: 'enduro' })
    );
    const byId = Object.fromEntries(result.current.scored.map((t) => [t.id, t.score]));
    expect(byId['enduro-line']).toBe(75); // 50 + 25 style match
    expect(byId['flow-park']).toBe(35); // 50 - 15 style miss
  });

  it('beginner experience favours flow/trail and penalises enduro', () => {
    const { result } = renderHook(() =>
      useTrailScoring(trails, { experience: 'beginner' })
    );
    const byId = Object.fromEntries(result.current.scored.map((t) => [t.id, t.score]));
    expect(byId['flow-park']).toBeGreaterThan(byId['enduro-line']);
  });

  it('matched only includes trails at or above the threshold', () => {
    const { result } = renderHook(() =>
      useTrailScoring(trails, { style: 'enduro', terrain: 'technical' })
    );
    const { matched, threshold } = result.current;
    expect(threshold).toBe(55);
    expect(matched.every((t) => t.score >= threshold)).toBe(true);
    expect(matched.map((t) => t.id)).toContain('enduro-line');
    expect(matched.map((t) => t.id)).not.toContain('flow-park');
  });

  it('scores are clamped to the 0–100 range', () => {
    const { result } = renderHook(() =>
      useTrailScoring(trails, {
        style: 'enduro',
        terrain: 'technical',
        difficulty: 'hard',
        experience: 'advanced',
      })
    );
    for (const t of result.current.scored) {
      expect(t.score).toBeGreaterThanOrEqual(0);
      expect(t.score).toBeLessThanOrEqual(100);
    }
  });
});

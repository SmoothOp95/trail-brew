import { describe, it, expect } from 'vitest';
import { trailDifficultyScore, sortTrailsByDifficulty } from './trailDifficulty';

describe('trailDifficultyScore', () => {
  it('scores an all-green trail as easiest', () => {
    expect(trailDifficultyScore({ difficulty: [3, 0, 0, 0] })).toBe(0);
  });

  it('scores an all-black trail as hardest', () => {
    expect(trailDifficultyScore({ difficulty: [0, 0, 0, 3] })).toBe(3);
  });

  it('weights a mixed distribution toward the harder bands', () => {
    // 1 red, 2 black → (1*2 + 2*3) / 3 = 8/3
    expect(trailDifficultyScore({ difficulty: [0, 0, 1, 2] })).toBeCloseTo(8 / 3);
  });

  it('sorts trails with no usable difficulty data last', () => {
    expect(trailDifficultyScore({})).toBe(Infinity);
    expect(trailDifficultyScore({ difficulty: [] })).toBe(Infinity);
    expect(trailDifficultyScore({ difficulty: [0, 0, 0, 0] })).toBe(Infinity);
  });
});

describe('sortTrailsByDifficulty', () => {
  it('orders trails easier to harder', () => {
    const trails = [
      { name: 'Hard Trail', difficulty: [0, 0, 1, 2] },
      { name: 'Easy Trail', difficulty: [3, 0, 0, 0] },
      { name: 'Medium Trail', difficulty: [1, 1, 0, 0] },
    ];
    expect(sortTrailsByDifficulty(trails).map((t) => t.name)).toEqual([
      'Easy Trail',
      'Medium Trail',
      'Hard Trail',
    ]);
  });

  it('breaks ties alphabetically for a deterministic order', () => {
    const trails = [
      { name: 'Zebra Park', difficulty: [2, 0, 0, 0] },
      { name: 'Alpha Park', difficulty: [2, 0, 0, 0] },
    ];
    expect(sortTrailsByDifficulty(trails).map((t) => t.name)).toEqual([
      'Alpha Park',
      'Zebra Park',
    ]);
  });

  it('does not mutate the input array', () => {
    const trails = [
      { name: 'B', difficulty: [0, 0, 0, 3] },
      { name: 'A', difficulty: [3, 0, 0, 0] },
    ];
    const original = [...trails];
    sortTrailsByDifficulty(trails);
    expect(trails).toEqual(original);
  });
});

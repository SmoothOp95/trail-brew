/**
 * @fileoverview Derives an easier→harder ordering for trails from each
 * trail's existing `difficulty` counts, without relying on (or exposing)
 * the `tier` field — `tier` groups trails by series/venue, not difficulty,
 * so it isn't a reliable ordinal on its own.
 * Pure — no Firebase, no React.
 */

// difficulty is [greenCount, blueCount, redCount, blackCount] — a per-venue
// distribution of line ratings. Weighting each rating band 0-3 and taking
// the count-weighted average gives a single comparable "how hard, on
// average" score per trail.
const BAND_WEIGHTS = [0, 1, 2, 3];

/**
 * @param {{ difficulty?: number[] }} trail
 * @returns {number} Weighted average difficulty band, 0 (easiest) to 3
 *   (hardest). Trails with no usable difficulty data sort last.
 */
export function trailDifficultyScore(trail) {
  const counts = trail?.difficulty;
  if (!Array.isArray(counts) || counts.length === 0) return Infinity;

  const totalLines = counts.reduce((sum, c) => sum + (c || 0), 0);
  if (totalLines === 0) return Infinity;

  const weightedSum = counts.reduce(
    (sum, c, i) => sum + (c || 0) * (BAND_WEIGHTS[i] ?? i),
    0
  );
  return weightedSum / totalLines;
}

/**
 * Sorts trails easier → harder. Stable tie-break by name so the order is
 * deterministic regardless of Firestore's returned document order.
 *
 * @param {Array<{ name?: string, difficulty?: number[] }>} trails
 * @returns {Array} new sorted array
 */
export function sortTrailsByDifficulty(trails) {
  return [...trails].sort((a, b) => {
    const diff = trailDifficultyScore(a) - trailDifficultyScore(b);
    if (diff !== 0) return diff;
    return (a.name || '').localeCompare(b.name || '');
  });
}

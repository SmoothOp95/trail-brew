import { useMemo } from 'react';

const MATCH_THRESHOLD = 55;

function scoreTrail(trail, answers) {
  let score = 50;
  const typesLower = trail.types.map((t) => t.toLowerCase());

  // Style
  if (answers.style && answers.style !== 'any') {
    const styleMap = {
      xc: ['cross country'],
      enduro: ['enduro'],
      trail: ['trail'],
    };
    const desired = styleMap[answers.style] || [];
    if (desired.some((d) => typesLower.includes(d))) score += 25;
    else if (typesLower.length === 0) score += 5;
    else score -= 15;
  }

  // Terrain
  if (answers.terrain && answers.terrain !== 'any') {
    const terrainMap = {
      flow: ['flow'],
      technical: ['technical'],
      downhill: ['downhill', 'jump'],
    };
    const desired = terrainMap[answers.terrain] || [];
    if (desired.some((d) => typesLower.includes(d))) score += 25;
    else score -= 10;
  }

  // Difficulty
  if (answers.difficulty && answers.difficulty !== 'any') {
    const hasDifficulty = trail.difficulty.some((d) => d > 0);
    if (hasDifficulty) {
      const diffCount = trail.difficulty.filter((d) => d > 0).length;
      if (answers.difficulty === 'easy' && diffCount <= 1) score += 10;
      else if (answers.difficulty === 'medium' && diffCount >= 1 && diffCount <= 2) score += 10;
      else if (answers.difficulty === 'hard' && diffCount >= 2) score += 10;
    }
  }

  // Experience
  if (answers.experience && answers.experience !== 'any') {
    if (answers.experience === 'beginner') {
      const beginnerFriendly = ['trail', 'flow', 'cross country'];
      if (beginnerFriendly.some((b) => typesLower.includes(b))) score += 15;
      if (typesLower.includes('downhill') || typesLower.includes('enduro')) score -= 10;
    } else if (answers.experience === 'intermediate') {
      if (typesLower.length > 0) score += 10;
    } else if (answers.experience === 'advanced') {
      const advancedFun = ['technical', 'enduro', 'downhill', 'jump'];
      if (advancedFun.some((a) => typesLower.includes(a))) score += 15;
      if (typesLower.length === 1 && typesLower[0] === 'trail') score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}

export function useTrailScoring(trails, answers) {
  const scored = useMemo(() => {
    return trails
      .map((t) => ({ ...t, score: scoreTrail(t, answers) }))
      .sort((a, b) => b.score - a.score);
  }, [trails, answers]);

  const matched = useMemo(
    () => scored.filter((t) => t.score >= MATCH_THRESHOLD),
    [scored]
  );

  return { scored, matched, threshold: MATCH_THRESHOLD };
}

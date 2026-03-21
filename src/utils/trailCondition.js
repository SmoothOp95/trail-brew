/**
 * Grades trail conditions based on Open-Meteo weather data.
 *
 * Rainfall thresholds are tuned for Gauteng summer thunderstorm patterns —
 * short heavy bursts can saturate clay-heavy soils quickly.
 *
 * Grades (best → worst):
 *   PRIME   — dry, hardpack, go ride
 *   GOOD    — light recent rain, mostly recovered
 *   SOFT    — moderate rain, expect some mud
 *   MUDDY   — heavy rain, trails need time to drain
 *   AVOID   — actively raining or waterlogged
 */

export const CONDITION_GRADES = {
  PRIME: {
    grade: 'PRIME',
    label: 'Prime conditions',
    shortLabel: 'Prime',
    icon: '🟢',
    colorClass: 'text-green-400 bg-green-950/60 border-green-700/40',
    dotClass: 'bg-green-400',
  },
  GOOD: {
    grade: 'GOOD',
    label: 'Good — drying out',
    shortLabel: 'Good',
    icon: '🔵',
    colorClass: 'text-blue-300 bg-blue-950/60 border-blue-700/40',
    dotClass: 'bg-blue-400',
  },
  SOFT: {
    grade: 'SOFT',
    label: 'Soft trails',
    shortLabel: 'Soft',
    icon: '🟡',
    colorClass: 'text-yellow-300 bg-yellow-950/60 border-yellow-700/40',
    dotClass: 'bg-yellow-400',
  },
  MUDDY: {
    grade: 'MUDDY',
    label: 'Muddy — ride with caution',
    shortLabel: 'Muddy',
    icon: '🟤',
    colorClass: 'text-orange-400 bg-orange-950/60 border-orange-700/40',
    dotClass: 'bg-orange-400',
  },
  AVOID: {
    grade: 'AVOID',
    label: 'Avoid — too wet',
    shortLabel: 'Avoid',
    icon: '🔴',
    colorClass: 'text-red-400 bg-red-950/60 border-red-700/40',
    dotClass: 'bg-red-500',
  },
};

/**
 * @param {object} weather
 * @param {number} weather.rain1h   — mm in the last 1 hour
 * @param {number} weather.rain24h  — mm total in the last 24 hours
 * @param {number} weather.rain48h  — mm total in the last 48 hours
 * @returns {object} condition from CONDITION_GRADES
 */
export function gradeConditions({ rain1h, rain24h, rain48h }) {
  if (rain1h > 0.5) return CONDITION_GRADES.AVOID;
  if (rain24h > 20) return CONDITION_GRADES.MUDDY;
  if (rain24h > 8) return CONDITION_GRADES.SOFT;
  if (rain48h > 5) return CONDITION_GRADES.GOOD;
  return CONDITION_GRADES.PRIME;
}

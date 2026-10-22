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
    colorClass: 'text-brew-good bg-brew-good/[0.14] border-brew-good/40',
    dotClass: 'bg-brew-good',
  },
  GOOD: {
    grade: 'GOOD',
    label: 'Good — drying out',
    shortLabel: 'Good',
    icon: '🔵',
    colorClass: 'text-trail-xc bg-trail-xc/[0.14] border-trail-xc/40',
    dotClass: 'bg-trail-xc',
  },
  SOFT: {
    grade: 'SOFT',
    label: 'Soft trails',
    shortLabel: 'Soft',
    icon: '🟡',
    colorClass: 'text-brew-warn bg-brew-warn/[0.14] border-brew-warn/40',
    dotClass: 'bg-brew-warn',
  },
  MUDDY: {
    grade: 'MUDDY',
    label: 'Muddy — ride with caution',
    shortLabel: 'Muddy',
    icon: '🟤',
    colorClass: 'text-orange-400 bg-orange-400/[0.14] border-orange-400/40',
    dotClass: 'bg-orange-400',
  },
  AVOID: {
    grade: 'AVOID',
    label: 'Avoid — too wet',
    shortLabel: 'Avoid',
    icon: '🔴',
    colorClass: 'text-brew-bad bg-brew-bad/[0.14] border-brew-bad/40',
    dotClass: 'bg-brew-bad',
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

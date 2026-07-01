// Trailblu 2026 Monthly Ride Series
// ---------------------------------
// One flagship community ride per month for the rest of the year.
//
// The running order is deliberately built as a difficulty ramp: every venue
// on the list has an easy loop so first-timers are always welcome, but a rider
// who commits to the whole series gets pushed onto progressively more technical
// terrain — finishing on a proper year-end epic. We also alternate between the
// Joburg and Pretoria sides of Gauteng so nobody has the long drive every time.
//
// Dates land on the 4th weekend of each month, alternating Saturday / Sunday.
// Start times creep earlier through the hot Highveld summer to beat the heat.

import { getTrailById } from './trails';

// Ordered list — index 0 is the gentlest ride, the last is the toughest.
const SCHEDULE = [
  {
    trailId: 'taroko',
    date: '2026-07-25', // 4th Saturday
    startTime: '08:00',
    tagline: 'Series kick-off — flow, forest shade & cold ones at the finish.',
  },
  {
    trailId: 'big-red-barn',
    date: '2026-08-23', // 4th Sunday
    startTime: '08:00',
    tagline: 'Gum-forest flow with your first taste of black-diamond lines.',
  },
  {
    trailId: 'cradle-moon',
    date: '2026-09-26', // 4th Saturday
    startTime: '07:30',
    tagline: 'Game-viewing singletrack through the Cradle of Humankind.',
  },
  {
    trailId: 'rosemary-hill',
    date: '2026-10-25', // 4th Sunday
    startTime: '07:00',
    tagline: 'The koppie awaits — flowy XCO loops then technical descents.',
  },
  {
    trailId: 'hennops',
    date: '2026-11-28', // 4th Saturday
    startTime: '07:00',
    tagline: 'Earn your views — big climbs rewarded with bigger descents.',
  },
  {
    trailId: 'thaba-trails',
    date: '2026-12-27', // 4th Sunday
    startTime: '06:30',
    tagline: 'Year-end epic — take on the Blue loop if you dare.',
  },
];

// Human-readable challenge label for each step of the ramp.
const CHALLENGE_LABELS = [
  'Easy start',
  'Building up',
  'Stepping up',
  'Getting technical',
  'Big day out',
  'Season finale',
];

/**
 * Resolve the schedule into full ride objects with the linked trail data,
 * a 1-based position in the series, and a challenge descriptor.
 */
export function getRideSchedule() {
  const total = SCHEDULE.length;
  return SCHEDULE.map((ride, i) => {
    const trail = getTrailById(ride.trailId);
    return {
      ...ride,
      trail,
      position: i + 1,
      total,
      challenge: {
        level: i + 1,
        label: CHALLENGE_LABELS[i] || `Ride ${i + 1}`,
      },
    };
  });
}

/**
 * Classify each ride relative to `now`: 'past', 'next' (the soonest upcoming
 * ride), or 'upcoming'. Used to highlight the next ride on the timeline.
 */
export function getRideStatus(rideDate, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ride = new Date(`${rideDate}T00:00:00`);
  if (ride < today) return 'past';
  return 'upcoming';
}

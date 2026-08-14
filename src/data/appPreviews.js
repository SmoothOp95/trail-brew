import { CalendarDays, CheckSquare, LayoutDashboard, Bike } from 'lucide-react';

/**
 * @fileoverview Content for app-only feature preview pages (AppOnlyFeature).
 * Copy is the Trail Brew team's draft — edit freely, this is just where it
 * lives so it's not hardcoded into the component.
 */
export const appPreviews = {
  rideCalendar: {
    slug: 'ride-calendar',
    icon: CalendarDays,
    name: 'Ride Calendar',
    pitch: 'Every group ride, planned and visible.',
    bullets: [
      'See upcoming Trail Brew rides at a glance',
      'RSVP and see who\'s in',
      'Never miss a Saturday send',
    ],
  },
  myTrails: {
    slug: 'my-trails',
    icon: CheckSquare,
    name: 'My Trails',
    pitch: 'Your riding, remembered.',
    bullets: [
      'Save trails you\'ve ridden and want to ride',
      'Keep notes on lines, conditions and coffee stops',
      'Watch your trail list grow',
    ],
  },
  serviceDashboard: {
    slug: 'service-dashboard',
    icon: LayoutDashboard,
    name: 'Service Dashboard',
    pitch: "Your bike's health, tracked.",
    bullets: [
      'Log services, repairs and costs across all your bikes',
      'Automatic km and saddle-time totals from your rides',
      'Know when the next service is due before the creaks start',
    ],
  },
  findMyBike: {
    slug: 'find-my-bike',
    icon: Bike,
    name: 'Find My Bike',
    pitch: 'The right bike for your budget and your riding.',
    bullets: [
      'South African market, South African prices',
      'Filtered by riding style and budget',
      'No more guessing at the bike shop',
    ],
  },
};

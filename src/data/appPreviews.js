import { CalendarDays, CheckSquare, LayoutDashboard, Bike } from 'lucide-react';
import hardtailPhoto from '../assets/bikes/hardtail.webp';
import fullSuspensionPhoto from '../assets/bikes/full-suspension.webp';
import fullSuspensionBluePhoto from '../assets/bikes/full-suspension-blue.webp';

/**
 * @fileoverview Content for app-only feature preview pages (AppOnlyFeature).
 * Copy is the Trail Brew team's draft — edit freely, this is just where it
 * lives so it's not hardcoded into the component.
 *
 * `screenshot` is the iOS app screen shown in the phone frame (the same
 * captures the /ios marketing page uses) and `marketingHref` links to where
 * that page covers the feature. `photos` replaces the phone frame for a
 * feature the app doesn't have a screen for yet.
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
    screenshot: '/marketing/ride-together.webp',
    marketingHref: '/ios#screenshots',
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
    screenshot: '/marketing/trails.webp',
    marketingHref: '/ios#screenshots',
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
    screenshot: '/marketing/garage.webp',
    marketingHref: '/ios#garage',
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
    inApp: false,
    availability: 'Coming soon to Trail Brew.',
    availabilityNote: "Find My Bike isn't in the app yet. Pop your email in and we'll let you know when it lands.",
    photos: [
      { src: fullSuspensionPhoto, alt: 'Copper full suspension trail bike' },
      { src: hardtailPhoto, alt: 'Green hardtail mountain bike' },
      { src: fullSuspensionBluePhoto, alt: 'Blue full suspension trail bike' },
    ],
  },
};

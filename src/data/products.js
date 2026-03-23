/**
 * @fileoverview Skills Academy product catalog.
 * Prices are in ZAR cents (e.g. R499 = 49900).
 * Update eventDates here — do not hardcode them in page components.
 *
 * paymentLink: set these to your Stripe Payment Link URLs once created.
 *   Leave as null for comingSoon products.
 */

/** @type {import('../types/index').Product[]} */
export const SKILLS_ACADEMY_PRODUCTS = [
  {
    id: 'online-clinic',
    name: 'Online Clinic',
    description: 'Learn from home with video tutorials and live Q&A',
    priceInCents: 50000, // R500.00
    comingSoon: true,
    paymentLink: null,
    features: [
      'Access to all video modules',
      'Live Q&A sessions',
      'Digital course materials',
      'Community forum access',
      'Certificate of completion',
    ],
  },
  {
    id: 'hybrid-clinic',
    name: 'Hybrid Clinic',
    description: 'Best of both worlds — online learning plus one in-person session',
    priceInCents: 120000, // R1,200.00
    comingSoon: true,
    paymentLink: null,
    features: [
      'Everything in Online Clinic',
      'One full-day in-person session',
      'Hands-on practice with instructors',
      'Trail riding experience',
      'Personalized feedback',
      'Trail Brew merchandise',
    ],
  },
  {
    id: 'in-person-clinic',
    name: 'In-Person Pilot',
    description: '3-hour skills session covering all modules at Delta Park',
    priceInCents: 49900, // R499.00
    popular: true,
    comingSoon: false,
    paymentLink: null, // TODO: replace with Stripe Payment Link URL
    eventDate: '2025-11-16',
    eventLocation: 'Delta Park, Johannesburg',
    features: [
      '3-hour comprehensive session',
      'All modules covered',
      'Limited to 8 riders only',
      'Professional coaching',
      'Delta Park location',
      'Small group attention',
      'Trail Brew community access',
    ],
  },
];

export const PRODUCTS = SKILLS_ACADEMY_PRODUCTS;

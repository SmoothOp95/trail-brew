/**
 * @fileoverview Onboarding survey (/join/survey) question definitions.
 * Drives OnboardingSurvey.jsx — one question per screen, in this order.
 *
 * Scenario questions (Section C) carry a `points` value (0-3) on each
 * option per the product spec. That's reserved for the future rider-level
 * scoring function (Part 3) — nothing in this file computes a score, it's
 * just where the raw point weights are documented until that spec lands.
 */

export const onboardingSteps = [
  // ── Section A — Who you are ─────────────────────────────────────
  {
    id: 'displayName',
    kind: 'text',
    section: 'Who you are',
    title: "What's your name?",
    required: true,
    autoComplete: 'name',
  },
  {
    id: 'whatsappNumber',
    kind: 'tel',
    section: 'Who you are',
    title: 'WhatsApp number',
    required: true,
    placeholder: '082 123 4567',
    helperText: "So we know it's you when you join the group.",
    autoComplete: 'tel',
  },
  {
    id: 'referralSource',
    kind: 'single-select',
    section: 'Who you are',
    title: 'How did you find Trail Brew?',
    required: true,
    options: [
      { value: 'youtube_latv', label: 'Look At Those Views (YouTube)' },
      { value: 'youtube_twt', label: 'Trails with Tawanda (YouTube)' },
      {
        value: 'member',
        label: 'A Trail Brew member invited me',
        reveal: {
          id: 'referralMemberName',
          type: 'text',
          placeholder: 'Their name',
          helperText: "Who? We'll thank them 🍻",
          required: false,
        },
      },
      { value: 'trailhead', label: 'Met you on a trail' },
      { value: 'social', label: 'Instagram / other social media' },
      {
        value: 'other',
        label: 'Other',
        reveal: {
          id: 'referralOther',
          type: 'text',
          placeholder: 'Tell us more',
          required: false,
        },
      },
    ],
  },

  // ── Section B — Your riding ─────────────────────────────────────
  {
    id: 'ridingTenure',
    kind: 'single-select',
    section: 'Your riding',
    title: 'How long have you been mountain biking?',
    required: true,
    options: [
      { value: 'new', label: 'Just getting started (less than 6 months)' },
      { value: '1to2', label: '1–2 years' },
      { value: '3to5', label: '3–5 years' },
      { value: '5plus', label: 'More than 5 years' },
    ],
  },
  {
    id: 'ridingFrequency',
    kind: 'single-select',
    section: 'Your riding',
    title: 'How often do you currently ride?',
    required: true,
    options: [
      { value: 'rarely', label: 'Not riding much at the moment' },
      { value: 'monthly', label: 'Once or twice a month' },
      { value: 'weekly', label: 'Most weekends' },
      { value: 'multiweekly', label: 'Twice a week or more' },
    ],
  },
  {
    id: 'bike',
    kind: 'text',
    section: 'Your riding',
    title: 'What bike are you on?',
    required: false,
    placeholder: 'e.g. Titan Rogue, Giant Trance, still shopping…',
  },
  {
    id: 'trailsRiddenIds',
    kind: 'trail-multiselect',
    section: 'Your riding',
    title: 'Which of these Gauteng trails have you ridden?',
    required: false,
  },

  // ── Section C — How you ride (scenario questions) ───────────────
  {
    id: 'scenarioDescent',
    kind: 'single-select',
    section: 'How you ride',
    title: 'You reach the top of a rocky, technical descent. You…',
    required: true,
    options: [
      { value: 'walk', label: 'Walk it down — no shame', points: 0 },
      { value: 'cautious', label: 'Ride it, but slowly and carefully', points: 1 },
      { value: 'comfortable', label: 'Ride it comfortably at pace', points: 2 },
      { value: 'attack', label: "Attack it — this is what I'm here for", points: 3 },
    ],
  },
  {
    id: 'scenarioEndurance',
    kind: 'single-select',
    section: 'How you ride',
    title: 'A 40 km ride with 800 m of climbing sounds…',
    required: true,
    options: [
      { value: 'impossible', label: 'Way beyond me right now', points: 0 },
      { value: 'stretch', label: "A big stretch, but I'd survive", points: 1 },
      { value: 'normal', label: 'A normal weekend ride', points: 2 },
      { value: 'easy', label: 'A warm-up', points: 3 },
    ],
  },
  {
    id: 'scenarioAir',
    kind: 'single-select',
    section: 'How you ride',
    title: 'Drops and jumps on the trail…',
    required: true,
    options: [
      { value: 'avoid', label: 'I ride around them', points: 0 },
      { value: 'small', label: 'Small ones, wheels close to the ground', points: 1 },
      { value: 'most', label: 'Most of them, with a bit of a look first', points: 2 },
      { value: 'send', label: 'Send it', points: 3 },
    ],
  },

  // ── Section D — What you're into ────────────────────────────────
  {
    id: 'disciplineLeaning',
    kind: 'single-select',
    section: "What you're into",
    title: 'What kind of riding gets you excited?',
    required: true,
    options: [
      { value: 'xc', label: 'Long rides, big distances, earning the coffee stop' },
      {
        value: 'enduro',
        label: 'Descents, jumps and technical trails — climbs are just the price of entry',
      },
      { value: 'both', label: 'Bit of everything, honestly' },
      { value: 'unsure', label: 'Too new to know yet' },
    ],
  },
  {
    id: 'goals',
    kind: 'textarea',
    section: "What you're into",
    title: 'What do you want to get out of Trail Brew?',
    required: false,
    placeholder: 'Fitness, mates to ride with, learning to jump, finding new trails… tell us anything.',
  },

  // ── Section E — Safety ───────────────────────────────────────────
  {
    id: 'emergencyContact',
    kind: 'emergency-contact',
    section: 'Safety',
    title: 'Emergency contact',
    required: true,
    helperText:
      "If something goes wrong on a ride, this is who we call. Stays private — only ride leaders ever see it.",
  },
  {
    id: 'notes',
    kind: 'textarea',
    section: 'Safety',
    title: 'Anything we should know before your first ride?',
    required: false,
    placeholder: 'Injuries, medical stuff, nerves, logistics — whatever helps us look after you on the trail.',
  },
];

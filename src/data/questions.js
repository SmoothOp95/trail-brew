export const questions = [
  {
    id: 'style',
    label: 'Question 1 of 4',
    title: "What kind of ride are you in the mood for?",
    options: [
      { value: 'xc', emoji: '🏔️', label: 'Cross Country', desc: 'Long climbs, fitness focus' },
      { value: 'enduro', emoji: '🔥', label: 'Enduro', desc: 'Aggressive, big descents' },
      { value: 'trail', emoji: '🌿', label: 'Trail', desc: 'All-round, bit of everything' },
      { value: 'any', emoji: '🤙', label: 'Anything goes', desc: 'Surprise me' },
    ],
  },
  {
    id: 'terrain',
    label: 'Question 2 of 4',
    title: 'Flow trails or technical gnar?',
    options: [
      { value: 'flow', emoji: '🌊', label: 'Flow', desc: 'Smooth, fast, pumpy' },
      { value: 'technical', emoji: '🪨', label: 'Technical', desc: 'Rocks, roots, features' },
      { value: 'downhill', emoji: '⬇️', label: 'Downhill / Jump', desc: 'Gravity, send it' },
      { value: 'any', emoji: '🎲', label: 'No preference', desc: 'Just get me riding' },
    ],
  },
  {
    id: 'difficulty',
    label: 'Question 3 of 4',
    title: 'How spicy do you like it?',
    options: [
      { value: 'easy', emoji: '🟢', label: 'Mellow', desc: 'Chill pace, easy trails' },
      { value: 'medium', emoji: '🔵', label: 'Moderate', desc: 'A bit of a workout' },
      { value: 'hard', emoji: '🔴', label: 'Spicy', desc: 'Bring it on' },
      { value: 'any', emoji: '🌶️', label: 'Any difficulty', desc: "I'll ride anything" },
    ],
  },
  {
    id: 'experience',
    label: 'Question 4 of 4',
    title: "What's your riding experience?",
    options: [
      { value: 'beginner', emoji: '🌱', label: 'Beginner', desc: 'Still finding my line' },
      { value: 'intermediate', emoji: '💪', label: 'Intermediate', desc: 'Comfortable on most trails' },
      { value: 'advanced', emoji: '🤘', label: 'Seasoned shredder', desc: 'Bring on the gnar' },
      { value: 'any', emoji: '🎯', label: "Don't factor this in", desc: 'Show me everything' },
    ],
  },
];

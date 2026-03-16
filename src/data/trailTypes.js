const typeColors = {
  enduro: { bg: 'bg-orange-500/15', text: 'text-trail-enduro' },
  'cross country': { bg: 'bg-sky-500/15', text: 'text-trail-xc' },
  flow: { bg: 'bg-lime-400/15', text: 'text-trail-flow' },
  technical: { bg: 'bg-yellow-400/15', text: 'text-trail-technical' },
  trail: { bg: 'bg-purple-400/15', text: 'text-trail-trail' },
  downhill: { bg: 'bg-pink-500/15', text: 'text-trail-downhill' },
  jump: { bg: 'bg-amber-400/15', text: 'text-trail-jump' },
};

export function getTypeColor(type) {
  return typeColors[type.toLowerCase()] || { bg: 'bg-white/10', text: 'text-brew-text-dim' };
}

export function getMatchClass(score) {
  if (score >= 75) return 'bg-lime-400/15 text-brew-accent';
  if (score >= 55) return 'bg-sky-400/12 text-trail-xc';
  return 'bg-white/10 text-brew-text-dim';
}

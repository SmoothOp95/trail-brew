const typeColors = {
  enduro: { bg: 'bg-trail-enduro/15', text: 'text-trail-enduro' },
  'cross country': { bg: 'bg-trail-xc/15', text: 'text-trail-xc' },
  flow: { bg: 'bg-trail-flow/15', text: 'text-trail-flow' },
  technical: { bg: 'bg-trail-technical/15', text: 'text-trail-technical' },
  trail: { bg: 'bg-trail-trail/15', text: 'text-trail-trail' },
  downhill: { bg: 'bg-trail-downhill/15', text: 'text-trail-downhill' },
  jump: { bg: 'bg-trail-jump/15', text: 'text-trail-jump' },
};

export function getTypeColor(type) {
  return typeColors[type.toLowerCase()] || { bg: 'bg-white/10', text: 'text-brew-text-dim' };
}

export function getMatchClass(score) {
  if (score >= 75) return 'bg-brew-accent/15 text-brew-accent';
  if (score >= 55) return 'bg-trail-xc/12 text-trail-xc';
  return 'bg-white/10 text-brew-text-dim';
}

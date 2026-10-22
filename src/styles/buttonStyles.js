/**
 * @fileoverview Shared pill-button class strings, so the primary/secondary
 * button look stays identical everywhere it's used (homepage hero,
 * app-preview CTAs, etc) rather than drifting across copies.
 */
// Mirrors the iOS app's PrimaryButtonStyle (filled trail orange, rounded,
// accent glow) and HeaderAccentButton (tinted orange with an orange hairline).
export const PRIMARY_BTN_CLASS =
  'bg-brew-accent text-brew-on-accent font-bold text-sm px-7 py-3 rounded-2xl shadow-accent-glow hover:bg-brew-accent-hover active:scale-[0.99] transition';

export const SECONDARY_BTN_CLASS =
  'bg-brew-accent/[0.12] border border-brew-accent/35 text-brew-accent font-bold text-sm px-7 py-3 rounded-2xl hover:bg-brew-accent/20 active:scale-[0.99] transition';

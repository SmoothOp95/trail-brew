/** @type {import('tailwindcss').Config} */

// Tokens mirror the iOS app's design system (ios/MountainBikeTracker/Design/Theme.swift
// in Mountain-bike-dashboard), "Trail" direction: a dark warm-ink canvas, matte
// cards, one trail-orange accent, calm status colours.
//   INK · SLATE · TRAIL ORANGE · BONE
// The `brew-*` names are kept so existing class names keep working.
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brew: {
          bg: '#0D0C0A',            // tbInk
          card: '#1A1714',          // tbCard
          'card-2': '#221D16',      // tbCard2, warmer elevated surface
          'card-hover': '#221D16',
          surface: '#13110E',      // sidebar / modal shell, between ink and card
          track: '#2A251E',         // progress-bar track, inactive step
          accent: '#FF7A1A',        // tbAccent, trail orange
          'accent-hover': '#FF8F3D',
          'accent-dim': '#D9620C',
          'accent-soft': '#FFB27A', // tbAccentSoft, serif/italic accents
          'on-accent': '#1A0F04',   // text on a filled accent button
          text: '#F4EFE6',          // tbText, bone
          'text-dim': '#9B948A',    // tbDim
          'text-muted': '#77706A',
          border: 'rgba(255, 255, 255, 0.08)', // tbBorder hairline
          good: '#5FD08A',
          warn: '#FFB22E',
          bad: '#FF5A4D',
        },
        // Matches Color.trailType(_:) in the iOS app's Trail.swift.
        trail: {
          enduro: '#FF7A1A',
          xc: '#57B0E0',
          flow: '#9BD046',
          technical: '#E0C040',
          trail: '#B48BE0',
          downhill: '#E0568C',
          jump: '#E0A030',
        },
      },
      fontFamily: {
        // Stacks are defined once in src/styles/index.css (--font-*).
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      boxShadow: {
        // PrimaryButtonStyle: accent glow under the filled button.
        'accent-glow': '0 10px 28px -6px rgba(255, 122, 26, 0.5)',
      },
    },
  },
  plugins: [],
};

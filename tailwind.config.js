/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brew: {
          bg: '#0C0E0D',
          card: '#161A18',
          'card-hover': '#1C211E',
          accent: '#B8E648',
          'accent-dim': '#8AB335',
          text: '#E8EDE9',
          'text-dim': '#8A9B8E',
          'text-muted': '#566059',
          border: 'rgba(184, 230, 72, 0.08)',
        },
        trail: {
          enduro: '#E6794E',
          xc: '#48B9E6',
          flow: '#B8E648',
          technical: '#E6C84E',
          trail: '#9B6FE6',
          downhill: '#E64E7A',
          jump: '#E6A14E',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        city: {
          bg:        '#0d0d14',
          surface:   '#16161f',
          card:      '#1e1e2e',
          border:    '#2a2a3d',
          muted:     '#4a4a6a',
          text:      '#e2e2f0',
          subtext:   '#8888aa',
          orange:    '#f97316',
          'orange-dim': '#c2550f',
          amber:     '#f59e0b',
          green:     '#10b981',
          blue:      '#3b82f6',
          red:       '#ef4444',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(249,115,22,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(249,115,22,0.03) 1px, transparent 1px)
        `,
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-up':   'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glow:    { from: { boxShadow: '0 0 8px rgba(249,115,22,0.3)' }, to: { boxShadow: '0 0 20px rgba(249,115,22,0.6)' } },
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(249,115,22,0.25)',
        'card':        '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};

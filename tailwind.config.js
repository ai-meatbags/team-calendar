module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0f131a',
        muted: '#4d5666',
        paper: '#f7f1e8',
        accent: '#ef6c38',
        accentStrong: '#c6461c',
        accentSoft: '#ffd7c2',
        cool: '#314457'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      },
      boxShadow: {
        soft: '0 18px 36px rgba(15, 19, 26, 0.12)',
        glow: '0 18px 36px rgba(239, 108, 56, 0.25)'
      }
    }
  }
};

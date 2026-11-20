/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        synapse: {
          background: '#050505',
          secondary: '#090B0E',
          panel: '#101216',
          elevated: '#151820',
          border: '#1f2329',
          borderMuted: '#16181e',
          cyan: '#00f3ff',
          cyanDim: '#008b9a',
          ice: '#bfe7ff',
          violet: '#a855f7',
          violetDim: '#6d28d9',
          indigo: '#4f46e5',
          slate: '#334155',
          zinc: '#71717a',
          ink: '#f8fafc',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        metric: ['0.875rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
      },
      spacing: {
        '18': '4.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal': 'signal 1.2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.4s ease-out forwards',
      },
      keyframes: {
        signal: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0.6' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 243, 255, 0.15)',
        'glow-violet': '0 0 20px rgba(168, 85, 247, 0.15)',
      },
    },
  },
  plugins: [],
};

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Emerald primary
        primary: {
          50:  '#effaf3',
          100: '#d8f3e2',
          200: '#b3e6c9',
          300: '#7fd2a8',
          400: '#49b681',
          500: '#259a66',
          600: '#167c51',
          700: '#106343',
          800: '#0b6b3a', // brand anchor
          900: '#0a4f2d',
          950: '#042617',
        },
        // Warm beige surface
        sand: {
          50:  '#fbf9f1',
          100: '#f5eedb',
          200: '#ece0c0',
          300: '#e0cf9e',
          400: '#d4c7a3',
          500: '#b8a478',
          600: '#8f7d57',
          700: '#6b5c3f',
        },
        ink: {
          DEFAULT: '#1a1f1c',
          soft:    '#3a443d',
          muted:   '#6b7670',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans:    ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4rem)', { lineHeight: '1.0',  letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.75rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      animation: {
        'fade-up':  'fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in':  'fadeIn 0.6s ease-out both',
        'marquee':  'marquee 40s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

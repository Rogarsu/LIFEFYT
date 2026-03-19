/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff1f0',
          100: '#ffe0dc',
          200: '#ffc5be',
          300: '#ff9d92',
          400: '#ff6655',
          500: '#ff3120',
          600: '#ed1a09',
          700: '#c81207',
          800: '#a5140b',
          900: '#881710',
          950: '#4b0603',
        },
        electric: {
          400: '#06d5f0',
          500: '#00b8d4',
          600: '#0093ad',
        },
        dark: {
          900: '#080a0f',
          800: '#0d1117',
          700: '#141923',
          600: '#1c2333',
          500: '#242d42',
          400: '#2d3952',
        },
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':       'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(255,49,32,0.35), transparent)',
        'card-glow':       'radial-gradient(ellipse 60% 60% at 50% 0%, rgba(0,184,212,0.12), transparent)',
      },
      boxShadow: {
        'glow-red':    '0 0 50px rgba(255,49,32,0.45)',
        'glow-cyan':   '0 0 50px rgba(0,184,212,0.45)',
        'glow-sm-red': '0 0 20px rgba(255,49,32,0.3)',
        'card':        '0 8px 40px rgba(0,0,0,0.5)',
        'card-hover':  '0 16px 60px rgba(0,0,0,0.6)',
      },
      animation: {
        'pulse-glow':  'pulseGlow 2.5s ease-in-out infinite',
        'float':       'float 7s ease-in-out infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'slide-up':    'slideUp 0.5s ease-out',
        'fade-in':     'fadeIn 0.4s ease-out',
        'scale-in':    'scaleIn 0.35s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.6', transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.92)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

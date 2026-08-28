/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: '#fff1f2', 100: '#ffe1e3', 200: '#ffc7cb', 300: '#ff9da5',
          400: '#fb6672', 500: '#f13549', 600: '#dc1530', 700: '#b90f26',
          800: '#8f0e24', 900: '#6b0e21', 950: '#3a0410',
        },
        pulse: '#ff2d55',
        sand: '#fff8f5',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', '"Noto Sans Bengali"', 'sans-serif'],
        bn: ['"Noto Sans Bengali"', 'sans-serif'],
      },
      keyframes: {
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.3)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.3)' },
          '70%': { transform: 'scale(1)' },
        },
        pulsering: {
          '0%': { boxShadow: '0 0 0 0 rgba(220,21,48,0.55)' },
          '70%': { boxShadow: '0 0 0 18px rgba(220,21,48,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(220,21,48,0)' },
        },
        drift: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%': { transform: 'translate(-16px,20px) scale(1.05)' },
        },
        risein: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        heartbeat: 'heartbeat 1.8s ease-in-out infinite',
        pulsering: 'pulsering 2s infinite',
        drift: 'drift 8s ease-in-out infinite',
        risein: 'risein 0.6s ease-out both',
        wave: 'wave 18s linear infinite',
      }
    },
  },
  plugins: [],
}

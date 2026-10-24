/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#080d1a',
          navy: '#0f172a',
          surface: '#1e293b',
          card: '#131e32',
          gold: '#d4af37',
          goldLight: '#f3e5ab',
          emerald: '#10b981',
          accent: '#38bdf8'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

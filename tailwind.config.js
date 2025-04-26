
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}'],
  safelist: ['bg-gray-200/30','backdrop-blur-sm','ring-1','ring-white/70','bg-gray-300','ring-2','ring-white','hover:-translate-y-2', ['bg-gray-300','ring-2','ring-white','hover:-translate-y-2'],
  theme: {
    extend: {
      colors: {
        baseblue: '#0052FF',
        warppurple: '#8E2DE2',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}

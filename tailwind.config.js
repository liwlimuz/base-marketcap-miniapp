/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        baseblue: '#0052FF',
        warppurple: '#8E2DE2'
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.15)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: [],
}
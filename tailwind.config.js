/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'bg-[#C0C0C0]',
    'bg-gray-200/40', 'backdrop-blur-sm', 'ring-1', 'ring-white/80',
    'bg-gray-200/30', 'bg-white/20', 'hover:bg-white/30',
    'hover:-translate-y-2', 'hover:-translate-y-1'
  ],
  theme: {
    extend: {
      colors: {
        baseblue: '#0052FF',
        warppurple: '#8E2DE2',
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0,0,0,0.15)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
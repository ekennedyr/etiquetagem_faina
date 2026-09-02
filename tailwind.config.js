/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        faina: {
          blue: '#0B3A5E',
          navy: '#06233B',
          green: '#15803D',
          lightGreen: '#22C55E',
          gold: '#EAB308',
          accent: '#0284C7'
        }
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./server/**/*.{html,js}"
  ],
  theme: {
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('daisyui')
  ],
  daisyui: {
    themes: ["light", "dark", "corporate", "business"],
    base: true,
    utils: true,
  },
} 
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        believe: '#7c3aed',
        skeptic: '#06b6d4',
      }
    },
  },
  plugins: [],
}

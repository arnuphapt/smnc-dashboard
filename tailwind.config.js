/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smnc: {
          light: '#e0f7fa',   // Soft cyan
          primary: '#00acc1', // Cyan primary
          dark: '#006064',    // Dark cyan/teal
          navy: '#0d47a1',    // Deep blue accent
          navyLight: '#1565c0'
        }
      }
    },
  },
  plugins: [],
}

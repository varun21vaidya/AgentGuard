/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        risk: {
          safe: '#22C55E',
          reversible: '#F59E0B',
          irreversible: '#EF4444',
        },
      },
    },
  },
  plugins: [],
};

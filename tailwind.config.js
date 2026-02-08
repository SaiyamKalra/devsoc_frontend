/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        secondary: ["Days One", "sans-serif"],
        primary: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

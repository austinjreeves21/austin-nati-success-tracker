/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 40px rgba(234, 179, 8, 0.25)",
      },
    },
  },
  plugins: [],
}

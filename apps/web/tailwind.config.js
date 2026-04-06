/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /** Vercel Geist — UI sans + code mono */
        sans: ['"Geist Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        /** Đồng bộ với dashboard (zinc) + nhấn violet */
        surface: {
          DEFAULT: "#09090b",
          raised: "#18181b",
          border: "#27272a",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          muted: "#a78bfa",
        },
      },
    },
  },
  plugins: [],
};

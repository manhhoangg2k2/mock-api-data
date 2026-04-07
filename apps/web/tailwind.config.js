/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "app-loader-enter": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "app-loader-grid-fade": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "app-loader-glow": {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.06)" },
        },
        "app-loader-dot": {
          "0%, 80%, 100%": { opacity: "0.2", transform: "scale(0.85)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "app-loader-enter": "app-loader-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "app-loader-grid-fade": "app-loader-grid-fade 5s ease-in-out infinite",
        "app-loader-glow": "app-loader-glow 2.8s ease-in-out infinite",
        "app-loader-dot": "app-loader-dot 1.15s ease-in-out infinite",
      },
      fontFamily: {
        /** Global typography: Inter for UI, JetBrains Mono for code/json */
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
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

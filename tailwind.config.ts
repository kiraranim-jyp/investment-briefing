import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1454FF",
          dark: "#0B2A73",
          light: "#5C8AFF",
        },
        rise: "#D93025",
        fall: "#1A73E8",
        surface: {
          DEFAULT: "#0B0E14",
          card: "#141924",
          border: "#242B3A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

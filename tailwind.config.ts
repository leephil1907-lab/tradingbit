import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: { 950: "#0a0908", 900: "#0d0b08", 850: "#100e0c", 800: "#141110", 750: "#1a1714", 700: "#211d19" },
        gold: { 300: "#f0d9a8", 400: "#dfc088", 500: "#cfa95f", 600: "#b8924a", 700: "#8a6a2f", 800: "#32291d" },
        paper: "#eef1f6",
        muted: "#c9c2b4",
        faint: "#9ca3af",
        up: "#2ee6a8",
        down: "#ff5b6e",
        warn: "#ffb020",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: { container: "80rem" },
    },
  },
  plugins: [],
} satisfies Config;

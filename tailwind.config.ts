import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // everything references CSS variables so [data-theme='light'] can re-theme globally
        obsidian: { 950: "var(--obsidian-950)", 900: "var(--obsidian-900)", 850: "var(--obsidian-850)", 800: "var(--obsidian-800)", 750: "var(--obsidian-750)", 700: "var(--obsidian-700)" },
        gold: { 300: "var(--gold-300)", 400: "var(--gold-400)", 500: "var(--gold-500)", 600: "var(--gold-600)", 700: "var(--gold-700)", 800: "var(--gold-800)" },
        paper: "var(--paper)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        up: "var(--up)",
        down: "var(--down)",
        warn: "var(--warn)",
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

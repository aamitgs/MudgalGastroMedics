import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--site-ink)",
        muted: "var(--site-muted)",
        line: "var(--site-line)",
        soft: "var(--site-soft)",
        brand: "var(--site-brand)",
        "brand-dark": "var(--site-brand-dark)",
        teal: "var(--site-teal)",
        "teal-dark": "var(--site-teal-dark)",
        gold: "var(--site-gold)",
        coral: "var(--site-coral)",
        mist: "var(--site-mist)",
        navy: "var(--site-navy)",
        surface: "var(--site-surface)"
      },
      borderRadius: {
        DEFAULT: "8px"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(8, 64, 84, 0.12)",
        lift: "0 22px 60px rgba(8, 64, 84, 0.16)"
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;

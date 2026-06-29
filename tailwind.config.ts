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
        ink: "#12313b",
        muted: "#5d7279",
        line: "#cce7ec",
        soft: "#ecfeff",
        brand: "#0891b2",
        "brand-dark": "#0e7490",
        teal: "#059669",
        "teal-dark": "#047857",
        gold: "#b9852f",
        coral: "#dc2626",
        mist: "#f7fbfb",
        navy: "#164e63"
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

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
        ink: "#14242b",
        muted: "#5d6c73",
        line: "#dce7e8",
        soft: "#f4f8f8",
        brand: "#d7142d",
        "brand-dark": "#9b1022",
        teal: "#0f7a78",
        "teal-dark": "#085c5b",
        gold: "#b9852f"
      },
      borderRadius: {
        DEFAULT: "8px"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(10, 45, 55, 0.12)"
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

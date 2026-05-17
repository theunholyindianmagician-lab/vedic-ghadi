import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050300",
          900: "#0a0703",
          800: "#100a05",
          700: "#1a1106",
        },
        gold: {
          100: "#fef4d8",
          200: "#fde2a3",
          300: "#f6cf78",
          400: "#e9b863",
          500: "#d4a44c",
          600: "#a67c33",
          700: "#6b4d1c",
          800: "#3e2c10",
        },
        amber: {
          deep: "#3a1f06",
          ember: "#a04a0a",
        },
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "Cinzel", "serif"],
        body: ["var(--font-cormorant)", "Cormorant Garamond", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
        deva: ['"Noto Serif Devanagari"', "serif"],
      },
      animation: {
        "spin-slow": "spin 60s linear infinite",
        "spin-prana": "spin 4s linear infinite",
        "pulse-soft": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        "gold-glow": "0 0 32px rgba(212, 164, 76, 0.25)",
        "gold-inner": "inset 0 0 24px rgba(212, 164, 76, 0.15)",
      },
    },
  },
  plugins: [],
}
export default config

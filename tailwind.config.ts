import type { Config } from "tailwindcss"
import typography from "@tailwindcss/typography"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)", "monospace"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
    },
  },
  plugins: [typography],
}

export default config

import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#FAFAF9",
          raised: "#F5F5F4",
          card: "#FFFFFF",
          hover: "#EEECE9",
        },
        // Teal brand color — matches oklch(0.55 0.08 210) from design
        iris: {
          50:  "#f0f8fa",
          100: "#d9eef2",
          200: "#aed8e0",
          300: "#77bdc9",
          400: "#4a9eb0",
          500: "#3a7d8e",
          600: "#2f6574",
          700: "#25515d",
          800: "#1b3e48",
          900: "#122a30",
        },
        accent: {
          cyan:  "#3a7d8e",
          rose:  "#e05471",
          amber: "#c97c28",
        },
        risk: {
          low:      "#22a35b",
          medium:   "#c97c28",
          high:     "#d94040",
          critical: "#b91c1c",
        },
        ink: {
          DEFAULT: "#1C1917",
          muted:   "#78716C",
          dim:     "#A8A29E",
        },
        line: "#E7E5E4",
      },
      fontFamily: {
        sans:    ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(58,125,142,0.3), 0 4px 16px -4px rgba(58,125,142,0.25)",
        card: "0 1px 2px rgba(28,25,23,0.04)",
        md:   "0 1px 3px rgba(28,25,23,0.06), 0 4px 12px rgba(28,25,23,0.04)",
      },
      animation: {
        "pulse-soft": "pulse 2.4s cubic-bezier(.4,0,.6,1) infinite",
        "ping-slow":  "ping 2.6s cubic-bezier(0,0,0.2,1) infinite",
      },
      backgroundImage: {
        // kept for backward compat but not used in light theme
        "iris-glow": "radial-gradient(circle at 30% 20%, rgba(58,125,142,0.10), transparent 55%)",
        "iris-grid": "linear-gradient(rgba(58,125,142,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(58,125,142,0.06) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
} satisfies Config;

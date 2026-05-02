import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0A0612",
          raised: "#120A1F",
          card: "#1A0F2E",
          hover: "#221538",
        },
        iris: {
          50: "#F3EEFF",
          100: "#E4D7FF",
          200: "#C9AEFF",
          300: "#A883FF",
          400: "#8A5DFF",
          500: "#6F3FF0",
          600: "#5A2DD4",
          700: "#4621A8",
          800: "#321878",
          900: "#1F0F4A",
        },
        accent: {
          cyan: "#5BE9E9",
          rose: "#FF6CA8",
          amber: "#F9B872",
        },
        risk: {
          low: "#4ADE80",
          medium: "#F9B872",
          high: "#FB7185",
          critical: "#E11D48",
        },
        ink: {
          DEFAULT: "#F4F0FF",
          muted: "#9D8FB7",
          dim: "#6E6383",
        },
        line: "#2A1B47",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Inter", "sans-serif"],
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "iris-glow":
          "radial-gradient(circle at 30% 20%, rgba(111,63,240,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(91,233,233,0.18), transparent 60%)",
        "iris-grid":
          "linear-gradient(rgba(111,63,240,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(111,63,240,0.08) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(111,63,240,0.4), 0 8px 40px -8px rgba(111,63,240,0.55)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 32px -16px rgba(0,0,0,0.6)",
      },
      animation: {
        "pulse-soft": "pulse 2.4s cubic-bezier(.4,0,.6,1) infinite",
        "ping-slow": "ping 2.6s cubic-bezier(0,0,0.2,1) infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        surface: "#111111",
        "surface-elevated": "#1a1a1a",
        border: "#222222",
        primary: "#2563eb",
        "primary-hover": "#1d4ed8",
        "text-primary": "#f0f0f0",
        "text-secondary": "#888888",
        "text-muted": "#444444",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontSize: {
        base: "14px",
      },
    },
  },
  plugins: [],
}

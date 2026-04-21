import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#122033",
        mist: "#eff4f8",
        sea: "#d8ece8",
        accent: "#1f6f66",
        sand: "#f5ebe0",
        warning: "#9a3412",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 22px 60px rgba(18, 32, 51, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;

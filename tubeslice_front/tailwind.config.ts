import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#18181b",
        mist: "#f9fafb",
        accent: "#1d4ed8",
      },
      boxShadow: {
        diffusion: "0 24px 60px -32px rgba(15, 23, 42, 0.28)",
      },
      fontFamily: {
        sans: ["Geist", "Satoshi", "Cabinet Grotesk", "Arial", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

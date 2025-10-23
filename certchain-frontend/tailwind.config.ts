import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B3D91",
          dark: "#082B6B",
          light: "#1A5BC4",
        },
        accent: {
          gold: "#FFD166",
          silver: "#C0C0C0",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(11, 61, 145, 0.1)",
        "card-hover": "0 8px 30px rgba(11, 61, 145, 0.2)",
      },
    },
  },
  plugins: [],
};
export default config;



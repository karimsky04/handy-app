import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1a1a2e",
          light: "#24243e",
          dark: "#12121f",
        },
        teal: {
          DEFAULT: "#00d4aa",
          light: "#33e0be",
          dark: "#00b894",
        },
        gold: {
          DEFAULT: "#F5A623",
          light: "#F7B84E",
          dark: "#D4901A",
        },
        purple: {
          DEFAULT: "#7C3AED",
          light: "#8B5CF6",
          dark: "#6D28D9",
        },
      },
    },
  },
  plugins: [],
};
export default config;

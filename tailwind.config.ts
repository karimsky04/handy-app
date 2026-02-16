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
      },
    },
  },
  plugins: [],
};
export default config;

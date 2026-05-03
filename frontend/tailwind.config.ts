import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          dark: "#081225",
          darker: "#050a15",
          light: "#F4F6F8",
        },
        brand: {
          primary: "#AEE112",
          primaryHover: "#98C40F",
        },
        text: {
          main: "#1D2C4D",
          muted: "#6B7280",
        },
        surface: "#FFFFFF",
        border: "#E5E7EB",
        status: {
          success: "#AEE112",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#06B6D4",
        }
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
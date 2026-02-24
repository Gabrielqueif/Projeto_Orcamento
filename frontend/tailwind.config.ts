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
        "primary": "#26A69A",
        "secondary": "#1F5F7A",
        "white": "#f1f1f1",
        "brand": {
          "primary": "#00629B", // Pantone 3015 C
          "secondary": "#00BFB3", // Pantone 3262 C
          "dark": "#00594F", // Pantone 3292 C
          "accent": "#97D700", // Pantone 375 C
          "teal": "#00ACA0", // Pantone 2399 C
          "navy": "#003C71", // Pantone 541 C
          "lime": "#A7D500", // Pantone 2291 C
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
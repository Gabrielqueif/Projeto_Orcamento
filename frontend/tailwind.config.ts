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
          dark: "#001b3d",
          darker: "#00102a",
          light: "#F8FAFC",
        },
        brand: {
          primary: "#9fd300",
          primaryHover: "#8bc400",
        },
        text: {
          main: "#001b3d",
          muted: "#64748b",
        },
        surface: "#FFFFFF",
        border: "#E2E8F0",
        teal: "#00a3b1",
        status: {
          success: "#9fd300",
          warning: "#F59E0B",
          danger: "#EF4444",
          info: "#00a3b1",
        },
        // Nova Identidade Visual - Design Tokens
        'color-primary-dark': 'var(--color-primary-dark)',
        'color-secondary-dark': 'var(--color-secondary-dark)',
        'color-text-muted': 'var(--color-text-muted)',
        'color-text-subtle': 'var(--color-text-subtle)',
        'color-bg-subtle': 'var(--color-bg-subtle)',
        'color-bg-soft': 'var(--color-bg-soft)',
        'color-border': 'var(--color-border)',
        'color-white': 'var(--color-white)',
        'color-heading': 'var(--color-heading)',
        'color-text-secondary': 'var(--color-text-secondary)',
        'color-brand-accent': 'var(--color-brand-accent)',
        'color-success': 'var(--color-success)',
        'color-success-dark': 'var(--color-success-dark)',
        'color-success-bg': 'var(--color-success-bg)',
        'color-success-bg-alt': 'var(--color-success-bg-alt)',
        'color-danger': 'var(--color-danger)',
        'color-danger-strong': 'var(--color-danger-strong)',
        'color-danger-dark': 'var(--color-danger-dark)',
        'color-danger-bg': 'var(--color-danger-bg)',
        'color-danger-bg-alt': 'var(--color-danger-bg-alt)',
        'color-warning': 'var(--color-warning)',
        'color-warning-dark': 'var(--color-warning-dark)',
        'color-warning-bg': 'var(--color-warning-bg)',
        'color-warning-bg-alt': 'var(--color-warning-bg-alt)',
      },
      fontFamily: {
        manrope: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
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
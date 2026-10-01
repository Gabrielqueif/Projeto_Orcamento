import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Points to the Next.js app directory so next/jest can load
  // next.config.js and .env files automatically.
  dir: "./",
});

const config: Config = {
  // Use jsdom to simulate a browser environment for React component tests.
  testEnvironment: "jsdom",

  // Run the setup file after the test framework is installed so
  // @testing-library/jest-dom matchers are available globally.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Path alias resolution — mirrors the tsconfig paths.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Only collect coverage from source files (exclude tests, configs, etc.).
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/layout.tsx",
    "!src/**/page.tsx",
    "!src/app/globals.css",
  ],

  // Piso temporário: a cobertura atual é ~5-10%. Subir gradualmente conforme surgirem testes.
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 4,
      lines: 5,
      statements: 5,
    },
  },

  // Test file patterns.
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
};

// createJestConfig wraps our config so Next.js can apply its own transforms.
export default createJestConfig(config);

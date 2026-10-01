import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Regras novas do React 19 / eslint-plugin-react-hooks 7: sinalizam padrões existentes
      // (setState em effect, Math.random em render). Mantidas como aviso até refatorar.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;

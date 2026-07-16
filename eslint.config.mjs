import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";

// eslint-config-next's flat config only registers the @typescript-eslint
// parser/plugin (via its "next/typescript" entry) — it doesn't extend
// typescript-eslint's own rule sets the way the legacy eslintrc shape used
// to, so TS-specific rules (no-explicit-any, no-floating-promises, ...) were
// silently inactive. This adds them back explicitly.
const config = [
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow `const { field: _field, ...rest } = obj` to omit a property
      // (used in lib/patient-file-store.ts to strip binary content before
      // returning metadata) without flagging the discarded binding.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }]
    }
  }
];

export default config;

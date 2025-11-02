// @ts-check
import baseConfig from "@workspace/eslint-config";

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mjs", "vitest.config.ts"],
          defaultProject: "./tsconfig.json"
        },
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
];

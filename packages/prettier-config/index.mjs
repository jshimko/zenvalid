/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  trailingComma: "none",
  printWidth: 140,
  importOrder: ["<THIRD_PARTY_MODULES>", "^@workspace/(.*)$", "^@/(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true
};

export default config;

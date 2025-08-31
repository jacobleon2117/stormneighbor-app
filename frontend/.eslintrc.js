module.exports = {
  extends: ["expo", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/array-type": ["error", { default: "array-simple" }],
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
    "no-console": "off",
  },
  ignorePatterns: ["node_modules/", ".expo/", "dist/"],
};

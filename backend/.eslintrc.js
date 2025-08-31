module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    "no-console": "off",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "no-var": "error",
    "prefer-const": "error",
    "no-duplicate-imports": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-script-url": "error",
    eqeqeq: "error",
    "no-throw-literal": "error",
    "prefer-promise-reject-errors": "error",
    "no-return-await": "error",
    "no-process-exit": "warn",
    "no-path-concat": "error",
  },
  overrides: [
    {
      files: ["**/*.test.js", "**/tests/**/*.js"],
      rules: { "no-unused-vars": "off" },
    },
  ],
};

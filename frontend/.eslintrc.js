module.exports = {
  extends: [
    'expo',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
  ],
};
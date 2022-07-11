module.exports = {
  env: {
    browser: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: [
    'airbnb-base',
  ],
  rules: {
    'linebreak-style': ['error', 'windows'],
    'import/extensions': ['error', 'never'],
    'no-plusplus': 'off',
    'no-unused-vars': 'off',
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
};

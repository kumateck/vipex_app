// ESLint v9 flat config for a Bun + TypeScript project
import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    // Files to lint
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.turbo/',
      '.vercel/',
      '.next/',
      'coverage/',
      'bun.lockb',
      'scripts/generate-routes.ts',
    ],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Bun test globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      // TypeScript recommended (non type-aware)
      ...tseslint.configs.recommended.rules,

      // Common tweaks
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-undef': 'off', // TS handles undefined vars
      'prefer-const': 'warn',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
  },
  // Optionally, stricter rules for server code
  {
    files: ['src/server/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
];

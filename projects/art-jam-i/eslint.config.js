import js from '@eslint/js'
import globals from 'globals'
import jest from "eslint-plugin-jest";
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      {
        files: ["test/**/*.{js,ts,jsx,tsx}", "**/__tests__/**/*.{js,ts,jsx,tsx}", "**/*.{test,spec}.{js,ts,jsx,tsx}"],
        plugins: { jest },
        languageOptions: {
          // provide Jest globals only in these files
          globals: jest.environments.globals.globals
        },
        ...jest.configs.recommended // optional: Jest lint rules
      }
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])

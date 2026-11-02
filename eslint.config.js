import js from '@eslint/js'
import globals from 'globals'
import kaezon from './index.js'

export default [
   {
      ignores: ['coverage/**', 'node_modules/**'],
   },
   js.configs.recommended,
   kaezon.createConfig({
      files: ['**/*.js'],
      preset: 'ts',
   }),
   {
      files: ['**/*.js'],
      languageOptions: {
         ecmaVersion: 'latest',
         globals: { ...globals.node, ...globals.es2024 },
         sourceType: 'module',
      },
      rules: {
         'no-console': 'error',
         'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
         'sort-imports': ['error', { ignoreDeclarationSort: true }],
         'sort-keys': 'error',
      },
   },
   {
      files: ['tests/**/*.js'],
      rules: {
         'no-console': 'off',
      },
   },
]

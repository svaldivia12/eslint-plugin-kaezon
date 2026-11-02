import js from '@eslint/js'
import globals from 'globals'
import ts_parser from '@typescript-eslint/parser'
import kaezon from './index.ts'

export default [
   {
      // examples/ ships failing code on purpose, so it is linted by its own
      // config inside each example, not by the repo config.
      ignores: [
         'coverage/**',
         'dist/**',
         'examples/**',
         'node_modules/**',
      ],
   },
   js.configs.recommended,
   {
      files: ['**/*.ts'],
      languageOptions: {
         ecmaVersion: 'latest',
         globals: { ...globals.node, ...globals.es2024 },
         parser: ts_parser,
         sourceType: 'module',
      },
   },
   kaezon.createConfig({
      files: ['**/*.ts'],
      preset: 'ts',
   }),
   {
      files: ['**/*.ts'],
      rules: {
         'no-console': 'error',
         'no-unused-vars': 'off',
         'sort-imports': ['error', { ignoreDeclarationSort: true }],
         'sort-keys': 'error',
      },
   },
   {
      files: ['tests/**/*.ts'],
      rules: {
         'no-console': 'off',
      },
   },
]

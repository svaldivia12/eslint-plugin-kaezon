import js from '@eslint/js'
import globals from 'globals'
import ts_parser from '@typescript-eslint/parser'
import prettier_config from 'eslint-config-prettier'
import kaezon from './index.ts'

export default [
   {
      // examples/ ships failing code on purpose, so it is linted by its own
      // config inside each example, not by the repo config.
      ignores: ['coverage/**', 'dist/**', 'examples/**', 'node_modules/**'],
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
   // Must stay last so it turns off every stylistic rule that would fight the
   // formatter. It also switches off `curly`, and that one stays off here on
   // purpose: the repo lints itself with `curly: ['multi']`, whose autofix
   // leaves a dangling newline when it removes braces from a single-line body,
   // and Prettier immediately re-adds those braces. The rule is still part of
   // the published `nuxt_house` preset; only this repo's own config drops it.
   prettier_config,
]

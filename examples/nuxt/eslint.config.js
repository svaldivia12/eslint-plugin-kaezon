import ts_parser from '@typescript-eslint/parser'
import ts_plugin from '@typescript-eslint/eslint-plugin'
import vue_plugin from 'eslint-plugin-vue'
import kaezon from 'eslint-plugin-kaezon'

export default [
   {
      files: ['**/*.ts'],
      languageOptions: {
         parser: ts_parser,
         parserOptions: {
            // naming-convention uses `types` selectors, which need a program.
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
         },
      },
   },
   { plugins: { '@typescript-eslint': ts_plugin, vue: vue_plugin } },
   kaezon.createConfig({
      files: ['**/*.ts'],
      preset: 'nuxt_house',
      rules: {
         // No .vue files in this example, so the Vue parser check is moot.
         'kaezon/require-typescript-parser': 'off',
      },
   }),
]

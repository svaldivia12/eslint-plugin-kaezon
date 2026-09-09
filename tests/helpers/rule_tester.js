import { describe, it } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts_parser from '@typescript-eslint/parser'
import { RuleTester } from 'eslint'
import vue_parser from 'vue-eslint-parser'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const language_options = {
   ecmaVersion: 'latest',
   sourceType: 'module',
}

const helpers_dir = path.dirname(fileURLToPath(import.meta.url))

export { ts_parser, vue_parser }

export const ts_tester = new RuleTester({
   languageOptions: {
      ...language_options,
      parser: ts_parser,
   },
})

export const ts_type_aware_tester = new RuleTester({
   languageOptions: {
      ...language_options,
      parser: ts_parser,
      parserOptions: {
         projectService: {
            allowDefaultProject: ['*.ts'],
         },
         tsconfigRootDir: helpers_dir,
      },
   },
})

export const vue_tester = new RuleTester({
   languageOptions: {
      ...language_options,
      parser: vue_parser,
      parserOptions: {
         extraFileExtensions: ['.vue'],
         parser: ts_parser,
      },
   },
})

export const js_tester = new RuleTester({
   languageOptions: language_options,
})

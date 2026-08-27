import { describe, it } from 'node:test'
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

export { ts_parser, vue_parser }

export const ts_tester = new RuleTester({
   languageOptions: {
      ...language_options,
      parser: ts_parser,
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

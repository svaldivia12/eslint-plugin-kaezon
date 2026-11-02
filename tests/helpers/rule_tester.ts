import { describe, it } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts_parser from '@typescript-eslint/parser'
import vue_parser from 'vue-eslint-parser'
import { RuleTester } from 'eslint'
import type { Linter, Rule } from 'eslint'
import type { KaezonRule } from '../../types.ts'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const LANGUAGE_OPTIONS = {
   ecmaVersion: 'latest',
   sourceType: 'module',
} as const satisfies Linter.LanguageOptions

const helpers_dir = path.dirname(fileURLToPath(import.meta.url))

export { ts_parser, vue_parser }

export const ts_tester = new RuleTester({
   languageOptions: {
      ...LANGUAGE_OPTIONS,
      parser: ts_parser,
   },
})

export const ts_type_aware_tester = new RuleTester({
   languageOptions: {
      ...LANGUAGE_OPTIONS,
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
      ...LANGUAGE_OPTIONS,
      parser: vue_parser,
      parserOptions: {
         extraFileExtensions: ['.vue'],
         parser: ts_parser,
      },
   },
})

export const js_tester = new RuleTester({
   languageOptions: LANGUAGE_OPTIONS,
})

/**
 * RuleTester types its `rule` argument against the core ESLint `RuleModule`,
 * which is structurally different from `TSESLint.RuleModule` (same runtime
 * contract, different `RuleContext`). This helper keeps the cast in one place.
 */
export function as_rule_tester_rule(rule: KaezonRule): Rule.RuleModule {
   return rule as unknown as Rule.RuleModule
}

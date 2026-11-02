import { it } from 'node:test'
import rule_module from '../eslint-rules/require-typescript-parser.ts'
import { as_rule_tester_rule, js_tester, ts_parser, ts_tester, vue_parser, vue_tester } from './helpers/rule_tester.ts'

const JS_CODE = 'const x = 1'
const VUE_SFC = '<script setup lang="ts">const x = 1</script>'
const VUE_SFC_JS = '<script>const x = 1</script>'

it('require-typescript-parser with Espree', () => {
   js_tester.run('require-typescript-parser with Espree', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: JS_CODE,
            errors: [{ messageId: 'missing_ts_parser' }],
            filename: 'a.ts',
            name: '.ts without TypeScript parser',
         },
         {
            code: JS_CODE,
            errors: [{ messageId: 'missing_ts_parser' }],
            filename: 'a.tsx',
            name: '.tsx without TypeScript parser',
         },
         {
            code: JS_CODE,
            errors: [{ messageId: 'missing_ts_parser' }],
            filename: 'a.mts',
            name: '.mts without TypeScript parser',
         },
         {
            code: JS_CODE,
            errors: [{ messageId: 'missing_ts_parser' }],
            filename: 'a.cts',
            name: '.cts without TypeScript parser',
         },
         {
            code: JS_CODE,
            errors: [{ messageId: 'missing_vue_parser' }],
            filename: 'file.vue?vue&type=script',
            name: 'query string still treated as .vue',
         },
         {
            code: VUE_SFC_JS,
            errors: [{ messageId: 'missing_vue_ts_parser' }],
            filename: 'a.vue',
            languageOptions: {
               parser: vue_parser,
               parserOptions: { extraFileExtensions: ['.vue'] },
               sourceType: 'module',
            },
            name: 'vue-eslint-parser without TypeScript script parser',
         },
      ],
      valid: [
         {
            code: JS_CODE,
            filename: 'a.js',
            name: '.js is skipped',
         },
         {
            code: JS_CODE,
            filename: 'README',
            name: 'no extension is skipped',
         },
      ],
   })
})

it('require-typescript-parser with TypeScript parser', () => {
   ts_tester.run('require-typescript-parser with TypeScript parser', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: JS_CODE,
            errors: [{ messageId: 'missing_vue_parser' }],
            filename: 'a.vue',
            name: '.vue with TypeScript parser only',
         },
      ],
      valid: [
         {
            code: JS_CODE,
            filename: 'a.ts',
            name: '.ts with TypeScript parser',
         },
      ],
   })
})

it('require-typescript-parser with Vue parser', () => {
   vue_tester.run('require-typescript-parser with Vue parser', as_rule_tester_rule(rule_module), {
      invalid: [],
      valid: [
         {
            code: VUE_SFC,
            filename: 'a.vue',
            name: '.vue with vue-eslint-parser and TS parser object',
         },
         {
            code: VUE_SFC,
            filename: 'a.vue',
            languageOptions: {
               parser: vue_parser,
               parserOptions: {
                  extraFileExtensions: ['.vue'],
                  parser: { ts: ts_parser },
               },
               sourceType: 'module',
            },
            name: '.vue with parser.ts map',
         },
      ],
   })
})

/**
 * Exercises the parserOptions.parser shapes that the rule accepts. These do not
 * need a real parser instance, only the value the option carries, so Espree can
 * parse the code while the rule inspects the configuration.
 */
const parser_option_cases = [
   {
      name: 'parser as the package name string',
      parser: '@typescript-eslint/parser',
   },
   {
      name: 'parser as an object exposing meta.name',
      parser: { meta: { name: '@typescript-eslint/parser' } },
   },
   {
      name: 'parser nested one level under ts',
      parser: { ts: '@typescript-eslint/parser' },
   },
   {
      name: 'parser nested two levels deep',
      parser: { inner: { ts: { meta: { name: '@typescript-eslint/parser' } } } },
   },
]

it('require-typescript-parser accepts the documented parser shapes', () => {
   for (const { name, parser } of parser_option_cases) {
      js_tester.run(`require-typescript-parser (${name})`, as_rule_tester_rule(rule_module), {
         invalid: [],
         valid: [
            {
               code: JS_CODE,
               filename: 'a.ts',
               languageOptions: { parserOptions: { parser } },
               name,
            },
         ],
      })
   }
})

const rejected_parser_options = [
   { name: 'parser as an unrelated string', parser: 'some-other-parser' },
   { name: 'parser as a number', parser: 42 },
   { name: 'parser as null', parser: null },
   { name: 'parser as an object without a recognisable name', parser: { meta: {} } },
]

it('require-typescript-parser rejects parser shapes with no TypeScript', () => {
   for (const { name, parser } of rejected_parser_options) {
      js_tester.run(`require-typescript-parser rejects (${name})`, as_rule_tester_rule(rule_module), {
         invalid: [
            {
               code: JS_CODE,
               errors: [{ messageId: 'missing_ts_parser' }],
               filename: 'a.ts',
               languageOptions: { parserOptions: { parser } },
               name,
            },
         ],
         valid: [],
      })
   }
})


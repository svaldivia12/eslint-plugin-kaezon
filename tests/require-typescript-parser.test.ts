import rule_module from '../eslint-rules/require-typescript-parser.ts'
import { as_rule_tester_rule, js_tester, ts_parser, ts_tester, vue_parser, vue_tester } from './helpers/rule_tester.ts'

const JS_CODE = 'const x = 1'
const VUE_SFC = '<script setup lang="ts">const x = 1</script>'
const VUE_SFC_JS = '<script>const x = 1</script>'

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

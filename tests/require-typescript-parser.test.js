import rule from '../eslint-rules/require-typescript-parser.js'
import {
   js_tester,
   ts_parser,
   ts_tester,
   vue_parser,
   vue_tester,
} from './helpers/rule_tester.js'

const js_code = 'const x = 1'
const vue_sfc = '<script setup lang="ts">const x = 1</script>'
const vue_sfc_js = '<script>const x = 1</script>'

js_tester.run('require-typescript-parser with Espree', rule, {
   invalid: [
      {
         code: js_code,
         errors: [{ messageId: 'missing_ts_parser' }],
         filename: 'a.ts',
         name: '.ts without TypeScript parser',
      },
      {
         code: js_code,
         errors: [{ messageId: 'missing_ts_parser' }],
         filename: 'a.tsx',
         name: '.tsx without TypeScript parser',
      },
      {
         code: js_code,
         errors: [{ messageId: 'missing_ts_parser' }],
         filename: 'a.mts',
         name: '.mts without TypeScript parser',
      },
      {
         code: js_code,
         errors: [{ messageId: 'missing_ts_parser' }],
         filename: 'a.cts',
         name: '.cts without TypeScript parser',
      },
      {
         code: js_code,
         errors: [{ messageId: 'missing_vue_parser' }],
         filename: 'file.vue?vue&type=script',
         name: 'query string still treated as .vue',
      },
      {
         code: vue_sfc_js,
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
         code: js_code,
         filename: 'a.js',
         name: '.js is skipped',
      },
      {
         code: js_code,
         filename: 'README',
         name: 'no extension is skipped',
      },
   ],
})

ts_tester.run('require-typescript-parser with TypeScript parser', rule, {
   invalid: [
      {
         code: js_code,
         errors: [{ messageId: 'missing_vue_parser' }],
         filename: 'a.vue',
         name: '.vue with TypeScript parser only',
      },
   ],
   valid: [
      {
         code: js_code,
         filename: 'a.ts',
         name: '.ts with TypeScript parser',
      },
   ],
})

vue_tester.run('require-typescript-parser with Vue parser', rule, {
   invalid: [],
   valid: [
      {
         code: vue_sfc,
         filename: 'a.vue',
         name: '.vue with vue-eslint-parser and TS parser object',
      },
      {
         code: vue_sfc,
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

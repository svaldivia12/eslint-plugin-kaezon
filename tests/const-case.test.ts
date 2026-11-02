import { it } from 'node:test'
import rule_module from '../eslint-rules/const-case.ts'
import { as_rule_tester_rule, ts_tester } from './helpers/rule_tester.ts'

it('const-case', () => {
   ts_tester.run('const-case', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: 'const foo = 1',
            errors: [{ messageId: 'upperCase' }],
            name: 'literal const in lower case',
         },
         {
            code: 'const foo = -1',
            errors: [{ messageId: 'upperCase' }],
            name: 'negative literal const in lower case',
         },
         {
            code: 'const foo = { a: 1 } as const',
            errors: [{ messageId: 'upperCase' }],
            name: 'as const object in lower case',
         },
         {
            code: 'const foo = { a: 1 } as const satisfies T',
            errors: [{ messageId: 'upperCase' }],
            name: 'as const satisfies in lower case',
         },
         {
            code: 'let FOO = 1',
            errors: [{ messageId: 'lowerCase' }],
            name: 'let in UPPER_CASE',
         },
         {
            code: 'const FOO = bar()',
            errors: [{ messageId: 'lowerCase' }],
            name: 'computed const in UPPER_CASE',
         },
         {
            code: 'const FOO = 1 as number',
            errors: [{ messageId: 'lowerCase' }],
            name: 'typed literal without as const in UPPER_CASE',
         },
         {
            code: 'const foo = 1, BAR = 2',
            errors: [{ messageId: 'upperCase' }],
            name: 'multi-declarator reports the lower-case literal',
         },
      ],
      valid: [
         { code: 'const FOO = 1', name: 'numeric literal' },
         { code: "const FOO = 'x'", name: 'string literal' },
         { code: 'const FOO = true', name: 'boolean literal' },
         { code: 'const FOO = -1', name: 'negative literal' },
         {
            code: 'const FOO = { a: 1 } as const',
            name: 'as const object',
         },
         {
            code: 'const FOO = { a: 1 } as const satisfies T',
            name: 'as const satisfies',
         },
         { code: 'const foo = bar()', name: 'computed const in lower case' },
         {
            code: "const FOO = require('x')",
            name: 'require call keeps UPPER_CASE',
         },
         { code: 'let foo = 1', name: 'let in lower case' },
         { code: 'var FOO = 1', name: 'var is ignored' },
         { code: 'const $ = 1', name: 'special name $' },
         { code: 'const _ = 1', name: 'special name _' },
         {
            code: 'const { a } = obj',
            name: 'destructuring is ignored',
         },
         { code: 'export const FOO = 1', name: 'exported literal const' },
         {
            code: 'const FOO = 1, BAR = 2',
            name: 'multi-declarator all UPPER_CASE literals',
         },
      ],
   })
})

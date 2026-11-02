import { it } from 'node:test'
import rule_module from '../eslint-rules/require-satisfies-with-as-const.ts'
import { as_rule_tester_rule, ts_tester } from './helpers/rule_tester.ts'

it('require-satisfies-with-as-const', () => {
   ts_tester.run('require-satisfies-with-as-const', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: 'const x = { a: 1 } as const',
            errors: [{ messageId: 'requireSatisfies' }],
            name: 'object as const',
         },
         {
            code: 'const x = [1] as const',
            errors: [{ messageId: 'requireSatisfies' }],
            name: 'array as const',
         },
         {
            code: 'const x = undefined as const',
            errors: [{ messageId: 'requireSatisfies' }],
            name: 'undefined as const',
         },
         {
            code: 'const x = NaN as const',
            errors: [{ messageId: 'requireSatisfies' }],
            name: 'NaN as const',
         },
      ],
      valid: [
         {
            code: 'const x = { a: 1 } as const satisfies T',
            name: 'as const satisfies',
         },
         { code: 'const x = 1 as const', name: 'number primitive' },
         { code: "const x = 'x' as const", name: 'string primitive' },
         { code: 'const x = true as const', name: 'boolean primitive' },
         { code: 'const x = null as const', name: 'null primitive' },
         { code: 'const x = 1 as number', name: 'as number is not as const' },
         {
            code: 'const x = ({ a: 1 } as const satisfies T)',
            name: 'parenthesized as const satisfies',
         },
      ],
   })
})

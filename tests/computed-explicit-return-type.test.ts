import { it } from 'node:test'
import rule_module from '../eslint-rules/computed-explicit-return-type.ts'
import { as_rule_tester_rule, ts_tester } from './helpers/rule_tester.ts'

it('computed-explicit-return-type', () => {
   ts_tester.run('computed-explicit-return-type', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: 'computed(() => 1)',
            errors: [{ messageId: 'missingReturnType' }],
            name: 'untyped arrow getter',
         },
         {
            code: 'computed(function () { return 1 })',
            errors: [{ messageId: 'missingReturnType' }],
            name: 'untyped function getter',
         },
         {
            code: 'computed({ get() { return 1 }, set(value) {} })',
            errors: [{ messageId: 'missingReturnType' }],
            name: 'untyped get method in a writable computed',
         },
         {
            code: 'computed({ get: () => 1, set: value => {} })',
            errors: [{ messageId: 'missingReturnType' }],
            name: 'untyped get arrow in a writable computed',
         },
      ],
      valid: [
         {
            code: 'computed((): number => 1)',
            name: 'typed arrow getter',
         },
         {
            code: 'computed(function (): number { return 1 })',
            name: 'typed function getter',
         },
         {
            code: 'computed(async (): Promise<number> => 1)',
            name: 'typed async arrow getter',
         },
         {
            code: 'computed(x)',
            name: 'non-function first argument',
         },
         {
            code: 'computed<number>(() => 1)',
            name: 'type argument on computed',
         },
         {
            code: 'computed({ get(): number { return 1 }, set(value) {} })',
            name: 'typed get in a writable computed',
         },
         {
            code: 'computed<number>({ get() { return 1 }, set(value) {} })',
            name: 'writable computed with a type argument',
         },
         {
            code: 'other(() => 1)',
            name: 'different callee identifier',
         },
         {
            code: 'obj.computed(() => 1)',
            name: 'member computed call',
         },
         {
            code: 'computed()',
            name: 'no arguments',
         },
      ],
   })
})

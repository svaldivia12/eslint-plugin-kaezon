import rule from '../eslint-rules/computed-explicit-return-type.js'
import { ts_tester } from './helpers/rule_tester.js'

ts_tester.run('computed-explicit-return-type', rule, {
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
         code: 'computed({ get() { return 1 } })',
         name: 'object getter argument',
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

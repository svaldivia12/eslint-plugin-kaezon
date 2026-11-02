import rule_module from '../eslint-rules/prefer-object-params.ts'
import { as_rule_tester_rule, ts_tester } from './helpers/rule_tester.ts'

ts_tester.run('prefer-object-params', as_rule_tester_rule(rule_module), {
   invalid: [
      {
         code: 'function f(a, b) {}',
         errors: [{ data: { count: 2 }, messageId: 'preferObjectParams' }],
         name: 'function declaration',
      },
      {
         code: 'const f = function (a, b) {}',
         errors: [{ data: { count: 2 }, messageId: 'preferObjectParams' }],
         name: 'function expression',
      },
      {
         code: 'const f = (a, b) => {}',
         errors: [{ data: { count: 2 }, messageId: 'preferObjectParams' }],
         name: 'arrow function',
      },
      {
         code: 'function f(a, b, c) {}',
         errors: [{ data: { count: 3 }, messageId: 'preferObjectParams' }],
         name: 'three positional parameters',
      },
      {
         code: 'function f(this: T, a, b) {}',
         errors: [{ data: { count: 2 }, messageId: 'preferObjectParams' }],
         name: 'this param is ignored for the count',
      },
      {
         code: 'function outer() { function inner(a, b) {} }',
         errors: [{ data: { count: 2 }, messageId: 'preferObjectParams' }],
         name: 'nested function declaration is not a callback',
      },
   ],
   valid: [
      { code: 'function f() {}', name: 'no parameters' },
      { code: 'function f(a) {}', name: 'single parameter' },
      { code: 'function f({ a, b }) {}', name: 'object parameter' },
      {
         code: 'function f({ a, b } = {}) {}',
         name: 'object parameter with default',
      },
      {
         code: 'const obj = { foo(a, b) {} }',
         name: 'object method',
      },
      {
         code: 'const obj = { foo: (a, b) => {} }',
         name: 'object property callback',
      },
      {
         code: 'map((a, b) => {})',
         name: 'call argument callback',
      },
      {
         code: 'computed((a, b) => 1)',
         name: 'computed getter',
      },
   ],
})

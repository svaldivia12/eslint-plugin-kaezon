import { it } from 'node:test'
import rule_module from '../eslint-rules/boolean-is-prefix.ts'
import { as_rule_tester_rule, ts_tester, ts_type_aware_tester } from './helpers/rule_tester.ts'

const ref_stubs = `
type Ref<T> = { value: T }
type ShallowRef<T> = { value: T }
type ComputedRef<T> = { value: T }
declare function ref<T>(value: T): Ref<T>
declare function shallowRef<T>(value: T): ShallowRef<T>
`

it('boolean-is-prefix (ast fallback)', () => {
   ts_tester.run('boolean-is-prefix (ast fallback)', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: 'const password_visible: ShallowRef<boolean>',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'ShallowRef boolean annotation',
         },
         {
            code: 'const password_visible: Ref<boolean>',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'Ref boolean annotation',
         },
         {
            code: 'const password_visible: ComputedRef<boolean>',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'ComputedRef boolean annotation',
         },
         {
            code: 'const flag: boolean',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'plain boolean annotation',
         },
         {
            code: 'const flag = true',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'boolean literal init',
         },
         {
            code: 'const password_visible = shallowRef(false)',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'shallowRef boolean literal',
         },
         {
            code: 'function f(password_visible: ShallowRef<boolean>) {}',
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'parameter ShallowRef boolean',
         },
      ],
      valid: [
         {
            code: 'const is_password_visible: ShallowRef<boolean>',
            name: 'prefixed ShallowRef boolean',
         },
         {
            code: 'const is_flag: boolean',
            name: 'prefixed plain boolean',
         },
         {
            code: 'const is_flag = false',
            name: 'prefixed boolean literal',
         },
         {
            code: 'const count: Ref<number>',
            name: 'non-boolean Ref',
         },
         {
            code: 'const count = ref(0)',
            name: 'ref number literal',
         },
         {
            code: 'const flag = shallowRef(some_flag)',
            name: 'shallowRef non-literal without annotation',
         },
         {
            code: 'const flag: SomeNamespace.Ref<boolean> = x',
            name: 'qualified type name is not recognised as Ref',
         },
         {
            code: "const flag: Ref<'yes'> = x",
            name: 'Ref of a non-boolean literal type',
         },
         {
            code: 'const flag: Ref = x',
            name: 'Ref without type arguments',
         },
         {
            code: 'const flag: Ref<boolean[]> = x',
            name: 'Ref of an array type, not a bare boolean',
         },
      ],
   })
})

it('boolean-is-prefix (type-aware)', () => {
   ts_type_aware_tester.run('boolean-is-prefix (type-aware)', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: `${ref_stubs}
   declare const is_some_flag: boolean
   const password_visible = shallowRef(is_some_flag)
   `,
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'inferred ShallowRef boolean',
         },
         {
            code: `${ref_stubs}
   const password_visible = ref(get_flag())
   declare function get_flag(): boolean
   `,
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'inferred Ref boolean from call',
         },
         {
            code: `
   const flag = get_flag()
   declare function get_flag(): boolean
   `,
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'inferred plain boolean',
         },
         {
            code: `${ref_stubs}
   function f(password_visible: Ref<boolean>) {}
   `,
            errors: [{ messageId: 'missingIsPrefix' }],
            name: 'typed parameter Ref boolean',
         },
      ],
      valid: [
         {
            code: `${ref_stubs}
   declare const is_some_flag: boolean
   const is_password_visible = shallowRef(is_some_flag)
   `,
            name: 'prefixed inferred ShallowRef boolean',
         },
         {
            code: `
   const is_flag = get_flag()
   declare function get_flag(): boolean
   `,
            name: 'prefixed inferred plain boolean',
         },
         {
            code: `${ref_stubs}
   const count = ref(get_count())
   declare function get_count(): number
   `,
            name: 'inferred non-boolean Ref',
         },
         {
            code: `
   const count = get_count()
   declare function get_count(): number
   `,
            name: 'inferred non-boolean',
         },
      ],
   })
})

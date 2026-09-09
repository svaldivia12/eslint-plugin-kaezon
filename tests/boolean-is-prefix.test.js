import rule from '../eslint-rules/boolean-is-prefix.js'
import { ts_tester, ts_type_aware_tester } from './helpers/rule_tester.js'

const REF_STUBS = `
type Ref<T> = { value: T }
type ShallowRef<T> = { value: T }
type ComputedRef<T> = { value: T }
declare function ref<T>(value: T): Ref<T>
declare function shallowRef<T>(value: T): ShallowRef<T>
`

ts_tester.run('boolean-is-prefix (ast fallback)', rule, {
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
   ],
})

ts_type_aware_tester.run('boolean-is-prefix (type-aware)', rule, {
   invalid: [
      {
         code: `${REF_STUBS}
declare const is_some_flag: boolean
const password_visible = shallowRef(is_some_flag)
`,
         errors: [{ messageId: 'missingIsPrefix' }],
         name: 'inferred ShallowRef boolean',
      },
      {
         code: `${REF_STUBS}
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
         code: `${REF_STUBS}
function f(password_visible: Ref<boolean>) {}
`,
         errors: [{ messageId: 'missingIsPrefix' }],
         name: 'typed parameter Ref boolean',
      },
   ],
   valid: [
      {
         code: `${REF_STUBS}
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
         code: `${REF_STUBS}
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

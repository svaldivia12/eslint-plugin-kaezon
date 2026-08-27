import rule from '../eslint-rules/vue-prop-name-casing-by-type.js'
import { ts_tester, vue_tester } from './helpers/rule_tester.js'

ts_tester.run('vue-prop-name-casing-by-type', rule, {
   invalid: [
      {
         code: 'defineProps<{ fooBar: string }>()',
         errors: [
            {
               data: { expected: 'foo_bar', name: 'fooBar' },
               messageId: 'variableSnakeCase',
            },
         ],
         name: 'camelCase non-function prop',
      },
      {
         code: 'defineProps<{ on_click: () => void }>()',
         errors: [
            {
               data: { expected: 'onClick', name: 'on_click' },
               messageId: 'functionCamelCase',
            },
         ],
         name: 'snake_case function prop',
      },
      {
         code: 'defineProps<{ on_click: string | (() => void) }>()',
         errors: [
            {
               data: { expected: 'onClick', name: 'on_click' },
               messageId: 'functionCamelCase',
            },
         ],
         name: 'function in union type',
      },
      {
         code: 'defineProps<{ on_click: (() => void) & { extra: number } }>()',
         errors: [
            {
               data: { expected: 'onClick', name: 'on_click' },
               messageId: 'functionCamelCase',
            },
         ],
         name: 'function in intersection type',
      },
      {
         code: 'defineProps<{ on_click: (() => void) }>()',
         errors: [
            {
               data: { expected: 'onClick', name: 'on_click' },
               messageId: 'functionCamelCase',
            },
         ],
         name: 'parenthesized function type',
      },
      {
         code: "defineProps<{ 'fooBar': string }>()",
         errors: [
            {
               data: { expected: 'foo_bar', name: 'fooBar' },
               messageId: 'variableSnakeCase',
            },
         ],
         name: 'string key camelCase non-function',
      },
      {
         code: 'withDefaults(defineProps<{ fooBar: string }>(), {})',
         errors: [
            {
               data: { expected: 'foo_bar', name: 'fooBar' },
               messageId: 'variableSnakeCase',
            },
         ],
         name: 'withDefaults reports once',
      },
   ],
   valid: [
      { code: 'defineProps<{ foo_bar: string }>()', name: 'snake_case value prop' },
      { code: 'defineProps<{ onClick: () => void }>()', name: 'camelCase function prop' },
      {
         code: 'defineProps({ foo: String })',
         name: 'runtime defineProps without type args',
      },
      {
         code: 'defineProps<Props>()',
         name: 'type reference is not a type literal',
      },
      {
         code: 'defineProps<{ [id: string]: string }>()',
         name: 'index signature has no named props',
      },
      {
         code: "defineProps<{ 'onUpdate:modelValue': () => void }>()",
         name: 'name with colon is skipped',
      },
      {
         code: "defineProps<{ 'update:foo': string }>()",
         name: 'update: prefix is skipped',
      },
      { code: 'other<{ fooBar: string }>()', name: 'unrelated call' },
      { code: 'defineProps()', name: 'no type arguments' },
   ],
})

vue_tester.run('vue-prop-name-casing-by-type in SFC', rule, {
   invalid: [
      {
         code: '<script setup lang="ts">defineProps<{ fooBar: string }>()</script>',
         errors: [{ messageId: 'variableSnakeCase' }],
         filename: 'a.vue',
         name: 'SFC camelCase value prop',
      },
   ],
   valid: [
      {
         code: '<script setup lang="ts">defineProps<{ foo_bar: string }>()</script>',
         filename: 'a.vue',
         name: 'SFC snake_case value prop',
      },
   ],
})

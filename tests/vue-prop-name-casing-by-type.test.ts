import { it } from 'node:test'
import rule_module from '../eslint-rules/vue-prop-name-casing-by-type.ts'
import { as_rule_tester_rule, ts_tester, vue_tester } from './helpers/rule_tester.ts'

it('vue-prop-name-casing-by-type', () => {
   ts_tester.run('vue-prop-name-casing-by-type', as_rule_tester_rule(rule_module), {
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
            output: 'defineProps<{ foo_bar: string }>()',
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
            output: 'defineProps<{ onClick: () => void }>()',
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
            output: 'defineProps<{ onClick: string | (() => void) }>()',
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
            output: 'defineProps<{ onClick: (() => void) & { extra: number } }>()',
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
            output: 'defineProps<{ onClick: (() => void) }>()',
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
            output: "defineProps<{ 'foo_bar': string }>()",
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
            output: 'withDefaults(defineProps<{ foo_bar: string }>(), {})',
         },
         {
            code: "defineProps<{ 'bazQux': string }>()",
            errors: [{ messageId: 'variableSnakeCase' }],
            name: 'double-quoted string key keeps its quotes',
            output: "defineProps<{ 'baz_qux': string }>()",
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
})

it('vue-prop-name-casing-by-type in SFC', () => {
   vue_tester.run('vue-prop-name-casing-by-type in SFC', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: '<script setup lang="ts">defineProps<{ fooBar: string }>()</script>',
            errors: [{ messageId: 'variableSnakeCase' }],
            filename: 'a.vue',
            name: 'SFC camelCase value prop',
            output:
               '<script setup lang="ts">defineProps<{ foo_bar: string }>()</script>',
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
})

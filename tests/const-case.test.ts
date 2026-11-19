import { it } from 'node:test'
import type { RuleTester } from 'eslint'
import rule_module from '../eslint-rules/const-case.ts'
import { as_rule_tester_rule, ts_tester, vue_tester } from './helpers/rule_tester.ts'

function suggest_only({
   code,
   name,
   next,
   suggested,
   title,
}: {
   code: string
   name: string
   next: string
   suggested: string
   title: string
}): RuleTester.InvalidTestCase {
   return {
      code,
      errors: [
         {
            messageId: 'upperCase',
            suggestions: [{ data: { name, next }, messageId: 'renameTo', output: suggested }],
         },
      ],
      name: title,
      output: null,
   }
}

it('const-case', () => {
   ts_tester.run('const-case', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            code: 'const foo = 1',
            errors: [{ messageId: 'upperCase' }],
            name: 'literal const in lower case',
            output: 'const FOO = 1',
         },
         {
            code: 'const foo = -1',
            errors: [{ messageId: 'upperCase' }],
            name: 'negative literal const in lower case',
            output: 'const FOO = -1',
         },
         {
            code: 'const foo = { a: 1 } as const',
            errors: [{ messageId: 'upperCase' }],
            name: 'as const object in lower case',
            output: 'const FOO = { a: 1 } as const',
         },
         {
            code: 'const foo = { a: 1 } as const satisfies T',
            errors: [{ messageId: 'upperCase' }],
            name: 'as const satisfies in lower case',
            output: 'const FOO = { a: 1 } as const satisfies T',
         },
         {
            code: 'let FOO = 1',
            errors: [{ messageId: 'lowerCase' }],
            name: 'let in UPPER_CASE',
            output: 'let foo = 1',
         },
         {
            code: 'const FOO = bar()',
            errors: [{ messageId: 'lowerCase' }],
            name: 'computed const in UPPER_CASE',
            output: 'const foo = bar()',
         },
         {
            code: 'const FOO = 1 as number',
            errors: [{ messageId: 'lowerCase' }],
            name: 'typed literal without as const in UPPER_CASE',
            output: 'const foo = 1 as number',
         },
         {
            code: 'const foo = 1, BAR = 2',
            errors: [{ messageId: 'upperCase' }],
            name: 'multi-declarator reports the lower-case literal',
            output: 'const FOO = 1, BAR = 2',
         },
         {
            code: 'const fooBar = 1\nconst total = fooBar + 1',
            errors: [{ messageId: 'upperCase' }],
            name: 'fix renames the declaration and its references',
            output: 'const FOO_BAR = 1\nconst total = FOO_BAR + 1',
         },
         {
            code: 'for (const foo = 0; foo < 1; foo++) {}',
            errors: [{ messageId: 'upperCase' }],
            name: 'loop variable is renamed in every reference',
            output: 'for (const FOO = 0; FOO < 1; FOO++) {}',
         },
         {
            code: 'const Foo = 1',
            errors: [{ messageId: 'upperCase' }],
            name: 'non-conventional casing is normalised by the fix',
            output: 'const FOO = 1',
         },
         {
            code: 'export const foo = 1',
            errors: [
               {
                  messageId: 'upperCase',
                  suggestions: [
                     {
                        data: { name: 'foo', next: 'FOO' },
                        messageId: 'renameTo',
                        output: 'export const FOO = 1',
                     },
                  ],
               },
            ],
            name: 'exported const gets a suggestion, not an automatic fix',
            output: null,
         },
         {
            code: 'export const foo = 1\nexport const total = foo + 1',
            errors: [
               {
                  messageId: 'upperCase',
                  suggestions: [
                     {
                        data: { name: 'foo', next: 'FOO' },
                        messageId: 'renameTo',
                        output: 'export const FOO = 1\nexport const total = foo + 1',
                     },
                  ],
               },
            ],
            name: 'exported const with readers is never auto-renamed',
            output: null,
         },
         suggest_only({
            code: 'const page_size = 20\nconst opts = { page_size }',
            name: 'page_size',
            next: 'PAGE_SIZE',
            suggested: 'const PAGE_SIZE = 20\nconst opts = { page_size }',
            title: 'a shorthand property reader would change the object key',
         }),
         suggest_only({
            code: 'const limit = 10\nexport { limit }',
            name: 'limit',
            next: 'LIMIT',
            suggested: 'const LIMIT = 10\nexport { limit }',
            title: 'an export specifier would change the exported name',
         }),
         suggest_only({
            code: 'const timeout = 30\nfunction f(TIMEOUT) {\n   return TIMEOUT + timeout\n}',
            name: 'timeout',
            next: 'TIMEOUT',
            suggested: 'const TIMEOUT = 30\nfunction f(TIMEOUT) {\n   return TIMEOUT + timeout\n}',
            title: 'the new name is shadowed where the binding is read',
         }),
         suggest_only({
            code: 'const TIMEOUT = 5\nfunction g() {\n   const timeout = 1\n   return TIMEOUT + timeout\n}',
            name: 'timeout',
            next: 'TIMEOUT',
            suggested:
               'const TIMEOUT = 5\nfunction g() {\n   const TIMEOUT = 1\n   return TIMEOUT + timeout\n}',
            title: 'the new name already resolves to an outer binding',
         }),
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

it('const-case in SFC', () => {
   vue_tester.run('const-case in SFC', as_rule_tester_rule(rule_module), {
      invalid: [
         {
            ...suggest_only({
               code: '<script setup lang="ts">const page_size = 20</script>\n<template>{{ page_size }}</template>',
               name: 'page_size',
               next: 'PAGE_SIZE',
               suggested:
                  '<script setup lang="ts">const PAGE_SIZE = 20</script>\n<template>{{ page_size }}</template>',
               title: 'the template is not renamed, so a .vue file gets no fix',
            }),
            filename: 'a.vue',
         },
      ],
      valid: [],
   })
})

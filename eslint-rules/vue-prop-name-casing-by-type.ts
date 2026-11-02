import type { KaezonRule, TSESLint, TSESTree } from '../types.ts'

/**
 * Custom ESLint rule: enforce camelCase for function props, snake_case for other props.
 * @see vue/prop-name-casing (disabled) - this rule replaces it with type-aware casing.
 */

const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

function is_defines_props(node: TSESTree.CallExpression): boolean {
   const { callee } = node
   return callee.type === 'Identifier' && callee.name === 'defineProps'
}

function extract_define_props_call(
   node: TSESTree.CallExpression,
): TSESTree.CallExpression | null {
   if (is_defines_props(node)) return node

   const { callee } = node
   if (callee.type !== 'Identifier' || callee.name !== 'withDefaults') {
      return null
   }

   const first_arg = node.arguments[0]
   if (first_arg?.type !== 'CallExpression') return null
   return is_defines_props(first_arg) ? first_arg : null
}

function get_prop_name(node: TSESTree.TSPropertySignature): string | null {
   if (node.key.type === 'Identifier') return node.key.name
   if (node.key.type === 'Literal') return String(node.key.value)
   return null
}

/**
 * Renaming an identifier key is safe: the prop name is the identifier itself.
 * A string-literal key has to keep its quotes, otherwise the fix would emit
 * invalid syntax. Computed keys and template literals return null and get no fix.
 */
function build_rename({
   node,
   next_name,
}: {
   node: TSESTree.TSPropertySignature
   next_name: string
}): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix) | null {
   const { key } = node
   if (key.type === 'Identifier') {
      return fixer => fixer.replaceText(key, next_name)
   }
   if (key.type === 'Literal' && typeof key.value === 'string') {
      const quote = key.raw.startsWith('"') ? '"' : "'"
      return fixer => fixer.replaceText(key, `${quote}${next_name}${quote}`)
   }
   return null
}

function get_props_from_type_literal(
   type_literal: TSESTree.TypeNode | undefined,
): readonly TSESTree.TSPropertySignature[] {
   if (type_literal?.type !== 'TSTypeLiteral') return []
   return type_literal.members.filter(
      (member): member is TSESTree.TSPropertySignature =>
         member.type === 'TSPropertySignature',
   )
}

function is_function_type(node: TSESTree.TSPropertySignature): boolean {
   const type = node.typeAnnotation?.typeAnnotation
   if (!type) return false
   if (type.type === 'TSFunctionType') return true
   if (type.type === 'TSUnionType') {
      return type.types.some(inner => inner.type === 'TSFunctionType')
   }
   if (type.type === 'TSIntersectionType') {
      return type.types.some(inner => inner.type === 'TSFunctionType')
   }
   return false
}

function is_wrapped_in_with_defaults(node: TSESTree.CallExpression): boolean {
   const { parent } = node
   if (parent?.type !== 'CallExpression') return false
   const { callee } = parent
   return callee.type === 'Identifier' && callee.name === 'withDefaults'
}

function has_update_prefix(name: string): boolean {
   return name.includes(':') || name.startsWith('update:')
}

function to_camel_case(name: string): string {
   return name.replaceAll(/_([a-z])/g, (_, char: string) => char.toUpperCase())
}

function to_snake_case(name: string): string {
   return name.replaceAll(/([A-Z])/g, (_, char: string) =>
      `_${char.toLowerCase()}`,
   )
}

const rule: KaezonRule<'functionCamelCase' | 'variableSnakeCase'> = {
   create(context) {
      function check_prop(prop: TSESTree.TSPropertySignature): void {
         const name = get_prop_name(prop)
         if (!name || has_update_prefix(name)) return

         const is_function = is_function_type(prop)

         if (!is_function && !SNAKE_CASE.test(name)) {
            const expected = to_snake_case(name)
            if (!expected) return
            context.report({
               data: { expected, name },
               fix: build_rename({ next_name: expected, node: prop }),
               messageId: 'variableSnakeCase',
               node: prop.key,
            })
            return
         }

         if (is_function && !CAMEL_CASE.test(name)) {
            const expected = to_camel_case(name)
            if (!expected) return
            context.report({
               data: { expected, name },
               fix: build_rename({ next_name: expected, node: prop }),
               messageId: 'functionCamelCase',
               node: prop.key,
            })
         }
      }

      function visit_call_expression(node: TSESTree.CallExpression): void {
         const define_props_call = extract_define_props_call(node)
         if (!define_props_call) return

         // withDefaults(defineProps<...>()) would otherwise report on both calls.
         if (define_props_call === node && is_wrapped_in_with_defaults(node)) {
            return
         }

         const type_param = define_props_call.typeArguments?.params[0]
         if (!type_param) return

         for (const prop of get_props_from_type_literal(type_param)) {
            check_prop(prop)
         }
      }

      return {
         CallExpression: visit_call_expression,
      }
   },
   meta: {
      docs: {
         description:
            'Enforce camelCase for function props and snake_case for other props in defineProps',
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezonvue-prop-name-casing-by-type',
      },
      fixable: 'code',
      messages: {
         functionCamelCase:
            "Function prop '{{name}}' should be camelCase (e.g. {{expected}}).",
         variableSnakeCase:
            "Variable prop '{{name}}' should be snake_case (e.g. {{expected}}).",
      },
      schema: [],
      type: 'suggestion',
   },
}

export default rule

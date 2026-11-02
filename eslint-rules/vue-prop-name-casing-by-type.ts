import type { KaezonRule, TSESTree } from '../types.ts'

/**
 * Custom ESLint rule: enforce camelCase for function props, snake_case for other props.
 * @see vue/prop-name-casing (disabled) - this rule replaces it with type-aware casing.
 */

const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

function extract_define_props_call(
   node: TSESTree.CallExpression,
): TSESTree.CallExpression | null {
   const { callee } = node
   if (callee.type === 'Identifier' && callee.name === 'defineProps') {
      return node
   }
   if (callee.type === 'Identifier' && callee.name === 'withDefaults') {
      const first_arg = node.arguments[0]
      if (
         first_arg?.type === 'CallExpression' &&
         first_arg.callee.type === 'Identifier' &&
         first_arg.callee.name === 'defineProps'
      ) {
         return first_arg
      }
   }
   return null
}

function get_prop_name(node: TSESTree.TSPropertySignature): string | null {
   if (node.key.type === 'Identifier') return node.key.name
   if (node.key.type === 'Literal') return String(node.key.value)
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

const rule: KaezonRule<'functionCamelCase' | 'variableSnakeCase'> = {
   create(context) {
      function visit_call_expression(node: TSESTree.CallExpression): void {
         const define_props_call = extract_define_props_call(node)
         if (!define_props_call) return
         if (
            define_props_call === node &&
            node.parent?.type === 'CallExpression' &&
            node.parent.callee.type === 'Identifier' &&
            node.parent.callee.name === 'withDefaults'
         ) {
            return
         }
         const type_param = define_props_call.typeArguments?.params[0]
         if (!type_param) return
         const props = get_props_from_type_literal(type_param)

         for (const prop of props) {
            const name = get_prop_name(prop)
            if (!name) continue
            if (name.includes(':') || name.startsWith('update:')) continue

            const is_function = is_function_type(prop)
            const is_camel_case = CAMEL_CASE.test(name)
            const is_snake_case = SNAKE_CASE.test(name)

            if (is_function && !is_camel_case) {
               const expected = name.replaceAll(/_([a-z])/g, (_, char: string) =>
                  char.toUpperCase(),
               )
               context.report({
                  data: { expected: expected || 'myFunction', name },
                  messageId: 'functionCamelCase',
                  node: prop.key,
               })
            } else if (!is_function && !is_snake_case) {
               const expected = name.replaceAll(
                  /([A-Z])/g,
                  (_, char: string) => `_${char.toLowerCase()}`,
               )
               context.report({
                  data: { expected: expected || 'total_records', name },
                  messageId: 'variableSnakeCase',
                  node: prop.key,
               })
            }
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
      },
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

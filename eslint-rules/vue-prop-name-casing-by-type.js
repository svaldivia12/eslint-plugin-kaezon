/**
 * Custom ESLint rule: enforce camelCase for function props, snake_case for other props.
 * @see vue/prop-name-casing (disabled) - this rule replaces it with type-aware casing.
 */

const CAMEL_CASE = /^[a-z][a-zA-Z0-9]*$/
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

function extractDefinePropsCall(node) {
   if (node.type !== 'CallExpression') return null
   const callee = node.callee
   if (callee.type === 'Identifier' && callee.name === 'defineProps') {
      return node
   }
   if (callee.type === 'Identifier' && callee.name === 'withDefaults') {
      const firstArg = node.arguments[0]
      if (
         firstArg?.type === 'CallExpression' &&
         firstArg.callee?.name === 'defineProps'
      ) {
         return firstArg
      }
   }
   return null
}

function getPropName(node) {
   if (node.key.type === 'Identifier') return node.key.name
   if (node.key.type === 'Literal') return String(node.key.value)
   return null
}

function getPropsFromTypeLiteral(typeLiteral) {
   if (typeLiteral?.type !== 'TSTypeLiteral') return []
   return typeLiteral.members.filter(m => m.type === 'TSPropertySignature')
}

function isFunctionType(node) {
   if (!node?.typeAnnotation?.typeAnnotation) return false
   const type = node.typeAnnotation.typeAnnotation
   if (type.type === 'TSFunctionType') return true
   if (type.type === 'TSUnionType') {
      return type.types.some(t => t.type === 'TSFunctionType')
   }
   if (type.type === 'TSIntersectionType') {
      return type.types.some(t => t.type === 'TSFunctionType')
   }
   if (type.type === 'TSParenthesizedType') {
      return isFunctionType({
         typeAnnotation: { typeAnnotation: type.typeAnnotation },
      })
   }
   return false
}

export default {
   create(context) {
      function visitCallExpression(node) {
         const definePropsCall = extractDefinePropsCall(node)
         if (!definePropsCall) return
         if (
            definePropsCall === node &&
            node.parent?.type === 'CallExpression' &&
            node.parent.callee?.name === 'withDefaults'
         ) {
            return
         }
         const typeArgs = definePropsCall.typeArguments
         const typeParam = typeArgs?.params?.[0] ?? typeArgs?.[0]
         if (!typeParam) return
         const props = getPropsFromTypeLiteral(typeParam)

         for (const prop of props) {
            const name = getPropName(prop)
            if (!name) continue
            if (name.includes(':') || name.startsWith('update:')) continue

            const isFunction = isFunctionType(prop)
            const isCamelCase = CAMEL_CASE.test(name)
            const isSnakeCase = SNAKE_CASE.test(name)

            if (isFunction && !isCamelCase) {
               const expected = name.replaceAll(/_([a-z])/g, (_, c) =>
                  c.toUpperCase(),
               )
               context.report({
                  data: { expected: expected || 'myFunction', name },
                  messageId: 'functionCamelCase',
                  node: prop.key,
               })
            } else if (!isFunction && !isSnakeCase) {
               const expected = name.replaceAll(
                  /([A-Z])/g,
                  (_, c) => `_${c.toLowerCase()}`,
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
         CallExpression: visitCallExpression,
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

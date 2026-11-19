import type { KaezonRule, TSESTree } from '../types.ts'

function is_computed_call(node: TSESTree.Node): node is TSESTree.CallExpression {
   if (node.type !== 'CallExpression') return false

   const { callee } = node
   return callee.type === 'Identifier' && callee.name === 'computed'
}

function is_function_getter(
   node: TSESTree.Node | undefined,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
   return node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression'
}

/** The getter of `computed(() => …)` or of a writable `computed({ get, set })`. */
function find_getter(
   node: TSESTree.CallExpressionArgument | undefined,
): TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression | null {
   if (is_function_getter(node)) return node
   if (node?.type !== 'ObjectExpression') return null

   const get = node.properties.find(
      (property): property is TSESTree.Property =>
         property.type === 'Property' &&
         !property.computed &&
         property.key.type === 'Identifier' &&
         property.key.name === 'get',
   )
   return is_function_getter(get?.value) ? get.value : null
}

const rule: KaezonRule<'missingReturnType'> = {
   create(context) {
      function visit_call_expression(node: TSESTree.CallExpression): void {
         if (!is_computed_call(node)) return

         // `computed<T>(…)` types the getter through its type argument.
         if (node.typeArguments) return

         const getter = find_getter(node.arguments[0])
         if (!getter) return
         if (getter.returnType?.type === 'TSTypeAnnotation') return

         context.report({
            messageId: 'missingReturnType',
            node: getter,
         })
      }

      return {
         CallExpression: visit_call_expression,
      }
   },
   meta: {
      docs: {
         description: 'Require explicit return types for getters passed to computed',
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezoncomputed-explicit-return-type',
      },
      messages: {
         missingReturnType: 'Computed getters must declare an explicit return type.',
      },
      schema: [],
      type: 'problem',
   },
}

export default rule

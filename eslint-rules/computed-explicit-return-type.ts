import type { KaezonRule, TSESTree } from '../types.ts'

function is_computed_call(node: TSESTree.Node): node is TSESTree.CallExpression {
   if (node.type !== 'CallExpression') return false

   const { callee } = node
   return callee.type === 'Identifier' && callee.name === 'computed'
}

function is_function_getter(
   node: TSESTree.Node | undefined,
): node is TSESTree.ArrowFunctionExpression | TSESTree.FunctionExpression {
   return (
      node?.type === 'ArrowFunctionExpression' ||
      node?.type === 'FunctionExpression'
   )
}

const rule: KaezonRule<'missingReturnType'> = {
   create(context) {
      function visit_call_expression(node: TSESTree.CallExpression): void {
         if (!is_computed_call(node)) return

         const getter = node.arguments[0]
         if (!is_function_getter(getter)) return
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
         description:
            'Require explicit return types for getters passed to computed',
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezoncomputed-explicit-return-type',
      },
      messages: {
         missingReturnType:
            'Computed getters must declare an explicit return type.',
      },
      schema: [],
      type: 'problem',
   },
}

export default rule

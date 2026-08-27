function isComputedCall(node) {
   if (node.type !== 'CallExpression') return false

   const callee = node.callee
   return callee.type === 'Identifier' && callee.name === 'computed'
}

function isFunctionGetter(node) {
   return (
      node?.type === 'ArrowFunctionExpression' ||
      node?.type === 'FunctionExpression'
   )
}

export default {
   create(context) {
      function visitCallExpression(node) {
         if (!isComputedCall(node)) return

         const getter = node.arguments[0]
         if (!isFunctionGetter(getter)) return
         if (getter.returnType?.type === 'TSTypeAnnotation') return

         context.report({
            messageId: 'missingReturnType',
            node: getter,
         })
      }

      return {
         CallExpression: visitCallExpression,
      }
   },
   meta: {
      docs: {
         description:
            'Require explicit return types for getters passed to computed',
      },
      messages: {
         missingReturnType:
            'Computed getters must declare an explicit return type.',
      },
      schema: [],
      type: 'problem',
   },
}

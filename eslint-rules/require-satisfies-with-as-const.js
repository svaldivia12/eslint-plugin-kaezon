/**
 * Require "as const satisfies SomeType" instead of bare "as const".
 * Validates structure at compile time while preserving literal inference.
 * Skips primitive literals (redundant for const declarations).
 * Report-only; no autofix.
 */

function isBareAsConst(node) {
   if (node.type !== 'TSAsExpression') return false

   const type_ref = node.typeAnnotation
   if (
      type_ref?.type !== 'TSTypeReference' ||
      type_ref.typeName?.name !== 'const'
   ) {
      return false
   }

   let current = node.parent
   while (current) {
      if (current.type === 'TSSatisfiesExpression') return false
      current = current.parent
   }

   return true
}

function isPrimitiveLiteral(node) {
   return node?.expression?.type === 'Literal'
}

export default {
   create(context) {
      function visitTSAsExpression(node) {
         if (!isBareAsConst(node)) return
         if (isPrimitiveLiteral(node)) return

         context.report({
            messageId: 'requireSatisfies',
            node,
         })
      }

      return {
         TSAsExpression: visitTSAsExpression,
      }
   },
   meta: {
      docs: {
         description:
            'Require "as const satisfies SomeType" instead of bare "as const" to validate structure at compile time.',
      },
      messages: {
         requireSatisfies:
            'Use "as const satisfies SomeType" to validate the type. Bare "as const" does not check structure.',
      },
      schema: [],
      type: 'suggestion',
   },
}

import type { KaezonRule, TSESTree } from '../types.ts'

/**
 * Require "as const satisfies SomeType" instead of bare "as const".
 * Validates structure at compile time while preserving literal inference.
 * Skips primitive literals (redundant for const declarations).
 * Report-only; no autofix.
 */

function is_bare_as_const(node: TSESTree.TSAsExpression): boolean {
   if (node.type !== 'TSAsExpression') return false

   const { typeAnnotation } = node
   if (
      typeAnnotation.type !== 'TSTypeReference' ||
      typeAnnotation.typeName.type !== 'Identifier' ||
      typeAnnotation.typeName.name !== 'const'
   ) {
      return false
   }

   let current: TSESTree.Node | undefined = node.parent
   while (current) {
      if (current.type === 'TSSatisfiesExpression') return false
      current = current.parent
   }

   return true
}

function is_primitive_literal(node: TSESTree.TSAsExpression): boolean {
   return node.expression.type === 'Literal'
}

const rule: KaezonRule<'requireSatisfies'> = {
   create(context) {
      function visit_ts_as_expression(node: TSESTree.TSAsExpression): void {
         if (!is_bare_as_const(node)) return
         if (is_primitive_literal(node)) return

         context.report({
            messageId: 'requireSatisfies',
            node,
         })
      }

      return {
         TSAsExpression: visit_ts_as_expression,
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

export default rule

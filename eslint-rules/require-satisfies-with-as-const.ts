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

   // Only `x as const satisfies T` checks x; a satisfies further out checks something else.
   return node.parent.type !== 'TSSatisfiesExpression' || node.parent.expression !== node
}

function is_primitive_literal(node: TSESTree.TSAsExpression): boolean {
   const { expression } = node
   return (
      expression.type === 'Literal' ||
      (expression.type === 'UnaryExpression' &&
         expression.operator === '-' &&
         expression.argument.type === 'Literal')
   )
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
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezonrequire-satisfies-with-as-const',
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

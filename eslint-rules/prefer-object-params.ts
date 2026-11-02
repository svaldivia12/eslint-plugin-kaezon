import type { KaezonRule, TSESTree } from '../types.ts'

/**
 * Prefer a single object parameter over multiple positional parameters.
 * Example: (a, b, c) => ... should become ({ a, b, c }) => ...
 * Skips callbacks, object methods, and computed() getters.
 */

type FunctionNode =
   | TSESTree.ArrowFunctionExpression
   | TSESTree.FunctionDeclaration
   | TSESTree.FunctionExpression
   | TSESTree.TSEmptyBodyFunctionExpression

function get_user_params(params: readonly TSESTree.Parameter[]): readonly TSESTree.Parameter[] {
   return params.filter(param => !(param.type === 'Identifier' && param.name === 'this'))
}

function is_computed_getter(node: TSESTree.Node): boolean {
   const { parent } = node
   if (parent?.type !== 'CallExpression') return false
   const { callee } = parent
   return callee.type === 'Identifier' && callee.name === 'computed'
}

function is_external_callback(node: TSESTree.Node): boolean {
   const { parent } = node
   if (!parent) return false
   if (parent.type === 'Property') return true
   if (parent.type === 'CallExpression') return true
   return false
}

function is_object_param(param: TSESTree.Parameter): boolean {
   const inner = param.type === 'AssignmentPattern' ? param.left : param
   return inner.type === 'ObjectPattern'
}

const rule: KaezonRule<'preferObjectParams'> = {
   create(context) {
      function check_function(node: FunctionNode): void {
         if (is_external_callback(node)) return
         if (is_computed_getter(node)) return

         const user_params = get_user_params(node.params)
         const first = user_params[0]
         if (user_params.length < 2 || first === undefined) return
         if (is_object_param(first)) return

         context.report({
            data: {
               count: String(user_params.length),
            },
            messageId: 'preferObjectParams',
            node: first,
         })
      }

      return {
         ArrowFunctionExpression: check_function,
         FunctionDeclaration: check_function,
         FunctionExpression: check_function,
      }
   },
   meta: {
      docs: {
         description: 'Prefer a single object parameter over multiple positional parameters.',
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezonprefer-object-params',
      },
      messages: {
         preferObjectParams:
            'Use a single object parameter instead of {{count}} positional parameters. Example: (a, b, c) -> ({ a, b, c })',
      },
      schema: [],
      type: 'suggestion',
   },
}

export default rule

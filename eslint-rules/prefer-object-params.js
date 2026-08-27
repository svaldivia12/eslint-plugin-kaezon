/**
 * Prefer a single object parameter over multiple positional parameters.
 * Example: (a, b, c) => ... should become ({ a, b, c }) => ...
 * Skips callbacks, object methods, and computed() getters.
 */

function get_user_params(params) {
   return params.filter(p => !(p.type === 'Identifier' && p.name === 'this'))
}

function is_computed_getter(node) {
   const parent = node.parent
   if (parent?.type !== 'CallExpression') return false
   const callee = parent.callee
   return callee?.type === 'Identifier' && callee?.name === 'computed'
}

function is_external_callback(node) {
   const parent = node.parent
   if (!parent) return false
   if (parent.type === 'Property') return true
   if (parent.type === 'CallExpression') return true
   return false
}

function is_object_param(param) {
   const inner = param.type === 'AssignmentPattern' ? param.left : param
   return inner?.type === 'ObjectPattern'
}

export default {
   create(context) {
      function check_function(node) {
         if (is_external_callback(node)) return
         if (is_computed_getter(node)) return

         const params = node.params ?? []
         const user_params = get_user_params(params)
         if (user_params.length < 2) return

         const first = user_params[0]
         if (is_object_param(first)) return

         context.report({
            data: { count: user_params.length },
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
         description:
            'Prefer a single object parameter over multiple positional parameters.',
      },
      messages: {
         preferObjectParams:
            'Use a single object parameter instead of {{count}} positional parameters. Example: (a, b, c) -> ({ a, b, c })',
      },
      schema: [],
      type: 'suggestion',
   },
}

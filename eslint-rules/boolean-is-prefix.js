import ts from 'typescript'

const boolean_ref_names = new Set(['Ref', 'ShallowRef', 'ComputedRef'])
const boolean_ref_calls = new Set(['ref', 'shallowRef'])

function get_parser_type_services(context) {
   const services = context.sourceCode.parserServices
   if (!services?.program || !services.esTreeNodeToTSNodeMap) return null
   return {
      checker: services.program.getTypeChecker(),
      map: services.esTreeNodeToTSNodeMap,
   }
}

function get_node_type({ node, type_services }) {
   const ts_node = type_services.map.get(node)
   if (!ts_node) return null
   return type_services.checker.getTypeAtLocation(ts_node)
}

function is_boolean_like_type(type) {
   return (type.flags & ts.TypeFlags.BooleanLike) !== 0
}

function get_type_symbol_name(type) {
   const symbol = type.aliasSymbol ?? type.target?.symbol ?? type.symbol
   return symbol?.getName() ?? null
}

function get_type_arguments({ checker, type }) {
   if (type.aliasTypeArguments?.length) return type.aliasTypeArguments
   if (type.target) return checker.getTypeArguments(type)
   return []
}

function is_boolean_ref_checker_type({ checker, type }) {
   if (!boolean_ref_names.has(get_type_symbol_name(type))) return false
   const inner = get_type_arguments({ checker, type })[0]
   return inner != null && is_boolean_like_type(inner)
}

function is_boolean_binding_checker_type({ checker, type }) {
   return (
      is_boolean_like_type(type) || is_boolean_ref_checker_type({ checker, type })
   )
}

function get_ast_type_name(type_node) {
   if (type_node?.type !== 'TSTypeReference') return null
   if (type_node.typeName?.type === 'Identifier') return type_node.typeName.name
   return null
}

function get_ast_type_arguments(type_node) {
   return type_node.typeArguments?.params ?? type_node.typeParameters?.params
}

function is_ast_boolean_type(type_node) {
   if (!type_node) return false
   if (type_node.type === 'TSBooleanKeyword') return true
   if (type_node.type === 'TSLiteralType') {
      return (
         type_node.literal?.type === 'Literal' &&
         typeof type_node.literal.value === 'boolean'
      )
   }
   return false
}

function is_ast_boolean_ref_type(type_node) {
   if (!boolean_ref_names.has(get_ast_type_name(type_node))) return false
   return is_ast_boolean_type(get_ast_type_arguments(type_node)?.[0])
}

function get_call_type_arguments(call) {
   return call.typeArguments?.params ?? call.typeParameters?.params
}

function is_ast_boolean_ref_call(init) {
   if (init?.type !== 'CallExpression') return false
   if (init.callee?.type !== 'Identifier') return false
   if (!boolean_ref_calls.has(init.callee.name)) return false

   if (is_ast_boolean_type(get_call_type_arguments(init)?.[0])) return true

   const first_arg = init.arguments[0]
   return (
      first_arg?.type === 'Literal' && typeof first_arg.value === 'boolean'
   )
}

function is_ast_boolean_literal_init(init) {
   return init?.type === 'Literal' && typeof init.value === 'boolean'
}

function is_ast_boolean_binding({ id, init }) {
   const annotation = id.typeAnnotation?.typeAnnotation
   if (is_ast_boolean_type(annotation)) return true
   if (is_ast_boolean_ref_type(annotation)) return true
   if (is_ast_boolean_ref_call(init)) return true
   return is_ast_boolean_literal_init(init)
}

function is_boolean_binding({ id, init, type_services }) {
   if (type_services) {
      const type = get_node_type({ node: id, type_services })
      if (
         type &&
         is_boolean_binding_checker_type({
            checker: type_services.checker,
            type,
         })
      ) {
         return true
      }
   }
   return is_ast_boolean_binding({ id, init })
}

function lacks_is_prefix(name) {
   return !name.startsWith('is_')
}

export default {
   create(context) {
      const type_services = get_parser_type_services(context)

      function check_identifier({ id, init }) {
         if (id?.type !== 'Identifier') return
         if (!is_boolean_binding({ id, init, type_services })) return
         if (!lacks_is_prefix(id.name)) return

         context.report({
            data: { name: id.name },
            messageId: 'missingIsPrefix',
            node: id,
         })
      }

      function visit_variable_declarator(node) {
         check_identifier({ id: node.id, init: node.init })
      }

      function visit_function(node) {
         for (const param of node.params) {
            check_identifier({ id: param, init: null })
         }
      }

      return {
         ArrowFunctionExpression: visit_function,
         FunctionDeclaration: visit_function,
         FunctionExpression: visit_function,
         TSEmptyBodyFunctionExpression: visit_function,
         VariableDeclarator: visit_variable_declarator,
      }
   },
   meta: {
      docs: {
         description:
            'Require is_ prefix for boolean and Vue boolean-ref bindings',
         requiresTypeChecking: true,
      },
      messages: {
         missingIsPrefix:
            "Boolean '{{name}}' should use an is_ prefix that reads naturally in English (e.g. is_{{name}}); do not add is_ only to satisfy the rule.",
      },
      schema: [],
      type: 'suggestion',
   },
}

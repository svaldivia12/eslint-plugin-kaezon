import ts from 'typescript'
import type { KaezonRule, TSESTree } from '../types.ts'

const boolean_ref_names = new Set(['Ref', 'ShallowRef', 'ComputedRef'])
const boolean_ref_calls = new Set(['ref', 'shallowRef'])

interface TypeServices {
   checker: ts.TypeChecker
   map: { get(node: TSESTree.Node): ts.Node | undefined }
}

function get_parser_type_services(
   context: Parameters<KaezonRule['create']>[0],
): TypeServices | null {
   const services = context.sourceCode.parserServices as
      | {
           esTreeNodeToTSNodeMap?: Map<TSESTree.Node, ts.Node>
           program?: ts.Program
        }
      | undefined

   if (!services?.program || !services.esTreeNodeToTSNodeMap) return null
   return {
      checker: services.program.getTypeChecker(),
      map: services.esTreeNodeToTSNodeMap,
   }
}

function get_node_type({
   node,
   type_services,
}: {
   node: TSESTree.Node
   type_services: TypeServices
}): ts.Type | null {
   const ts_node = type_services.map.get(node)
   if (!ts_node) return null
   return type_services.checker.getTypeAtLocation(ts_node)
}

function get_symbol_name(type: ts.Type): string | null {
   const symbol =
      type.aliasSymbol ??
      (type as { target?: ts.Type }).target?.symbol ??
      type.getSymbol()
   return symbol?.getName() ?? null
}

function get_type_arguments({
   checker,
   type,
}: {
   checker: ts.TypeChecker
   type: ts.Type
}): readonly ts.Type[] {
   if (type.aliasTypeArguments?.length) return type.aliasTypeArguments
   const target = (type as { target?: ts.Type }).target
   if (target) return checker.getTypeArguments(target as ts.TypeReference)
   return []
}

function is_boolean_ref_checker_type({
   checker,
   type,
}: {
   checker: ts.TypeChecker
   type: ts.Type
}): boolean {
   if (!boolean_ref_names.has(get_symbol_name(type) ?? '')) return false
   const inner = get_type_arguments({ checker, type })[0]
   return inner != null && is_boolean_like(inner)
}

function is_boolean_like(type: ts.Type): boolean {
   return (type.flags & ts.TypeFlags.BooleanLike) !== 0
}

function get_ast_type_name(type_node: TSESTree.TypeNode | undefined): string | null {
   if (type_node?.type !== 'TSTypeReference') return null
   if (type_node.typeName.type === 'Identifier') return type_node.typeName.name
   return null
}

function get_ast_type_arguments(
   type_node: TSESTree.TypeNode | undefined,
): readonly TSESTree.TypeNode[] {
   if (type_node?.type !== 'TSTypeReference') return []
   return type_node.typeArguments?.params ?? []
}

function is_ast_boolean_type(type_node: TSESTree.TypeNode | undefined): boolean {
   if (!type_node) return false
   if (type_node.type === 'TSBooleanKeyword') return true
   if (type_node.type === 'TSLiteralType') {
      return (
         type_node.literal.type === 'Literal' &&
         typeof type_node.literal.value === 'boolean'
      )
   }
   return false
}

function is_ast_boolean_ref_type(
   type_node: TSESTree.TypeNode | undefined,
): boolean {
   if (!boolean_ref_names.has(get_ast_type_name(type_node) ?? '')) return false
   return is_ast_boolean_type(get_ast_type_arguments(type_node)[0])
}

function is_ast_boolean_ref_call(init: TSESTree.Node | null): boolean {
   if (init?.type !== 'CallExpression') return false
   if (init.callee.type !== 'Identifier') return false
   if (!boolean_ref_calls.has(init.callee.name)) return false

   if (is_ast_boolean_type(init.typeArguments?.params[0])) return true

   const first_arg = init.arguments[0]
   return (
      first_arg?.type === 'Literal' && typeof first_arg.value === 'boolean'
   )
}

function is_ast_boolean_binding({
   id,
   init,
}: {
   id: TSESTree.Identifier
   init: TSESTree.Node | null
}): boolean {
   const annotation = id.typeAnnotation?.typeAnnotation
   if (is_ast_boolean_type(annotation)) return true
   if (is_ast_boolean_ref_type(annotation)) return true
   if (is_ast_boolean_ref_call(init)) return true
   return init?.type === 'Literal' && typeof init.value === 'boolean'
}

function is_boolean_binding({
   id,
   init,
   type_services,
}: {
   id: TSESTree.Identifier
   init: TSESTree.Node | null
   type_services: TypeServices | null
}): boolean {
   if (type_services) {
      const type = get_node_type({ node: id, type_services })
      if (
         type &&
         (is_boolean_like(type) ||
            is_boolean_ref_checker_type({
               checker: type_services.checker,
               type,
            }))
      ) {
         return true
      }
   }
   return is_ast_boolean_binding({ id, init })
}

const rule: KaezonRule<'missingIsPrefix'> = {
   create(context) {
      const type_services = get_parser_type_services(context)

      function check_identifier({
         id,
         init,
      }: {
         id: TSESTree.Parameter | TSESTree.BindingName
         init: TSESTree.Node | null
      }): void {
         if (id.type !== 'Identifier') return
         if (!is_boolean_binding({ id, init, type_services })) return
         if (id.name.startsWith('is_')) return

         context.report({
            data: { name: id.name },
            messageId: 'missingIsPrefix',
            node: id,
         })
      }

      function visit_variable_declarator(
         node: TSESTree.VariableDeclarator,
      ): void {
         check_identifier({ id: node.id, init: node.init })
      }

      function visit_function(
         node:
            | TSESTree.ArrowFunctionExpression
            | TSESTree.FunctionDeclaration
            | TSESTree.FunctionExpression,
      ): void {
         for (const param of node.params) {
            check_identifier({ id: param, init: null })
         }
      }

      return {
         ArrowFunctionExpression: visit_function,
         FunctionDeclaration: visit_function,
         FunctionExpression: visit_function,
         VariableDeclarator: visit_variable_declarator,
      }
   },
   meta: {
      docs: {
         description:
            'Require is_ prefix for boolean and Vue boolean-ref bindings',
      },
      messages: {
         missingIsPrefix:
            "Boolean '{{name}}' should use an is_ prefix that reads naturally in English (e.g. is_{{name}}); do not add is_ only to satisfy the rule.",
      },
      schema: [],
      type: 'suggestion',
   },
}

export default rule

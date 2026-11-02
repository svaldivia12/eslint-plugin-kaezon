import type { KaezonRule, TSESTree } from '../types.ts'

const UPPER_CASE_REGEX = /^[A-Z][A-Z0-9_]*$/
const SPECIAL_CHAR_REGEX = /^[$_]$/

function has_as_const(init: TSESTree.Node | null): boolean {
   if (!init) return false

   let expr = init
   if (expr.type === 'TSSatisfiesExpression') expr = expr.expression
   if (expr.type !== 'TSAsExpression') return false

   const type_ref = expr.typeAnnotation
   return (
      type_ref?.type === 'TSTypeReference' &&
      type_ref.typeName.type === 'Identifier' &&
      type_ref.typeName.name === 'const'
   )
}

function is_literal(init: TSESTree.Node | null): boolean {
   return (
      init?.type === 'Literal' ||
      (init?.type === 'UnaryExpression' &&
         init.operator === '-' &&
         init.argument.type === 'Literal')
   )
}

function is_require_call(init: TSESTree.Node | null): boolean {
   return (
      init?.type === 'CallExpression' &&
      init.callee.type === 'Identifier' &&
      init.callee.name === 'require'
   )
}

function is_special_name(name: string): boolean {
   return SPECIAL_CHAR_REGEX.test(name)
}

interface DeclarationShape {
   init: TSESTree.Node | null
   kind: TSESTree.VariableDeclaration['kind']
   name: string
}

function should_require_lower_case({
   init,
   kind,
   name,
}: DeclarationShape): boolean {
   if (
      !UPPER_CASE_REGEX.test(name) ||
      is_require_call(init) ||
      has_as_const(init)
   ) {
      return false
   }

   return kind === 'let' || (kind === 'const' && !is_literal(init))
}

function should_require_upper_case({
   init,
   kind,
   name,
}: DeclarationShape): boolean {
   return (
      kind === 'const' &&
      !UPPER_CASE_REGEX.test(name) &&
      (is_literal(init) || has_as_const(init))
   )
}

const rule: KaezonRule<'lowerCase' | 'upperCase'> = {
   create(context) {
      function report_lower_case(node: TSESTree.Node): void {
         context.report({
            messageId: 'lowerCase',
            node,
         })
      }

      function report_upper_case(node: TSESTree.Node): void {
         context.report({
            messageId: 'upperCase',
            node,
         })
      }

      function visit_variable_declaration(
         node: TSESTree.VariableDeclaration,
      ): void {
         for (const declaration of node.declarations) {
            if (declaration.id.type !== 'Identifier') continue

            const shape: DeclarationShape = {
               init: declaration.init,
               kind: node.kind,
               name: declaration.id.name,
            }

            if (is_special_name(shape.name)) continue

            if (should_require_upper_case(shape)) {
               report_upper_case(declaration.id)
            }

            if (should_require_lower_case(shape)) {
               report_lower_case(declaration.id)
            }
         }
      }

      return {
         VariableDeclaration: visit_variable_declaration,
      }
   },
   meta: {
      docs: {
         description:
            'Require UPPER_CASE for literal and "as const" declarations, and lower case for mutable or computed bindings',
      },
      messages: {
         lowerCase: 'const/let should be in lower case.',
         upperCase: 'const should be in upper case.',
      },
      schema: [],
      type: 'suggestion',
   },
}

export default rule

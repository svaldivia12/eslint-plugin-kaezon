const UPPER_CASE_REGEX = /^[A-Z][A-Z0-9_]*$/
const SPECIAL_CHAR_REGEX = /^[$_]$/

function hasAsConst(init) {
   if (!init) return false

   let expr = init
   if (expr.type === 'TSSatisfiesExpression') expr = expr.expression
   if (expr.type !== 'TSAsExpression') return false

   const type_ref = expr.typeAnnotation
   return (
      type_ref?.type === 'TSTypeReference' &&
      type_ref.typeName?.name === 'const'
   )
}

function isLiteral(init) {
   return (
      init?.type === 'Literal' ||
      (init?.type === 'UnaryExpression' &&
         init.operator === '-' &&
         init.argument.type === 'Literal')
   )
}

function isRequireCall(init) {
   return (
      init?.type === 'CallExpression' &&
      init.callee?.type === 'Identifier' &&
      init.callee.name === 'require'
   )
}

function isSpecialName(name) {
   return SPECIAL_CHAR_REGEX.test(name)
}

function shouldRequireLowerCase(kind, name, init) {
   if (
      !UPPER_CASE_REGEX.test(name) ||
      isRequireCall(init) ||
      hasAsConst(init)
   ) {
      return false
   }

   return kind === 'let' || (kind === 'const' && !isLiteral(init))
}

function shouldRequireUpperCase(kind, name, init) {
   return (
      kind === 'const' &&
      !UPPER_CASE_REGEX.test(name) &&
      (isLiteral(init) || hasAsConst(init))
   )
}

export default {
   create(context) {
      function reportLowerCase(node) {
         context.report({
            messageId: 'lowerCase',
            node,
         })
      }

      function reportUpperCase(node) {
         context.report({
            messageId: 'upperCase',
            node,
         })
      }

      function visitVariableDeclaration(node) {
         for (const declaration of node.declarations) {
            if (declaration.id?.type !== 'Identifier') continue

            const { init } = declaration
            const { kind } = node
            const { name } = declaration.id

            if (isSpecialName(name)) continue

            if (shouldRequireUpperCase(kind, name, init)) {
               reportUpperCase(declaration.id)
            }

            if (shouldRequireLowerCase(kind, name, init)) {
               reportLowerCase(declaration.id)
            }
         }
      }

      return {
         VariableDeclaration: visitVariableDeclaration,
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

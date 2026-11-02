import type { KaezonRule, TSESLint, TSESTree } from '../types.ts'

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

/**
 * Trims leading and trailing underscores without a regex. An alternation like
 * /^_+|_+$/g backtracks from every position on a long run of underscores, so a
 * scan is both linear and easier to reason about.
 */
function trim_underscores(name: string): string {
   let start = 0
   let end = name.length

   while (start < end && name[start] === '_') start += 1
   while (end > start && name[end - 1] === '_') end -= 1

   return name.slice(start, end)
}

function to_upper_case(name: string): string {
   return trim_underscores(
      name
         .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
         .replace(/[^A-Za-z0-9]+/g, '_')
         .toUpperCase(),
   )
}

function to_lower_case(name: string): string {
   return trim_underscores(
      name
         .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
         .replace(/[^A-Za-z0-9]+/g, '_')
         .toLowerCase(),
   )
}

/**
 * An exported binding can be imported elsewhere, so renaming it automatically
 * would break call sites we cannot see. Those get a suggestion instead of a fix.
 */
function is_exported(declaration: TSESTree.VariableDeclaration): boolean {
   const { parent } = declaration
   return (
      parent?.type === 'ExportNamedDeclaration' ||
      parent?.type === 'ExportDefaultDeclaration'
   )
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

const rule: KaezonRule<'lowerCase' | 'renameTo' | 'upperCase'> = {
   create(context) {
      const source_code = context.sourceCode

      function build_rename({
         declaration,
         identifier,
         next_name,
      }: {
         declaration: TSESTree.VariableDeclaration
         identifier: TSESTree.Identifier
         next_name: string
      }): ((fixer: TSESLint.RuleFixer) => TSESLint.RuleFix[]) | null {
         if (is_exported(declaration)) return null

         const variable = source_code
            .getDeclaredVariables(declaration)
            .find(candidate => candidate.name === identifier.name)
         if (!variable) return null

         // Rename every occurrence in the file: the declaration plus all reads.
         // `identifiers` and `references` can share a node, so dedupe by range.
         const seen = new Set<string>()
         const targets: TSESTree.Identifier[] = []

         const candidates: readonly { range: [number, number] }[] = [
            ...variable.identifiers,
            ...variable.references.map(reference => reference.identifier),
         ]

         for (const candidate of candidates) {
            const key = `${candidate.range[0]}:${candidate.range[1]}`
            if (seen.has(key)) continue
            seen.add(key)
            targets.push(candidate as TSESTree.Identifier)
         }

         if (targets.length === 0) return null

         return fixer =>
            targets.map(target => fixer.replaceText(target, next_name))
      }

      function report_lower_case({
         declaration,
         identifier,
      }: {
         declaration: TSESTree.VariableDeclaration
         identifier: TSESTree.Identifier
      }): void {
         const next_name = to_lower_case(identifier.name)
         if (!next_name || next_name === identifier.name) return

         const fix = build_rename({ declaration, identifier, next_name })
         const descriptor = {
            data: { name: identifier.name, next: next_name },
            messageId: 'lowerCase' as const,
            node: identifier,
         }

         context.report(
            fix
               ? { ...descriptor, fix }
               : {
                    ...descriptor,
                    suggest: [
                       {
                          data: descriptor.data,
                          fix: fixer => fixer.replaceText(identifier, next_name),
                          messageId: 'renameTo' as const,
                       },
                    ],
                 },
         )
      }

      function report_upper_case({
         declaration,
         identifier,
      }: {
         declaration: TSESTree.VariableDeclaration
         identifier: TSESTree.Identifier
      }): void {
         const next_name = to_upper_case(identifier.name)
         if (!next_name || next_name === identifier.name) return

         const fix = build_rename({ declaration, identifier, next_name })
         const descriptor = {
            data: { name: identifier.name, next: next_name },
            messageId: 'upperCase' as const,
            node: identifier,
         }

         context.report(
            fix
               ? { ...descriptor, fix }
               : {
                    ...descriptor,
                    suggest: [
                       {
                          data: descriptor.data,
                          fix: fixer => fixer.replaceText(identifier, next_name),
                          messageId: 'renameTo' as const,
                       },
                    ],
                 },
         )
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
               report_upper_case({ declaration: node, identifier: declaration.id })
            }

            if (should_require_lower_case(shape)) {
               report_lower_case({ declaration: node, identifier: declaration.id })
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
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezonconst-case',
      },
      fixable: 'code',
      hasSuggestions: true,
      messages: {
         lowerCase: 'const/let "{{name}}" should be in lower case, not UPPER_CASE.',
         renameTo: 'Rename to "{{next}}".',
         upperCase: 'const "{{name}}" should be in UPPER_CASE.',
      },
      schema: [],
      type: 'suggestion',
   },
}

export default rule

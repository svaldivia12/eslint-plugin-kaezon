import type { KaezonRule, KaezonRuleContext, TSESTree } from '../types.ts'

/**
 * Report when a TypeScript or Vue file is not parsed with a TypeScript-capable
 * parser (and vue-eslint-parser for .vue). Prevents kaezon rules from failing
 * silently. Does not require type-aware linting (parserOptions.project).
 */

const ts_extensions = new Set(['.cts', '.mts', '.ts', '.tsx'])

const VUE_PARSER_HINT = 'vue-eslint-parser'

interface ParserLike {
   meta?: { name?: string }
   parse?: unknown
   parseForESLint?: unknown
   parser?: unknown
   ts?: unknown
}

function get_filename(context: KaezonRuleContext): string {
   return context.filename ?? ''
}

function get_extension(filename: string): string {
   const path_part = filename.split('?')[0] ?? ''
   const dot = path_part.lastIndexOf('.')
   if (dot === -1) return ''
   return path_part.slice(dot).toLowerCase()
}

function get_parser_name(parser: unknown): string {
   if (!parser) return ''
   if (typeof parser === 'string') return parser
   if (typeof parser === 'object' && parser !== null) {
      const { meta } = parser as ParserLike
      return meta?.name ?? ''
   }
   return ''
}

function is_typescript_parser_name(name: string): boolean {
   if (!name) return false
   return (
      name === '@typescript-eslint/parser' || name.includes('typescript-eslint')
   )
}

function is_vue_parser_name(name: string): boolean {
   if (!name) return false
   return name === VUE_PARSER_HINT || name.includes(VUE_PARSER_HINT)
}

function get_parser_services(
   context: KaezonRuleContext,
): Record<string, unknown> {
   return (context.sourceCode?.parserServices ?? {}) as Record<string, unknown>
}

function has_ts_parser_services(
   context: KaezonRuleContext,
): boolean {
   return Boolean(get_parser_services(context).esTreeNodeToTSNodeMap)
}

function is_vue_parser(context: KaezonRuleContext): boolean {
   const parser_name = get_parser_name(context.languageOptions?.parser)
   if (is_vue_parser_name(parser_name)) return true
   return typeof get_parser_services(context).defineTemplateBodyVisitor === 'function'
}

function parser_option_has_typescript(parser_option: unknown): boolean {
   if (!parser_option) return false
   if (typeof parser_option === 'string') {
      return is_typescript_parser_name(parser_option)
   }
   if (typeof parser_option !== 'object') return false

   const option = parser_option as ParserLike

   if (
      option.meta ||
      typeof option.parse === 'function' ||
      typeof option.parseForESLint === 'function'
   ) {
      return is_typescript_parser_name(get_parser_name(parser_option))
   }

   if (option.ts) {
      return parser_option_has_typescript(option.ts)
   }

   return Object.values(parser_option).some(value =>
      parser_option_has_typescript(value),
   )
}

function has_typescript_parser(
   context: KaezonRuleContext,
): boolean {
   if (has_ts_parser_services(context)) return true

   const language_options = context.languageOptions ?? {}
   if (is_typescript_parser_name(get_parser_name(language_options.parser))) {
      return true
   }

   return parser_option_has_typescript(
      (language_options.parserOptions as ParserLike | undefined)?.parser,
   )
}

const rule: KaezonRule<
   'missing_ts_parser' | 'missing_vue_parser' | 'missing_vue_ts_parser'
> = {
   create(context) {
      function visit_program(node: TSESTree.Program): void {
         const extension = get_extension(get_filename(context))

         if (extension === '.vue') {
            if (!is_vue_parser(context)) {
               context.report({ messageId: 'missing_vue_parser', node })
               return
            }
            if (!has_typescript_parser(context)) {
               context.report({ messageId: 'missing_vue_ts_parser', node })
            }
            return
         }

         if (!ts_extensions.has(extension)) return

         if (!has_typescript_parser(context)) {
            context.report({ messageId: 'missing_ts_parser', node })
         }
      }

      return {
         Program: visit_program,
      }
   },
   meta: {
      docs: {
         description:
            'Require a TypeScript parser for TS files, and vue-eslint-parser with a TypeScript parser for Vue files',
         url: 'https://github.com/svaldivia12/eslint-plugin-kaezon#kaezonrequire-typescript-parser',
      },
      messages: {
         missing_ts_parser:
            'This TypeScript file is not using a TypeScript parser (for example @typescript-eslint/parser). kaezon rules that inspect TypeScript AST nodes will not run. This plugin does not ship a parser.',
         missing_vue_parser:
            'This Vue file is not using vue-eslint-parser. Set languageOptions.parser to vue-eslint-parser with a TypeScript parser for <script>. kaezon Vue rules will not run correctly. This plugin does not ship a parser.',
         missing_vue_ts_parser:
            'vue-eslint-parser is in use, but <script> is not parsed as TypeScript (for example @typescript-eslint/parser). kaezon rules that inspect TypeScript AST nodes will not run. This plugin does not ship a parser.',
      },
      schema: [],
      type: 'problem',
   },
}

export default rule

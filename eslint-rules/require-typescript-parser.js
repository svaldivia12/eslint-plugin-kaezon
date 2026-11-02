/**
 * Report when a TypeScript or Vue file is not parsed with a TypeScript-capable
 * parser (and vue-eslint-parser for .vue). Prevents kaezon rules from failing
 * silently. Does not require type-aware linting (parserOptions.project).
 */

const ts_extensions = new Set(['.cts', '.mts', '.ts', '.tsx'])

function get_filename(context) {
   return context.filename ?? context.getFilename?.() ?? ''
}

function get_extension(filename) {
   const path_part = String(filename).split('?')[0]
   const dot = path_part.lastIndexOf('.')
   if (dot === -1) return ''
   return path_part.slice(dot).toLowerCase()
}

function get_parser_name(parser) {
   if (!parser) return ''
   if (typeof parser === 'string') return parser
   return parser.meta?.name ?? ''
}

function is_typescript_parser_name(name) {
   if (!name) return false
   return name === '@typescript-eslint/parser' || name.includes('typescript-eslint')
}

function is_vue_parser_name(name) {
   if (!name) return false
   return name === 'vue-eslint-parser' || name.includes('vue-eslint-parser')
}

function get_parser_services(context) {
   return context.sourceCode?.parserServices ?? context.parserServices ?? {}
}

function has_ts_parser_services(context) {
   return Boolean(get_parser_services(context).esTreeNodeToTSNodeMap)
}

function is_vue_parser(context) {
   const parser_name = get_parser_name(context.languageOptions?.parser)
   if (is_vue_parser_name(parser_name)) return true
   return typeof get_parser_services(context).defineTemplateBodyVisitor === 'function'
}

function parser_option_has_typescript(parser_option) {
   if (!parser_option) return false
   if (typeof parser_option === 'string') {
      return is_typescript_parser_name(parser_option)
   }
   if (typeof parser_option !== 'object') return false

   if (
      parser_option.meta ||
      typeof parser_option.parse === 'function' ||
      typeof parser_option.parseForESLint === 'function'
   ) {
      return is_typescript_parser_name(get_parser_name(parser_option))
   }

   if (parser_option.ts) {
      return parser_option_has_typescript(parser_option.ts)
   }

   return Object.values(parser_option).some(value =>
      parser_option_has_typescript(value),
   )
}

function has_typescript_parser(context) {
   if (has_ts_parser_services(context)) return true

   const language_options = context.languageOptions ?? {}
   if (is_typescript_parser_name(get_parser_name(language_options.parser))) {
      return true
   }

   return parser_option_has_typescript(language_options.parserOptions?.parser)
}

export default {
   create(context) {
      function visit_program(node) {
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

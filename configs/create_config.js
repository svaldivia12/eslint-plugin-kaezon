import rules_module from '../eslint-rules/index.js'

const PLUGIN_PREFIX = 'kaezon/'

export const DEFAULT_FILES = [
   '**/*.ts',
   '**/*.tsx',
   '**/*.mts',
   '**/*.cts',
   '**/*.vue',
]

export const TS_RULES = [
   'const-case',
   'prefer-object-params',
   'require-satisfies-with-as-const',
]

export const VUE_RULES = [
   'computed-explicit-return-type',
   'vue-prop-name-casing-by-type',
]

export const PARSER_RULES = ['require-typescript-parser']

export const NUXT_HOUSE_RULES = {
   '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowTypedFunctionExpressions: false },
   ],
   '@typescript-eslint/naming-convention': [
      'error',
      {
         format: ['camelCase'],
         selector: ['variable', 'parameter'],
         types: ['function'],
      },
      {
         format: ['snake_case', 'UPPER_CASE'],
         modifiers: ['const'],
         selector: 'variable',
      },
      {
         format: ['snake_case'],
         selector: ['variable', 'parameter'],
      },
      {
         format: ['snake_case'],
         prefix: ['is_'],
         selector: ['variable', 'parameter'],
         types: ['boolean'],
      },
      {
         format: ['snake_case'],
         selector: 'typeProperty',
      },
   ],
   curly: ['error', 'multi'],
   'no-restricted-syntax': [
      'error',
      {
         message: 'Use props (callbacks) instead of defineEmits.',
         selector: "CallExpression[callee.name='defineEmits']",
      },
   ],
   'vue/prop-name-casing': 'off',
}

const VALID_SHORT_NAMES = Object.keys(rules_module.rules)

const VALID_SHORT_NAME_SET = new Set(VALID_SHORT_NAMES)

const PRESET_RULES = {
   none: [],
   nuxt: [...PARSER_RULES, ...TS_RULES, ...VUE_RULES],
   ts: [...PARSER_RULES, ...TS_RULES],
   vue: [...PARSER_RULES, ...VUE_RULES],
}

const PRESET_CONFIG_NAMES = {
   none: 'kaezon/custom',
   nuxt: 'kaezon/nuxt',
   ts: 'kaezon/ts',
   vue: 'kaezon/vue',
}

function to_error_rules(short_names) {
   const rules = {}
   for (const short_name of short_names) {
      rules[`${PLUGIN_PREFIX}${short_name}`] = 'error'
   }
   return rules
}

function to_overlay_rule_id(key) {
   if (key.startsWith(PLUGIN_PREFIX)) {
      const short_name = key.slice(PLUGIN_PREFIX.length)

      if (!VALID_SHORT_NAME_SET.has(short_name)) {
         throw new Error(
            `Unknown kaezon rule "${key}". Valid names: ${VALID_SHORT_NAMES.join(', ')}`,
         )
      }

      return key
   }

   if (VALID_SHORT_NAME_SET.has(key)) {
      return `${PLUGIN_PREFIX}${key}`
   }

   return key
}

function overlay_rules(base_rules, overlay) {
   const rules = { ...base_rules }

   for (const [key, value] of Object.entries(overlay)) {
      rules[to_overlay_rule_id(key)] = value
   }

   return rules
}

export function create_config(plugin, options = {}) {
   const preset = options.preset ?? 'nuxt'

   if (!(preset in PRESET_RULES)) {
      throw new Error(
         `Unknown preset "${preset}". Valid presets: nuxt, none, ts, vue`,
      )
   }

   const files = options.files === undefined ? DEFAULT_FILES : options.files
   const overlay = options.rules ?? {}

   return {
      files,
      name: PRESET_CONFIG_NAMES[preset],
      plugins: { kaezon: plugin },
      rules: overlay_rules(
         {
            ...to_error_rules(PRESET_RULES[preset]),
            ...(preset === 'nuxt' ? NUXT_HOUSE_RULES : {}),
         },
         overlay,
      ),
   }
}

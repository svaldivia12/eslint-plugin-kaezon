import { createRequire } from 'node:module'
import rules_module from '../eslint-rules/index.js'

const PLUGIN_PREFIX = 'kaezon/'

const require_module = createRequire(import.meta.url)

export const default_files = [
   '**/*.ts',
   '**/*.tsx',
   '**/*.mts',
   '**/*.cts',
   '**/*.vue',
]

export const ts_rules = [
   'const-case',
   'prefer-object-params',
   'require-satisfies-with-as-const',
]

export const vue_rules = [
   'boolean-is-prefix',
   'computed-explicit-return-type',
   'vue-prop-name-casing-by-type',
]

export const parser_rules = ['require-typescript-parser']

/**
 * House style for the nuxt_house preset. These rules belong to third-party
 * plugins (eslint-plugin-vue, @typescript-eslint/eslint-plugin), so the preset
 * only works when the consuming project installs them.
 */
export const nuxt_house_rules = {
   '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowTypedFunctionExpressions: false },
   ],
   '@typescript-eslint/naming-convention': [
      'error',
      {
         format: ['camelCase'],
         selector: 'function',
      },
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
         format: ['camelCase'],
         selector: 'typeProperty',
         types: ['function'],
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

const peer_plugins = {
   '@typescript-eslint': '@typescript-eslint/eslint-plugin',
   vue: 'eslint-plugin-vue',
}

const valid_short_names = Object.keys(rules_module.rules)

const valid_short_name_set = new Set(valid_short_names)

const preset_rules = {
   none: [],
   nuxt: [...parser_rules, ...ts_rules, ...vue_rules],
   nuxt_house: [...parser_rules, ...ts_rules, ...vue_rules],
   ts: [...parser_rules, ...ts_rules],
   vue: [...parser_rules, ...vue_rules],
}

const preset_config_names = {
   none: 'kaezon/custom',
   nuxt: 'kaezon/nuxt',
   nuxt_house: 'kaezon/nuxt_house',
   ts: 'kaezon/ts',
   vue: 'kaezon/vue',
}

const preset_names = Object.keys(preset_rules)

function load_peer_plugins() {
   const plugins = {}
   const missing = []

   for (const [plugin_id, package_name] of Object.entries(peer_plugins)) {
      try {
         plugins[plugin_id] = require_module(package_name)
      } catch {
         missing.push(package_name)
      }
   }

   if (missing.length > 0) {
      throw new Error(
         `The "nuxt_house" preset needs these plugins installed in your project: ${missing.join(', ')}. ` +
            'Add them as devDependencies, or use the "nuxt" preset for the kaezon rules alone. ' +
            'This plugin does not ship third-party rules.',
      )
   }

   return plugins
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

      if (!valid_short_name_set.has(short_name)) {
         throw new Error(
            `Unknown kaezon rule "${key}". Valid names: ${valid_short_names.join(', ')}`,
         )
      }

      return key
   }

   if (valid_short_name_set.has(key)) {
      return `${PLUGIN_PREFIX}${key}`
   }

   return key
}

function overlay_rules({ base_rules, overlay }) {
   const rules = { ...base_rules }

   for (const [key, value] of Object.entries(overlay)) {
      rules[to_overlay_rule_id(key)] = value
   }

   return rules
}

function resolve_preset(preset) {
   if (!Object.hasOwn(preset_rules, preset)) {
      throw new Error(
         `Unknown preset "${preset}". Valid presets: ${preset_names.join(', ')}`,
      )
   }

   return preset
}

export function create_config({ options = {}, plugin }) {
   const preset = resolve_preset(options.preset ?? 'nuxt')
   const files = options.files === undefined ? default_files : options.files
   const overlay = options.rules ?? {}
   const is_house = preset === 'nuxt_house'

   return {
      files,
      name: preset_config_names[preset],
      plugins: is_house
         ? { ...load_peer_plugins(), kaezon: plugin }
         : { kaezon: plugin },
      rules: overlay_rules({
         base_rules: {
            ...to_error_rules(preset_rules[preset]),
            ...(is_house ? nuxt_house_rules : {}),
         },
         overlay,
      }),
   }
}

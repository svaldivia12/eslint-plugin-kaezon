import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { create_config } from './configs/create_config.ts'
import { create_nuxt_config } from './configs/nuxt.ts'
import { create_nuxt_house_config } from './configs/nuxt_house.ts'
import { create_ts_config } from './configs/ts.ts'
import { create_vue_config } from './configs/vue.ts'
import rules_module from './eslint-rules/index.ts'
import { to_plugin_rules } from './types.ts'
import type { CreateConfigOptions, KaezonPlugin } from './types.ts'

/**
 * Resolved relative to this module so it works both from the sources (repo
 * root) and from the built output (dist/), whose parent is the package root.
 * Importing `./package.json` would make tsc copy it into dist/, where its
 * "exports" field is inert and publint flags it as a nested package.
 */
function read_version(): string {
   const package_path = fileURLToPath(new URL('./package.json', import.meta.url))
   const candidates = [package_path, fileURLToPath(new URL('../package.json', import.meta.url))]

   for (const candidate of candidates) {
      try {
         const parsed: unknown = JSON.parse(readFileSync(candidate, 'utf8'))
         if (
            typeof parsed === 'object' &&
            parsed !== null &&
            typeof (parsed as { version?: unknown }).version === 'string'
         ) {
            return (parsed as { version: string }).version
         }
      } catch {
         continue
      }
   }

   throw new Error('eslint-plugin-kaezon: cannot read the package version')
}

const plugin: KaezonPlugin = {
   configs: {} as KaezonPlugin['configs'],
   createConfig(options?: CreateConfigOptions) {
      return create_config({ options, plugin })
   },
   meta: {
      name: 'eslint-plugin-kaezon',
      version: read_version(),
   },
   rules: to_plugin_rules(rules_module.rules),
}

plugin.configs.nuxt = create_nuxt_config(plugin)
plugin.configs.ts = create_ts_config(plugin)
plugin.configs.vue = create_vue_config(plugin)

/**
 * Lazily built: the nuxt_house preset needs eslint-plugin-vue and
 * @typescript-eslint/eslint-plugin, and the error should surface when the
 * consumer reads the preset, not when importing the plugin.
 */
Object.defineProperty(plugin.configs, 'nuxt_house', {
   configurable: true,
   enumerable: true,
   get(): KaezonPlugin['configs']['nuxt_house'] {
      const config = create_nuxt_house_config(plugin)
      Object.defineProperty(plugin.configs, 'nuxt_house', {
         configurable: true,
         enumerable: true,
         value: config,
         writable: false,
      })
      return config
   },
})

export default plugin

export type {
   CreateConfigOptions,
   FlatConfig,
   KaezonPlugin,
   KaezonRule,
   KaezonRuleContext,
   KaezonRuleMap,
   PresetName,
   RuleConfig,
   RuleSeverity,
} from './types.ts'

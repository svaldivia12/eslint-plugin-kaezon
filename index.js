import package_json from './package.json' with { type: 'json' }
import { create_config } from './configs/create_config.js'
import { create_nuxt_config } from './configs/nuxt.js'
import { create_nuxt_house_config } from './configs/nuxt_house.js'
import { create_ts_config } from './configs/ts.js'
import { create_vue_config } from './configs/vue.js'
import rules_module from './eslint-rules/index.js'

const plugin = {
   configs: {},
   createConfig(options) {
      return create_config({ options, plugin })
   },
   meta: {
      name: 'eslint-plugin-kaezon',
      version: package_json.version,
   },
   rules: rules_module.rules,
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
   get() {
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

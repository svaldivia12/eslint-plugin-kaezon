import package_json from './package.json' with { type: 'json' }
import { create_config } from './configs/create_config.js'
import { create_nuxt_config } from './configs/nuxt.js'
import { create_ts_config } from './configs/ts.js'
import { create_vue_config } from './configs/vue.js'
import rules_module from './eslint-rules/index.js'

const plugin = {
   configs: {},
   createConfig(options) {
      return create_config(plugin, options)
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

export default plugin

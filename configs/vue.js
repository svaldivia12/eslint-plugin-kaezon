import { create_config } from './create_config.js'

export function create_vue_config(plugin) {
   return create_config({ options: { preset: 'vue' }, plugin })
}

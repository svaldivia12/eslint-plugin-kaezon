import { create_config } from './create_config.js'

export function create_nuxt_house_config(plugin) {
   return create_config({ options: { preset: 'nuxt_house' }, plugin })
}

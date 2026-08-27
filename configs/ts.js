import { create_config } from './create_config.js'

export function create_ts_config(plugin) {
   return create_config(plugin, { preset: 'ts' })
}

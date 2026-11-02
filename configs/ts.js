import { create_config } from './create_config.js'

export function create_ts_config(plugin) {
   return create_config({ options: { preset: 'ts' }, plugin })
}

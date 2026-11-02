import { create_config } from './create_config.ts'
import type { FlatConfig, KaezonPlugin } from '../types.ts'

export function create_ts_config(plugin: KaezonPlugin): FlatConfig {
   return create_config({ options: { preset: 'ts' }, plugin })
}

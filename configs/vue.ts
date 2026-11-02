import { create_config } from './create_config.ts'
import type { FlatConfig, KaezonPlugin } from '../types.ts'

export function create_vue_config(plugin: KaezonPlugin): FlatConfig {
   return create_config({ options: { preset: 'vue' }, plugin })
}

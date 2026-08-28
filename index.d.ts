import type { ESLint, Linter } from 'eslint'

export type FlatConfig = Linter.Config

export type PresetName = 'none' | 'nuxt' | 'ts' | 'vue'

export type RuleSeverity = 'off' | 'warn' | 'error' | 0 | 1 | 2

export type RuleConfig = RuleSeverity | [RuleSeverity, ...unknown[]]

export interface CreateConfigOptions {
   files?: string[]
   preset?: PresetName
   /** Overlay keys may be kaezon short names, `kaezon/...` ids, or other ESLint rule ids. */
   rules?: Record<string, RuleConfig>
}

export interface KaezonPlugin {
   configs: {
      nuxt: FlatConfig
      ts: FlatConfig
      vue: FlatConfig
   }
   createConfig(options?: CreateConfigOptions): FlatConfig
   meta: {
      name: string
      version: string
   }
   rules: ESLint.Plugin['rules']
}

declare const kaezon_plugin: KaezonPlugin

export default kaezon_plugin

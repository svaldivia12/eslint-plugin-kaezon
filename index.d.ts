import type { ESLint, Linter } from 'eslint'

export type FlatConfig = Linter.Config

export type PresetName = 'all' | 'none' | 'ts' | 'vue'

export type RuleSeverity = 'off' | 'warn' | 'error' | 0 | 1 | 2

export type RuleConfig = RuleSeverity | [RuleSeverity, ...unknown[]]

export interface CreateConfigOptions {
   files?: string[]
   preset?: PresetName
   rules?: Record<string, RuleConfig>
}

export interface KaezonPlugin {
   configs: {
      all: FlatConfig
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

import type { ESLint, Linter } from 'eslint'

export type FlatConfig = Linter.Config

export type PresetName = 'none' | 'nuxt' | 'nuxt_house' | 'ts' | 'vue'

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
      /**
       * Custom kaezon rules only. Works with just ESLint installed.
       */
      nuxt: FlatConfig
      /**
       * `nuxt` plus the house style built on `eslint-plugin-vue` and
       * `@typescript-eslint/eslint-plugin`. Reading it throws when those
       * plugins are not installed in the consuming project.
       */
      nuxt_house: FlatConfig
      ts: FlatConfig
      vue: FlatConfig
   }
   createConfig(options?: CreateConfigOptions): FlatConfig
   meta: {
      name: string
      version: string
   }
   rules: NonNullable<ESLint.Plugin['rules']>
}

declare const kaezon_plugin: KaezonPlugin

export default kaezon_plugin

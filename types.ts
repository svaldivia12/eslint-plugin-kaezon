import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
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

/**
 * A kaezon rule. Typed with TSESLint so every visitor receives its concrete
 * TSESTree node and `report` only accepts `messageId`s declared in
 * `meta.messages`.
 */
export type KaezonRule<MessageIds extends string = string> = TSESLint.RuleModule<
   MessageIds,
   readonly []
>

export type KaezonRuleMap = Record<string, KaezonRule>

/** The context object a kaezon rule receives in `create`. */
export type KaezonRuleContext = Parameters<KaezonRule['create']>[0]

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

/**
 * TSESLint and ESLint ship structurally different `RuleContext` types for the
 * same runtime contract, so a TSESLint rule is not assignable to the ESLint
 * plugin surface without an explicit boundary cast. Keep the cast here and
 * nowhere else so the rest of the codebase stays fully typed.
 */
export function to_plugin_rules(rules: KaezonRuleMap): KaezonPlugin['rules'] {
   return rules as unknown as KaezonPlugin['rules']
}

export type { TSESLint, TSESTree }

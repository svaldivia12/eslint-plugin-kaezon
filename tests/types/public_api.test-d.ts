/**
 * Compile-time checks for the published type surface. `pnpm typecheck` builds
 * this file with `strict` on; nothing here runs at test time.
 */
import assert from 'node:assert/strict'
import type { Linter } from 'eslint'
import kaezon from '../../index.js'
import type {
   CreateConfigOptions,
   FlatConfig,
   KaezonPlugin,
   PresetName,
   RuleConfig,
} from '../../index.js'

const plugin: KaezonPlugin = kaezon

const presets: PresetName[] = ['none', 'nuxt', 'nuxt_house', 'ts', 'vue']

const configs: FlatConfig[] = [
   plugin.configs.nuxt,
   plugin.configs.nuxt_house,
   plugin.configs.ts,
   plugin.configs.vue,
]

const severity: RuleConfig = ['error', { some: 'option' }]

const options: CreateConfigOptions = {
   files: ['**/*.ts'],
   preset: 'ts',
   rules: { 'const-case': severity, 'kaezon/prefer-object-params': 'off' },
}

const built: FlatConfig = plugin.createConfig(options)

const config_array: Linter.Config[] = [built, ...configs]

/** `rules` must be non-optional so consumers can enumerate rule ids. */
const rule_names: string[] = Object.keys(plugin.rules)

/** `meta` must be fully typed, not optional. */
const version: string = plugin.meta.version

assert.equal(typeof version, 'string')
assert.ok(config_array.length >= 5)
assert.ok(rule_names.length > 0)
assert.ok(presets.includes('nuxt_house'))

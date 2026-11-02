import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import kaezon from '../index.ts'
import type { FlatConfig, PresetName } from '../index.ts'

/**
 * `Linter.Config` marks `rules` and `plugins` optional. Every preset here sets
 * both, so these accessors assert that once instead of on every line.
 */
function rules_of(config: FlatConfig): Record<string, unknown> {
   assert.ok(config.rules, 'config.rules must be set')
   return config.rules as Record<string, unknown>
}

function plugins_of(config: FlatConfig): Record<string, unknown> {
   assert.ok(config.plugins, 'config.plugins must be set')
   return config.plugins as Record<string, unknown>
}

const custom_nuxt_rules = [
   'kaezon/require-typescript-parser',
   'kaezon/const-case',
   'kaezon/prefer-object-params',
   'kaezon/require-satisfies-with-as-const',
   'kaezon/boolean-is-prefix',
   'kaezon/computed-explicit-return-type',
   'kaezon/vue-prop-name-casing-by-type',
]

const house_rule_ids = [
   '@typescript-eslint/explicit-function-return-type',
   '@typescript-eslint/naming-convention',
   'curly',
   'no-restricted-syntax',
   'vue/prop-name-casing',
]

function assert_nuxt_config(config: FlatConfig): void {
   const rules = rules_of(config)
   const plugins = plugins_of(config)

   assert.equal(config.name, 'kaezon/nuxt')
   assert.equal(plugins.kaezon, kaezon)
   assert.deepEqual(Object.keys(plugins), ['kaezon'])

   for (const rule_id of custom_nuxt_rules) {
      assert.equal(rules[rule_id], 'error')
   }

   for (const rule_id of house_rule_ids) {
      assert.equal(
         rules[rule_id],
         undefined,
         `${rule_id} belongs to nuxt_house, not nuxt`,
      )
   }
}

function assert_nuxt_house_config(config: FlatConfig): void {
   const rules = rules_of(config)
   const plugins = plugins_of(config)

   assert.equal(config.name, 'kaezon/nuxt_house')
   assert.equal(plugins.kaezon, kaezon)
   assert.deepEqual(Object.keys(plugins).sort(), [
      '@typescript-eslint',
      'kaezon',
      'vue',
   ])

   for (const rule_id of custom_nuxt_rules) {
      assert.equal(rules[rule_id], 'error')
   }

   assert.deepEqual(rules.curly, ['error', 'multi'])
   assert.equal(rules['vue/prop-name-casing'], 'off')
   assert.ok(Array.isArray(rules['no-restricted-syntax']))
   assert.equal((rules['no-restricted-syntax'] as unknown[])[0], 'error')
   assert.ok(Array.isArray(rules['@typescript-eslint/naming-convention']))

   const naming = rules['@typescript-eslint/naming-convention'] as unknown[]
   assert.equal(naming[0], 'error')
   assert.deepEqual(naming[1], {
      format: ['camelCase'],
      selector: 'function',
   })
   assert.ok(
      Array.isArray(rules['@typescript-eslint/explicit-function-return-type']),
   )
}

describe('createConfig', () => {
   it('defaults to the nuxt preset', () => {
      assert_nuxt_config(kaezon.createConfig())
   })

   it('exposes the same nuxt config on plugin.configs.nuxt', () => {
      assert_nuxt_config(kaezon.configs.nuxt)
      assert_nuxt_config(kaezon.createConfig({ preset: 'nuxt' }))
   })

   it('builds nuxt_house as a lazy getter', () => {
      const descriptor = Object.getOwnPropertyDescriptor(
         kaezon.configs,
         'nuxt_house',
      )

      assert.ok(descriptor, 'nuxt_house must be defined on configs')
      assert.equal(typeof descriptor.get, 'function')
      assert_nuxt_house_config(kaezon.configs.nuxt_house)
   })

   it('does not put third-party rules in the nuxt preset', () => {
      for (const key of Object.keys(rules_of(kaezon.configs.nuxt))) {
         assert.ok(
            key.startsWith('kaezon/'),
            `unexpected non-kaezon rule in nuxt preset: ${key}`,
         )
      }
   })

   it('enables the diagnostic rule on ts and vue presets', () => {
      const ts_rules = rules_of(kaezon.configs.ts)
      const vue_rules = rules_of(kaezon.configs.vue)

      assert.equal(ts_rules['kaezon/require-typescript-parser'], 'error')
      assert.equal(vue_rules['kaezon/require-typescript-parser'], 'error')
      assert.equal(ts_rules['kaezon/const-case'], 'error')
      assert.equal(vue_rules['kaezon/computed-explicit-return-type'], 'error')
      assert.equal(vue_rules['kaezon/boolean-is-prefix'], 'error')
      assert.equal(ts_rules['kaezon/computed-explicit-return-type'], undefined)
      assert.equal(ts_rules['kaezon/boolean-is-prefix'], undefined)
      assert.equal(vue_rules['kaezon/const-case'], undefined)
      assert.equal(ts_rules.curly, undefined)
      assert.equal(vue_rules.curly, undefined)
      assert.equal(ts_rules['vue/prop-name-casing'], undefined)
      assert.equal(vue_rules['vue/prop-name-casing'], undefined)
      assert.deepEqual(Object.keys(plugins_of(kaezon.configs.ts)), ['kaezon'])
      assert.deepEqual(Object.keys(plugins_of(kaezon.configs.vue)), ['kaezon'])
   })

   it('omits rules for preset none', () => {
      const config = kaezon.createConfig({ preset: 'none' })
      const rules = rules_of(config)

      assert.equal(config.name, 'kaezon/custom')
      assert.deepEqual(rules, {})
      assert.equal(plugins_of(config).kaezon, kaezon)
      assert.equal(rules.curly, undefined)
      assert.equal(rules['vue/prop-name-casing'], undefined)
   })

   it('overlays short and prefixed rule ids', () => {
      const config = kaezon.createConfig({
         preset: 'nuxt',
         rules: {
            'kaezon/const-case': 'warn',
            'prefer-object-params': 'off',
         },
      })
      const rules = rules_of(config)

      assert.equal(rules['kaezon/prefer-object-params'], 'off')
      assert.equal(rules['kaezon/const-case'], 'warn')
      assert.equal(rules['kaezon/require-typescript-parser'], 'error')
   })

   it('copies non-kaezon overlay keys through', () => {
      const config = kaezon.createConfig({
         preset: 'nuxt',
         rules: {
            curly: 'off',
            'vue/prop-name-casing': 'error',
         },
      })
      const rules = rules_of(config)

      assert.equal(rules.curly, 'off')
      assert.equal(rules['vue/prop-name-casing'], 'error')
   })

   it('replaces default files when files is passed', () => {
      const config = kaezon.createConfig({ files: ['**/*.ts'] })
      assert.deepEqual(config.files, ['**/*.ts'])
   })

   it('throws on an unknown preset', () => {
      // Invalid presets are a runtime concern: the type rejects them, so the
      // tests that exercise the error path need an explicit escape hatch.
      const unknown_preset = 'nope' as PresetName
      const removed_preset = 'all' as PresetName

      assert.throws(
         () => kaezon.createConfig({ preset: unknown_preset }),
         /Unknown preset "nope"/,
      )
      assert.throws(
         () => kaezon.createConfig({ preset: removed_preset }),
         /Unknown preset "all"/,
      )
   })

   it('lists the valid presets in the error message', () => {
      const unknown_preset = 'nope' as PresetName

      assert.throws(
         () => kaezon.createConfig({ preset: unknown_preset }),
         /Valid presets: none, nuxt, nuxt_house, ts, vue/,
      )
   })

   it('throws on an unknown kaezon rule name', () => {
      assert.throws(
         () => kaezon.createConfig({ rules: { 'kaezon/not-a-rule': 'off' } }),
         /Unknown kaezon rule "kaezon\/not-a-rule"/,
      )
   })
})

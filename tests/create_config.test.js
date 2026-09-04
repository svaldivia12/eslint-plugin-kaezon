import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import kaezon from '../index.js'

const CUSTOM_NUXT_RULES = [
   'kaezon/require-typescript-parser',
   'kaezon/const-case',
   'kaezon/prefer-object-params',
   'kaezon/require-satisfies-with-as-const',
   'kaezon/computed-explicit-return-type',
   'kaezon/vue-prop-name-casing-by-type',
]

function assert_nuxt_config(config) {
   assert.equal(config.name, 'kaezon/nuxt')
   assert.equal(config.plugins.kaezon, kaezon)
   assert.deepEqual(Object.keys(config.plugins), ['kaezon'])

   for (const rule_id of CUSTOM_NUXT_RULES) {
      assert.equal(config.rules[rule_id], 'error')
   }

   assert.deepEqual(config.rules.curly, ['error', 'multi'])
   assert.equal(config.rules['vue/prop-name-casing'], 'off')
   assert.ok(Array.isArray(config.rules['no-restricted-syntax']))
   assert.equal(config.rules['no-restricted-syntax'][0], 'error')
   assert.ok(Array.isArray(config.rules['@typescript-eslint/naming-convention']))
   assert.equal(config.rules['@typescript-eslint/naming-convention'][0], 'error')
   assert.deepEqual(config.rules['@typescript-eslint/naming-convention'][1], {
      format: ['camelCase'],
      selector: 'function',
   })
   assert.ok(
      Array.isArray(config.rules['@typescript-eslint/explicit-function-return-type']),
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

   it('enables the diagnostic rule on ts and vue presets', () => {
      assert.equal(
         kaezon.configs.ts.rules['kaezon/require-typescript-parser'],
         'error',
      )
      assert.equal(
         kaezon.configs.vue.rules['kaezon/require-typescript-parser'],
         'error',
      )
      assert.equal(kaezon.configs.ts.rules['kaezon/const-case'], 'error')
      assert.equal(
         kaezon.configs.vue.rules['kaezon/computed-explicit-return-type'],
         'error',
      )
      assert.equal(kaezon.configs.ts.rules['kaezon/computed-explicit-return-type'], undefined)
      assert.equal(kaezon.configs.vue.rules['kaezon/const-case'], undefined)
      assert.equal(kaezon.configs.ts.rules.curly, undefined)
      assert.equal(kaezon.configs.vue.rules.curly, undefined)
      assert.equal(kaezon.configs.ts.rules['vue/prop-name-casing'], undefined)
      assert.equal(kaezon.configs.vue.rules['vue/prop-name-casing'], undefined)
      assert.deepEqual(Object.keys(kaezon.configs.ts.plugins), ['kaezon'])
      assert.deepEqual(Object.keys(kaezon.configs.vue.plugins), ['kaezon'])
   })

   it('omits rules for preset none', () => {
      const config = kaezon.createConfig({ preset: 'none' })
      assert.equal(config.name, 'kaezon/custom')
      assert.deepEqual(config.rules, {})
      assert.equal(config.plugins.kaezon, kaezon)
      assert.equal(config.rules.curly, undefined)
      assert.equal(config.rules['vue/prop-name-casing'], undefined)
   })

   it('overlays short and prefixed rule ids', () => {
      const config = kaezon.createConfig({
         preset: 'nuxt',
         rules: {
            'prefer-object-params': 'off',
            'kaezon/const-case': 'warn',
         },
      })
      assert.equal(config.rules['kaezon/prefer-object-params'], 'off')
      assert.equal(config.rules['kaezon/const-case'], 'warn')
      assert.equal(config.rules['kaezon/require-typescript-parser'], 'error')
   })

   it('copies non-kaezon overlay keys through', () => {
      const config = kaezon.createConfig({
         preset: 'nuxt',
         rules: {
            curly: 'off',
            'vue/prop-name-casing': 'error',
         },
      })
      assert.equal(config.rules.curly, 'off')
      assert.equal(config.rules['vue/prop-name-casing'], 'error')
   })

   it('replaces default files when files is passed', () => {
      const config = kaezon.createConfig({ files: ['**/*.ts'] })
      assert.deepEqual(config.files, ['**/*.ts'])
   })

   it('throws on an unknown preset', () => {
      assert.throws(
         () => kaezon.createConfig({ preset: 'nope' }),
         /Unknown preset "nope".*nuxt, none, ts, vue/,
      )
      assert.throws(
         () => kaezon.createConfig({ preset: 'all' }),
         /Unknown preset "all"/,
      )
   })

   it('throws on an unknown kaezon rule name', () => {
      assert.throws(
         () => kaezon.createConfig({ rules: { 'kaezon/not-a-rule': 'off' } }),
         /Unknown kaezon rule "kaezon\/not-a-rule"/,
      )
   })
})

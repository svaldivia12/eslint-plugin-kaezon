import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import kaezon from '../index.js'

describe('createConfig', () => {
   it('defaults to the all preset', () => {
      const config = kaezon.createConfig()
      assert.equal(config.name, 'kaezon/all')
      assert.equal(config.plugins.kaezon, kaezon)
      assert.equal(config.rules['kaezon/require-typescript-parser'], 'error')
      assert.equal(config.rules['kaezon/const-case'], 'error')
      assert.equal(config.rules['kaezon/vue-prop-name-casing-by-type'], 'error')
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
   })

   it('omits rules for preset none', () => {
      const config = kaezon.createConfig({ preset: 'none' })
      assert.equal(config.name, 'kaezon/custom')
      assert.deepEqual(config.rules, {})
      assert.equal(config.plugins.kaezon, kaezon)
   })

   it('overlays short and prefixed rule ids', () => {
      const config = kaezon.createConfig({
         preset: 'all',
         rules: {
            'prefer-object-params': 'off',
            'kaezon/const-case': 'warn',
         },
      })
      assert.equal(config.rules['kaezon/prefer-object-params'], 'off')
      assert.equal(config.rules['kaezon/const-case'], 'warn')
      assert.equal(config.rules['kaezon/require-typescript-parser'], 'error')
   })

   it('replaces default files when files is passed', () => {
      const config = kaezon.createConfig({ files: ['**/*.ts'] })
      assert.deepEqual(config.files, ['**/*.ts'])
   })

   it('throws on an unknown preset', () => {
      assert.throws(
         () => kaezon.createConfig({ preset: 'nope' }),
         /Unknown preset "nope"/,
      )
   })

   it('throws on an unknown rule name', () => {
      assert.throws(
         () => kaezon.createConfig({ rules: { 'not-a-rule': 'off' } }),
         /Unknown kaezon rule "not-a-rule"/,
      )
   })
})

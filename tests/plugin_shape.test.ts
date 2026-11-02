import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import kaezon from '../index.ts'

const rule_ids = [
   'kaezon/boolean-is-prefix',
   'kaezon/computed-explicit-return-type',
   'kaezon/const-case',
   'kaezon/prefer-object-params',
   'kaezon/require-satisfies-with-as-const',
   'kaezon/require-typescript-parser',
   'kaezon/vue-prop-name-casing-by-type',
]

describe('plugin entry point', () => {
   it('exposes meta name and version', () => {
      assert.equal(kaezon.meta.name, 'eslint-plugin-kaezon')
      assert.match(kaezon.meta.version, /^\d+\.\d+\.\d+/)
   })

   it('exposes every rule id without the prefix', () => {
      assert.deepEqual(
         Object.keys(kaezon.rules).map(name => `kaezon/${name}`).sort(),
         rule_ids,
      )
   })

   it('gives every rule a docs description and a message catalog', () => {
      for (const [name, rule] of Object.entries(kaezon.rules)) {
         assert.equal(typeof rule.create, 'function', `${name}.create`)
         assert.ok(rule.meta, `${name}.meta`)
         assert.ok(rule.meta?.docs?.description, `${name}.meta.docs.description`)
         assert.equal(typeof rule.meta?.type, 'string', `${name}.meta.type`)
         assert.ok(Array.isArray(rule.meta?.schema), `${name}.meta.schema`)
         assert.ok(
            rule.meta?.messages && Object.keys(rule.meta.messages).length > 0,
            `${name}.meta.messages`,
         )
      }
   })

   it('reports kaezon rule ids without the plugin prefix', () => {
      for (const name of Object.keys(kaezon.rules)) {
         assert.equal(name.includes('/'), false, `${name} should be prefixed on use`)
      }
   })
})

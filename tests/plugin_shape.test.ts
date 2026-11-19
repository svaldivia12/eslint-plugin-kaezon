import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import kaezon from '../index.ts'

const package_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
         Object.keys(kaezon.rules)
            .map(name => `kaezon/${name}`)
            .sort(),
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

   it('declares every package the published types import', () => {
      const manifest = JSON.parse(
         readFileSync(path.join(package_root, 'package.json'), 'utf8'),
      ) as {
         dependencies?: Record<string, string>
         peerDependencies?: Record<string, string>
      }
      const declared = new Set(
         Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }),
      )
      const dist_dir = path.join(package_root, 'dist')
      const imported = readdirSync(dist_dir, { recursive: true })
         .map(String)
         .filter(file => file.endsWith('.d.ts'))
         .flatMap(file =>
            [
               ...readFileSync(path.join(dist_dir, file), 'utf8').matchAll(/from '([^.][^']*)'/g),
            ].map(match => match[1] ?? ''),
         )

      assert.ok(imported.length > 0, 'expected dist/*.d.ts to import packages')
      for (const specifier of imported) {
         assert.ok(declared.has(specifier), `${specifier} is imported by dist/*.d.ts`)
      }
   })
})

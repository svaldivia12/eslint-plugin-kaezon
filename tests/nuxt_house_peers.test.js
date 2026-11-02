import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const package_root = path.resolve(
   path.dirname(fileURLToPath(import.meta.url)),
   '..',
)

const package_entries = [
   'configs',
   'eslint-rules',
   'index.js',
   'index.d.ts',
   'package.json',
]

/** `typescript` is a required peer: the rules import it at load time. */
const required_peers = ['typescript']

/**
 * Builds a throwaway copy of the package whose node_modules only contains the
 * packages listed in `keep`. Everything else is missing, so optional peer
 * plugins cannot resolve. The files are copied (not symlinked) because Node
 * resolves symlinks to their real path, which would find this repo's
 * node_modules and defeat the isolation.
 */
async function build_isolated_copy({ keep }) {
   const dir = await mkdtemp(path.join(tmpdir(), 'kaezon-isolated-'))
   const modules_dir = path.join(dir, 'node_modules')

   await mkdir(modules_dir, { recursive: true })

   for (const entry of package_entries) {
      await cp(path.join(package_root, entry), path.join(dir, entry), {
         recursive: true,
      })
   }

   for (const package_name of [...required_peers, ...keep]) {
      const target = path.join(modules_dir, package_name)
      await mkdir(path.dirname(target), { recursive: true })
      await symlink(
         path.join(package_root, 'node_modules', package_name),
         target,
         'dir',
      )
   }

   return dir
}

function run_node({ code, cwd }) {
   return new Promise(resolve => {
      execFile(
         process.execPath,
         ['--input-type=module', '--eval', code],
         { cwd },
         (error, stdout, stderr) => {
            resolve({ code: error?.code ?? 0, stderr, stdout })
         },
      )
   })
}

const peer_error_probe = `
import kaezon from './index.js'

try {
   void kaezon.configs.nuxt_house
   console.log('NO_ERROR')
} catch (error) {
   console.log('ERROR:' + error.message)
}
`

describe('nuxt_house without peer plugins', () => {
   it('imports the plugin but throws an actionable error', async t => {
      const dir = await build_isolated_copy({ keep: [] })
      t.after(() => rm(dir, { force: true, recursive: true }))

      const result = await run_node({ code: peer_error_probe, cwd: dir })

      assert.match(result.stdout, /^ERROR:/m)
      assert.match(result.stdout, /eslint-plugin-vue/)
      assert.match(result.stdout, /@typescript-eslint\/eslint-plugin/)
      assert.match(result.stdout, /devDependencies/)
      assert.match(result.stdout, /"nuxt" preset/)
      assert.equal(result.stdout.includes('NO_ERROR'), false)
   })

   it('still builds the nuxt preset without peers', async t => {
      const dir = await build_isolated_copy({ keep: [] })
      t.after(() => rm(dir, { force: true, recursive: true }))

      const result = await run_node({
         code: `
import kaezon from './index.js'
console.log(JSON.stringify({
   configs: Object.keys(kaezon.configs),
   plugins: Object.keys(kaezon.configs.nuxt.plugins),
   rules: Object.keys(kaezon.configs.nuxt.rules).length,
}))
`,
         cwd: dir,
      })

      assert.equal(result.code, 0, result.stderr)
      const payload = JSON.parse(result.stdout.trim())
      assert.deepEqual(payload.configs, ['nuxt', 'ts', 'vue', 'nuxt_house'])
      assert.deepEqual(payload.plugins, ['kaezon'])
      assert.equal(payload.rules, 7)
   })
})

describe('nuxt_house with peer plugins', () => {
   it('registers both peer plugins', async t => {
      const dir = await build_isolated_copy({
         keep: ['eslint-plugin-vue', '@typescript-eslint'],
      })
      t.after(() => rm(dir, { force: true, recursive: true }))

      const result = await run_node({
         code: `
import kaezon from './index.js'
const config = kaezon.configs.nuxt_house
console.log(JSON.stringify({
   name: config.name,
   plugins: Object.keys(config.plugins),
}))
`,
         cwd: dir,
      })

      assert.equal(result.code, 0, result.stderr)
      const payload = JSON.parse(result.stdout.trim())
      assert.equal(payload.name, 'kaezon/nuxt_house')
      assert.deepEqual(payload.plugins.sort(), [
         '@typescript-eslint',
         'kaezon',
         'vue',
      ])
   })
})

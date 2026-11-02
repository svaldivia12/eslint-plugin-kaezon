import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

const package_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Only `dist/` is published, so the isolation copies the built package rather
 * than the sources. `pnpm test` depends on `pnpm build` for that reason.
 */
const dist_dir = path.join(package_root, 'dist')

/** `typescript` is a required peer: the rules import it at load time. */
const required_peers = ['typescript']

interface IsolatedCopyOptions {
   keep: readonly string[]
}

interface RunNodeOptions {
   code: string
   cwd: string
}

interface RunNodeResult {
   code: number
   stderr: string
   stdout: string
}

interface ConfigProbe {
   configs: string[]
   plugins: string[]
   rules: number
}

interface HouseProbe {
   name: string
   plugins: string[]
}

/**
 * Builds a throwaway copy of the built package whose node_modules only contains
 * the packages listed in `keep`. Everything else is missing, so optional peer
 * plugins cannot resolve. The files are copied (not symlinked) because Node
 * resolves symlinks to their real path, which would find this repo's
 * node_modules and defeat the isolation.
 */
async function build_isolated_copy({ keep }: IsolatedCopyOptions): Promise<string> {
   const dir = await mkdtemp(path.join(tmpdir(), 'kaezon-isolated-'))
   const modules_dir = path.join(dir, 'node_modules')

   await mkdir(modules_dir, { recursive: true })
   await cp(dist_dir, path.join(dir, 'dist'), { recursive: true })
   await cp(path.join(package_root, 'package.json'), path.join(dir, 'package.json'))

   for (const package_name of [...required_peers, ...keep]) {
      const target = path.join(modules_dir, package_name)
      await mkdir(path.dirname(target), { recursive: true })
      await symlink(path.join(package_root, 'node_modules', package_name), target, 'dir')
   }

   return dir
}

function run_node({ code, cwd }: RunNodeOptions): Promise<RunNodeResult> {
   return new Promise(resolve => {
      execFile(
         process.execPath,
         ['--input-type=module', '--eval', code],
         { cwd },
         (error, stdout, stderr) => {
            const exit_code = typeof error?.code === 'number' ? error.code : 0
            resolve({ code: exit_code, stderr, stdout })
         },
      )
   })
}

const PLUGIN_ENTRY = './dist/index.js'

const peer_error_probe = `
import kaezon from '${PLUGIN_ENTRY}'

try {
   void kaezon.configs.nuxt_house
   console.log('NO_ERROR')
} catch (error) {
   console.log('ERROR:' + error.message)
}
`

const config_probe = `
import kaezon from '${PLUGIN_ENTRY}'
console.log(JSON.stringify({
   configs: Object.keys(kaezon.configs),
   plugins: Object.keys(kaezon.configs.nuxt.plugins),
   rules: Object.keys(kaezon.configs.nuxt.rules).length,
}))
`

const house_probe = `
import kaezon from '${PLUGIN_ENTRY}'
const config = kaezon.configs.nuxt_house
console.log(JSON.stringify({
   name: config.name,
   plugins: Object.keys(config.plugins),
}))
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

      const result = await run_node({ code: config_probe, cwd: dir })

      assert.equal(result.code, 0, result.stderr)
      const payload = JSON.parse(result.stdout.trim()) as ConfigProbe
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

      const result = await run_node({ code: house_probe, cwd: dir })

      assert.equal(result.code, 0, result.stderr)
      const payload = JSON.parse(result.stdout.trim()) as HouseProbe
      assert.equal(payload.name, 'kaezon/nuxt_house')
      assert.deepEqual(payload.plugins.sort(), ['@typescript-eslint', 'kaezon', 'vue'])
   })
})

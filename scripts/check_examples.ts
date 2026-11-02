/**
 * Checks that each example still trips the rules it documents, using the
 * package from this repository. `pnpm-workspace.yaml` links it into every
 * example, so `pnpm install` at the root is all the setup a fresh clone needs.
 *
 * The examples are read-only here on purpose: running `--fix` on a checked-in
 * probe would rewrite the very violations this script exists to prove still
 * happen. Autofix behaviour is covered by the RuleTester suites instead.
 *
 * Usage: node scripts/check_examples.ts
 */
import { execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const repo_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

interface Expectation {
   expect_rules: readonly string[]
   name: string
}

interface LintMessage {
   ruleId: string | null
}

interface LintFileResult {
   messages: LintMessage[]
}

const expectations: readonly Expectation[] = [
   {
      expect_rules: [
         '@typescript-eslint/explicit-function-return-type',
         'kaezon/vue-prop-name-casing-by-type',
      ],
      name: 'nuxt',
   },
   {
      expect_rules: ['kaezon/const-case', 'kaezon/prefer-object-params'],
      name: 'ts',
   },
]

/**
 * ESLint exits non-zero when it reports problems, which is the normal case
 * here, so the JSON on stdout is what matters rather than the exit code.
 */
async function reported_rules({ cwd }: { cwd: string }): Promise<string[]> {
   const { stdout } = await run('pnpm', ['exec', 'eslint', '--format', 'json', 'probe.ts'], {
      cwd,
   }).catch((error: unknown) => {
      const failed = error as { stdout?: string }
      return { stdout: failed.stdout ?? '[]' }
   })

   const results = JSON.parse(stdout) as LintFileResult[]
   const rules = results.flatMap(file => file.messages.map(message => message.ruleId))
   const unique = [...new Set(rules.filter((rule): rule is string => rule !== null))]
   return unique.sort((left, right) => left.localeCompare(right))
}

function check_example({ expect_rules, name }: Expectation, reported: readonly string[]): void {
   const missing = expect_rules.filter(rule => !reported.includes(rule))
   if (missing.length > 0) {
      throw new Error(`examples/${name}: expected these rules to report: ${missing.join(', ')}`)
   }
   process.stdout.write(`examples/${name}: reported ${reported.join(', ')}\n`)
}

const collected = await Promise.all(
   expectations.map(async expectation => ({
      expectation,
      reported: await reported_rules({ cwd: path.join(repo_root, 'examples', expectation.name) }),
   })),
)

for (const { expectation, reported } of collected) {
   check_example(expectation, reported)
}

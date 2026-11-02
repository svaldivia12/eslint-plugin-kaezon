/**
 * Runs each example against the package in this repository. The workspace file
 * links `eslint-plugin-kaezon` into every example, so `pnpm install` at the
 * root is all the setup a fresh clone needs.
 *
 * Every example ships code that fails on purpose, so the check is that the
 * expected rules actually report and that --fix does not leave unparsable code.
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
   fatal?: boolean
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

function collect_rules(results: readonly LintFileResult[]): string[] {
   const rules = results.flatMap(file => file.messages.map(message => message.ruleId))
   const unique = [...new Set(rules.filter((rule): rule is string => rule !== null))]
   return unique.sort((left, right) => left.localeCompare(right))
}

/**
 * ESLint exits non-zero when it reports problems, which is the normal case
 * here, so the JSON on stdout is what matters rather than the exit code.
 */
async function lint_json({
   cwd,
   extra,
}: {
   cwd: string
   extra?: string[]
}): Promise<LintFileResult[]> {
   const args = ['exec', 'eslint', '--format', 'json', ...(extra ?? []), 'probe.ts']
   const { stdout } = await run('pnpm', args, { cwd }).catch((error: unknown) => {
      const failed = error as { stdout?: string }
      return { stdout: failed.stdout ?? '[]' }
   })

   return JSON.parse(stdout) as LintFileResult[]
}

async function check_example({ expect_rules, name }: Expectation): Promise<void> {
   const cwd = path.join(repo_root, 'examples', name)

   const reported = collect_rules(await lint_json({ cwd }))
   const missing = expect_rules.filter(rule => !reported.includes(rule))
   if (missing.length > 0) {
      throw new Error(`examples/${name}: expected these rules to report: ${missing.join(', ')}`)
   }

   // --fix must not produce unparsable code, even when nothing is fixable.
   await run('pnpm', ['exec', 'eslint', '--fix', 'probe.ts'], { cwd }).catch(() => {})
   const after = await lint_json({ cwd })
   const broken = after.flatMap(file => file.messages.filter(message => message.fatal))
   if (broken.length > 0) {
      throw new Error(`examples/${name}: --fix produced unparsable code`)
   }

   process.stdout.write(`examples/${name}: reported ${reported.join(', ')}\n`)

   const still = collect_rules(after)
   process.stdout.write(
      still.length > 0
         ? `examples/${name}: still reported after --fix (expected, not auto-fixable): ${still.join(', ')}\n`
         : `examples/${name}: clean after --fix\n`,
   )
}

const runs = expectations.map(expectation => () => check_example(expectation))

// Chained rather than `for … await`: the runs are sequential on purpose, since
// each one shells out to eslint, and the intent reads clearly this way.
await runs.reduce<Promise<void>>(
   (previous, run_example) => previous.then(run_example),
   Promise.resolve(),
)

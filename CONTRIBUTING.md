# Contributing

Thanks for taking the time to contribute.

## Setup

Requires Node.js `^20.19.0 || ^22.13.0 || >=24` and pnpm 12.

```sh
pnpm install
pnpm build
pnpm test
```

The test suite imports `index.ts` directly and relies on Node's native type
stripping, which needs a recent Node. `.nvmrc` pins the development version
(Node 26) and CI runs the suite on it. The built package is separately checked
on Node 20.19, 22.13, 24 and 26, matching the `engines` range.
`pnpm build` is still needed for `pnpm check:package`, for the test that imports
the built package from `dist/`, and before publishing.

## Scripts

| Script               | What it does                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm build`         | Compiles the sources to `dist/` and emits `.d.ts` files.                                   |
| `pnpm format`        | Rewrites every file with Prettier.                                                         |
| `pnpm format:check`  | Fails if any file is not formatted. CI runs this.                                          |
| `pnpm test`          | Runs the rule and config test suite with `node --test` against the `.ts` sources.          |
| `pnpm lint`          | Lints this repo with its own rules plus ESLint recommended. Must report zero messages.     |
| `pnpm typecheck`     | Builds, then type-checks sources, scripts and tests with `strict` on.                      |
| `pnpm check:package` | Runs `publint` and `@arethetypeswrong/cli` over the packed tarball. Requires `pnpm build`. |

## Formatting and commits

Prettier owns formatting ([.prettierrc](.prettierrc)): three spaces, no semicolons,
single quotes, `arrowParens: avoid`, `printWidth: 100`. Do not hand-format around it;
run `pnpm format` and let CI confirm.

Husky installs two hooks when you run `pnpm install`:

- `pre-commit` runs `lint-staged`, which fixes and formats only the staged files.
- `commit-msg` runs commitlint, which requires a
  [Conventional Commits](https://www.conventionalcommits.org) message such as
  `feat: add x`, `fix: handle y`, or `chore: bump z`.

The history before v1.1.0 does not follow that convention and is intentionally left
alone; the rule applies to new commits only.

## Adding a rule

1. Create `eslint-rules/<rule-name>.ts` with a default export typed as a `KaezonRule`:

   ```ts
   import type { KaezonRule, TSESTree } from '../types.ts'

   const rule: KaezonRule<'someMessageId'> = {
      create(context) {
         function visit(node: TSESTree.VariableDeclarator): void {
            context.report({ messageId: 'someMessageId', node })
         }
         return { VariableDeclarator: visit }
      },
      meta: {
         docs: { description: '...' },
         messages: { someMessageId: '...' },
         schema: [],
         type: 'suggestion',
      },
   }

   export default rule
   ```

   `KaezonRule` is `TSESLint.RuleModule`, so each visitor receives its concrete
   `TSESTree` node and `context.report` only accepts the `messageId`s declared in
   `meta.messages`. A typo in either is a compile error.

   Use snake_case for local variables and functions, UPPER_CASE for literal
   constants, and a single object parameter when a function takes more than one
   argument. The repo lints itself with these rules.

2. Register it in `eslint-rules/index.ts`.

3. Add the rule name to `ts_rules`, `vue_rules`, or `parser_rules` in `configs/create_config.ts`. If it should be on in `nuxt`, make sure the preset list picks it up.

4. Add `tests/<rule-name>.test.ts` using `RuleTester` through the helpers in `tests/helpers/rule_tester.ts`. Wrap the rule with `as_rule_tester_rule(...)`: RuleTester is typed against the core ESLint `RuleModule`, which is structurally different from `TSESLint.RuleModule`. Mark each case with `name:` so failures are readable.

5. Update the rules table in `README.md` and add an entry under `## [Unreleased]` in `CHANGELOG.md`.

6. Run `pnpm build && pnpm lint && pnpm test && pnpm typecheck`.

## Rules that need type information

Read `context.sourceCode.parserServices` and fall back to an AST-only check when `parserServices.program` is missing. `boolean-is-prefix` is the reference implementation.

## Rules that need third-party plugins

Do not import `@typescript-eslint/*` or `vue/*` rules from a preset that must work without extra installs. House-style rules belong in `nuxt_house_rules` in `configs/create_config.ts`.

## Typing the plugin surface

`TSESLint.RuleModule` and ESLint's `RuleModule` describe the same runtime
contract with different `RuleContext` types, so they are not assignable to each
other. The single `as unknown as` cast lives in `to_plugin_rules` in `types.ts`.
Do not add casts elsewhere; if you hit an assignability error at a boundary, put
it there.

## Commits and pull requests

- Keep commits focused and write the subject in the imperative mood.
- Add a test for every behaviour change.
- Describe the problem in the pull request, not only the solution.

## Releasing

1. Bump `version` in `package.json` and move the `## [Unreleased]` entries in `CHANGELOG.md` under the new version heading.
2. Run `pnpm build && pnpm lint && pnpm test && pnpm typecheck && pnpm check:package`.
3. Commit, tag with `git tag -a v<version> -m "v<version>"`, and push the tag.
4. The release workflow builds, publishes to npm with provenance, and creates the GitHub release from `CHANGELOG.md`.

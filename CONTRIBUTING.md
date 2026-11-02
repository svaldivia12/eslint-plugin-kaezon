# Contributing

Thanks for taking the time to contribute.

## Setup

Requires Node.js `^22.13.0 || >=24` and pnpm 12.

```sh
pnpm install
pnpm test
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm test` | Runs the rule and config test suite with `node --test`. |
| `pnpm lint` | Lints this repo with its own rules plus ESLint recommended. Must report zero messages. |
| `pnpm typecheck` | Compiles `tests/types/` against the published `index.d.ts` with `strict` on. |
| `pnpm check:package` | Runs `publint` and `@arethetypeswrong/cli` over the packed tarball. |

## Adding a rule

1. Create `eslint-rules/<rule-name>.js` with a default export following the ESLint rule shape:

   ```js
   export default {
      create(context) {
         return { /* visitors */ }
      },
      meta: {
         docs: { description: '...' },
         messages: { someId: '...' },
         schema: [],
         type: 'suggestion',
      },
   }
   ```

   Use snake_case for local variables and functions, UPPER_CASE for literal constants, and a single object parameter when a function takes more than one argument. The repo lints itself with these rules.

2. Register it in `eslint-rules/index.js`.

3. Add the rule name to `ts_rules`, `vue_rules`, or `parser_rules` in `configs/create_config.js`. If it should be on in `nuxt`, make sure the preset list picks it up.

4. Add `tests/<rule-name>.test.js` using `RuleTester` through the helpers in `tests/helpers/rule_tester.js`. Mark each case with `name:` so failures are readable.

5. Update the rules table in `README.md` and add an entry under `## [Unreleased]` in `CHANGELOG.md`.

6. Run `pnpm lint && pnpm test && pnpm typecheck`.

## Rules that need type information

Set `meta.docs.requiresTypeChecking = true` and fall back to an AST-only check when `context.sourceCode.parserServices.program` is missing. `boolean-is-prefix` is the reference implementation.

## Rules that need third-party plugins

Do not import `@typescript-eslint/*` or `vue/*` rules from a preset that must work without extra installs. House-style rules belong in `nuxt_house_rules` in `configs/create_config.js`.

## Commits and pull requests

- Keep commits focused and write the subject in the imperative mood.
- Add a test for every behaviour change.
- Describe the problem in the pull request, not only the solution.

## Releasing

1. Bump `version` in `package.json` and move the `## [Unreleased]` entries in `CHANGELOG.md` under the new version heading.
2. Run `pnpm lint && pnpm test && pnpm typecheck && pnpm check:package`.
3. Commit, tag with `git tag -a v<version> -m "v<version>"`, and push the tag.
4. The release workflow publishes to npm with provenance and creates the GitHub release from `CHANGELOG.md`.

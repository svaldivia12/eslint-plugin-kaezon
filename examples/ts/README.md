# TypeScript example

A minimal project that runs the `ts` preset from the published package.

```sh
pnpm install
pnpm lint
```

`probe.ts` fails on purpose with two violations that behave differently:

- `total_count` is exported, so `kaezon/const-case` reports it but does not
  autofix it: renaming an exported binding could break importers. It offers a
  suggestion instead, available as a quick fix in the editor.
- `add(a, b)` takes two positional parameters. `kaezon/prefer-object-params`
  reports it and leaves the change to you, because picking the object shape is
  a design decision.

Neither is fixed by `--fix`. To see the autofix in action, change the export to
a plain declaration first:

```ts
const totalCount = 1
```

Then `pnpm exec eslint probe.ts --fix` renames it to `TOTAL_COUNT` together with
every reference in the file.

The `eslint.config.js` here registers `@typescript-eslint/parser` and turns off
`kaezon/require-typescript-parser`, which would otherwise report that the
parser is missing. In a real project you usually keep that rule on to catch
misconfiguration.

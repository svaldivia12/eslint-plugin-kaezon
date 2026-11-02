# TypeScript example

A minimal project that runs the `ts` preset from the published package.

```sh
npm install
npx eslint probe.ts
```

`probe.ts` fails on purpose: it exports a literal `const` in lower case and a
function with two positional parameters. Delete the offending lines, or run
`npx eslint probe.ts --fix` to watch the automatic rename.

The `eslint.config.js` here registers `@typescript-eslint/parser` and turns off
`kaezon/require-typescript-parser`, which would otherwise report that the
parser is missing. In a real project you usually keep that rule on to catch
misconfiguration.

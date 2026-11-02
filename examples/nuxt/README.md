# Nuxt house style example

A minimal project that runs `configs.nuxt_house`, the preset that adds the
opinionated Nuxt style on top of the kaezon rules.

```sh
npm install
npx eslint probe.ts
```

Unlike `configs.nuxt`, this preset needs `eslint-plugin-vue` and
`@typescript-eslint/eslint-plugin`, so `eslint.config.js` registers both before
reading the preset. It also enables typed linting, because
`@typescript-eslint/naming-convention` uses `types` selectors and needs a real
program. `tsconfig.json` here exists only to give that rule something to load.

`probe.ts` fails on purpose: a snake_case function prop, a camelCase value
prop, and an implicit function return type.

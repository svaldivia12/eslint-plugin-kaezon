# eslint-plugin-kaezon

[![npm version](https://img.shields.io/npm/v/eslint-plugin-kaezon.svg)](https://www.npmjs.com/package/eslint-plugin-kaezon)
[![CI](https://github.com/svaldivia12/eslint-plugin-kaezon/actions/workflows/ci.yml/badge.svg)](https://github.com/svaldivia12/eslint-plugin-kaezon/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/eslint-plugin-kaezon.svg)](./LICENSE)

ESLint 10 flat-config plugin with custom TypeScript and Vue rules.

The package exposes the rules as a single plugin (`kaezon`) and four presets: TypeScript-only, Vue-only, Nuxt, and an optional Nuxt house style. You can enable, disable, or override individual rules without other packages.

## Install

Peer dependency: **ESLint 10**, flat config only (`eslint.config.js`).

```sh
pnpm add -D eslint-plugin-kaezon
```

```sh
npm install -D eslint-plugin-kaezon
```

The plugin ships no parser. For TypeScript and Vue you also need:

```sh
pnpm add -D @typescript-eslint/parser vue-eslint-parser
```

## Usage

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [kaezon_plugin.configs.ts]
```

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [kaezon_plugin.configs.vue]
```

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [kaezon_plugin.configs.nuxt]
```

`ts`, `vue`, and `nuxt` enable **only custom `kaezon/*` rules**. They work with ESLint installed: no other plugin is required.

Vue + TypeScript / Nuxt apps that want the house style use `configs.nuxt_house` (or `createConfig({ preset: 'nuxt_house' })`). It builds on `eslint-plugin-vue` and `@typescript-eslint/eslint-plugin`, which must be installed in your project:

```sh
pnpm add -D eslint-plugin-vue @typescript-eslint/eslint-plugin
```

```js
import vue_plugin from 'eslint-plugin-vue'
import ts_plugin from '@typescript-eslint/eslint-plugin'
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [
   {
      plugins: { '@typescript-eslint': ts_plugin, vue: vue_plugin },
   },
   kaezon_plugin.configs.nuxt_house,
]
```

Reading `configs.nuxt_house` without those plugins installed throws an error naming the missing packages. The plugin does not register them for you.

Turn off one rule from a preset:

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [
   kaezon_plugin.createConfig({
      preset: 'nuxt',
      rules: { 'prefer-object-params': 'off' },
   }),
]
```

Register the plugin with no preset rules, then enable a subset:

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [
   kaezon_plugin.createConfig({
      preset: 'none',
      rules: {
         'const-case': 'error',
         'vue-prop-name-casing-by-type': 'error',
      },
   }),
]
```

Override a rule in a following config object:

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [
   kaezon_plugin.configs.nuxt,
   { rules: { 'kaezon/const-case': 'off' } },
]
```

`createConfig` keys accept kaezon short names (`const-case`) or prefixed ids (`kaezon/const-case`); those emit prefixed `kaezon/...` ids. Other ESLint rule ids (`curly`, `@typescript-eslint/...`, `vue/...`) are copied through so house style can be overridden without a second config object. Unknown `kaezon/...` names throw.

Optional `files` replaces the default globs (`**/*.ts`, `**/*.tsx`, `**/*.mts`, `**/*.cts`, `**/*.vue`).

## Parser

Some rules inspect TypeScript AST nodes (`TSAsExpression`, `TSSatisfiesExpression`, `TSTypeAnnotation`, and similar). The consuming app must parse TypeScript and Vue-TS; this plugin does not ship a parser.

Use `@typescript-eslint/parser` for `.ts` / `.tsx` files, and `vue-eslint-parser` (with a TypeScript parser) for `.vue` files.

Every preset enables `kaezon/require-typescript-parser` as `'error'`. If that rule reports, the app's `languageOptions.parser` is wrong; it is not a false positive from the style rules. Typical setup:

```js
import ts_parser from '@typescript-eslint/parser'
import vue_parser from 'vue-eslint-parser'

export default [
   {
      files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
      languageOptions: { parser: ts_parser },
   },
   {
      files: ['**/*.vue'],
      languageOptions: {
         parser: vue_parser,
         parserOptions: { parser: ts_parser },
      },
   },
]
```

## Rules

| Rule id | Description | Presets |
|---|---|---|
| `kaezon/boolean-is-prefix` | Require `is_` prefix for booleans and Vue boolean refs (`Ref` / `ShallowRef` / `ComputedRef`); type-aware when typed linting is enabled | vue, nuxt, nuxt_house |
| `kaezon/computed-explicit-return-type` | Require explicit return types for getters passed to `computed` | vue, nuxt, nuxt_house |
| `kaezon/const-case` | Require UPPER_CASE for literal and `as const` declarations, and lower case for mutable or computed bindings | ts, nuxt, nuxt_house |
| `kaezon/prefer-object-params` | Prefer a single object parameter over multiple positional parameters | ts, nuxt, nuxt_house |
| `kaezon/require-satisfies-with-as-const` | Require `as const satisfies SomeType` instead of bare `as const` to validate structure at compile time | ts, nuxt, nuxt_house |
| `kaezon/require-typescript-parser` | Require a TypeScript parser for TS files, and `vue-eslint-parser` with a TypeScript parser for Vue files | ts, vue, nuxt, nuxt_house |
| `kaezon/vue-prop-name-casing-by-type` | Enforce camelCase for function props and snake_case for other props in `defineProps` | vue, nuxt, nuxt_house |

`boolean-is-prefix` and `computed-explicit-return-type` target Vue code. In a project without Vue they match nothing, which is why they are left out of the `ts` preset.

## Nuxt house style

`configs.nuxt_house` enables every `kaezon/*` rule above that applies to Vue + TypeScript, plus this house style:

- `@typescript-eslint/explicit-function-return-type`: `['error', { allowTypedFunctionExpressions: false }]`
- `@typescript-eslint/naming-convention`: camelCase for function declarations and function-typed variables/parameters; `snake_case` / `UPPER_CASE` for `const`; `snake_case` for other variables and parameters; camelCase for function-typed type properties; `snake_case` for other type properties
- `curly`: `['error', 'multi']`
- `no-restricted-syntax`: forbid `defineEmits` (use props/callbacks instead)
- `vue/prop-name-casing`: `'off'` (`kaezon/vue-prop-name-casing-by-type` replaces it)

`@typescript-eslint/*` house rules and `vue/prop-name-casing` come from `@typescript-eslint/eslint-plugin` and `eslint-plugin-vue`. Install both and register them in `plugins` before using this preset.

One house rule, `@typescript-eslint/naming-convention`, uses `types` selectors, so it needs type information. Enable typed linting for the files the preset covers, for example:

```js
{
   languageOptions: {
      parser: ts_parser,
      parserOptions: {
         projectService: true,
         tsconfigRootDir: import.meta.dirname,
      },
   },
}
```

Without `parserOptions.project` or `parserOptions.projectService`, ESLint reports that the rule requires type information. `configs.nuxt_house` cannot enable that for you because the tsconfig belongs to the consuming project.

`ts`, `vue`, and `nuxt` do not include house style and do not need typed linting.

## API

Default export:

- `meta`: `{ name: 'eslint-plugin-kaezon', version }` (version is read from `package.json`)
- `rules`: the custom style rules plus `require-typescript-parser`
- `configs.ts` / `configs.vue` / `configs.nuxt` / `configs.nuxt_house`: one flat config object each
- `createConfig(options?)`: build one flat config from a preset plus optional overlay

`createConfig` options:

- `preset`: `'ts' | 'vue' | 'nuxt' | 'nuxt_house' | 'none'` (default `'nuxt'`). `'none'` registers `plugins: { kaezon }` with no rules on, then applies `rules`.
- `files`: glob list; replaces the default globs when passed
- `rules`: overlay; wins over the preset. Kaezon short names and `kaezon/...` ids are validated; other ESLint rule ids pass through.

Unknown `preset` throws. Unknown `kaezon/...` names throw. Valid short names are the ids in the table above without the `kaezon/` prefix.

TypeScript types ship with the package (`index.d.ts`), including `PresetName`, `CreateConfigOptions`, and `KaezonPlugin`.

## Requirements

- Node.js `^22.13.0 || >=24`
- ESLint `^10.0.0`
- TypeScript `>=5` (peer, for the type-aware checks)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Report security issues privately through [Security Advisories](https://github.com/svaldivia12/eslint-plugin-kaezon/security/advisories/new), not the public issue tracker.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE) © Sebastián Valdivia Loyola

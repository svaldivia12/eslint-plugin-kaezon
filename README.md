# eslint-plugin-kaezon

ESLint 10 flat-config plugin with custom TypeScript and Vue rules. Install it from a private Git URL; it is not published to npm.

The package exposes the rules as a single plugin (`kaezon`) and three presets: TypeScript-only, Vue-only, and Nuxt (Vue + TypeScript house style). You can enable, disable, or override individual rules without other packages.

Vue + TypeScript / Nuxt apps should use `configs.nuxt` (or `createConfig({ preset: 'nuxt' })`).

`ts`, `vue`, and `none` enable only custom `kaezon/*` rules — no house style.

## Test

```sh
pnpm test
```

## Install

Peer dependency: **ESLint 10**, flat config only (`eslint.config.js`). Pin a **tag**, not a branch.

SSH:

```sh
pnpm add -D git+ssh://git@github.com/svaldivia12/eslint-plugin-kaezon.git#v1.0.0
```

HTTPS / CI (replace `<TOKEN>` with a GitHub token that can read the repo):

```sh
pnpm add -D git+https://<TOKEN>@github.com/svaldivia12/eslint-plugin-kaezon.git#v1.0.0
```

## Parser

Some rules inspect TypeScript AST nodes (`TSAsExpression`, `TSSatisfiesExpression`, `TSTypeAnnotation`, and similar). The consuming app must parse TypeScript and Vue-TS; this plugin does not ship a parser.

Use `@typescript-eslint/parser` for `.ts` / `.tsx` files, and `vue-eslint-parser` (with a TypeScript parser) for `.vue` files.

The `ts`, `vue`, and `nuxt` presets enable `kaezon/require-typescript-parser` as `'error'`. If that rule reports, the app's `languageOptions.parser` is wrong — it is not a false positive from the style rules. Typical setup:

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

## Nuxt house style

`configs.nuxt` enables every custom `kaezon/*` rule that applies to Vue + TypeScript, plus this house style:

- `@typescript-eslint/explicit-function-return-type`: `['error', { allowTypedFunctionExpressions: false }]`
- `@typescript-eslint/naming-convention`: camelCase for function declarations and function-typed variables/parameters; `snake_case` / `UPPER_CASE` for `const`; `snake_case` for other variables and parameters; camelCase for function-typed type properties; `snake_case` for other type properties
- `kaezon/boolean-is-prefix`: `is_` prefix for booleans and Vue `Ref` / `ShallowRef` / `ComputedRef` boolean bindings (type-aware when the app enables typed linting; reads naturally in English)
- `curly`: `['error', 'multi']`
- `no-restricted-syntax`: forbid `defineEmits` (use props/callbacks instead)
- `vue/prop-name-casing`: `'off'` (`kaezon/vue-prop-name-casing-by-type` replaces it)

`@typescript-eslint/*` house rules and `vue/prop-name-casing` require the consuming app to already register `@typescript-eslint` and `eslint-plugin-vue`. This plugin does not ship those parsers or plugins.

`ts`, `vue`, and `none` do not include house style.

## Rules

| Rule id | Description | Presets |
|---|---|---|
| `kaezon/boolean-is-prefix` | Require `is_` prefix for booleans and Vue boolean refs (`Ref` / `ShallowRef` / `ComputedRef`); type-aware when typed linting is enabled | vue, nuxt |
| `kaezon/computed-explicit-return-type` | Require explicit return types for getters passed to `computed` | vue, nuxt |
| `kaezon/const-case` | Require UPPER_CASE for literal and `as const` declarations, and lower case for mutable or computed bindings | ts, nuxt |
| `kaezon/prefer-object-params` | Prefer a single object parameter over multiple positional parameters | ts, nuxt |
| `kaezon/require-satisfies-with-as-const` | Require `as const satisfies SomeType` instead of bare `as const` to validate structure at compile time | ts, nuxt |
| `kaezon/require-typescript-parser` | Require a TypeScript parser for TS files, and `vue-eslint-parser` with a TypeScript parser for Vue files | ts, vue, nuxt |
| `kaezon/vue-prop-name-casing-by-type` | Enforce camelCase for function props and snake_case for other props in `defineProps` | vue, nuxt |

## API

Default export:

- `meta` — `{ name: 'eslint-plugin-kaezon', version }` (version is read from `package.json`)
- `rules` — the custom style rules plus `require-typescript-parser`
- `configs.ts` / `configs.vue` / `configs.nuxt` — one flat config object each
- `createConfig(options?)` — build one flat config from a preset plus optional overlay

`createConfig` options:

- `preset` — `'ts' | 'vue' | 'nuxt' | 'none'` (default `'nuxt'`). `'none'` registers `plugins: { kaezon }` with no rules on, then applies `rules`.
- `files` — glob list; replaces the default globs when passed
- `rules` — overlay; wins over the preset. Kaezon short names and `kaezon/...` ids are validated; other ESLint rule ids pass through.

Unknown `preset` throws. Unknown `kaezon/...` names throw. Valid short names are the ids in the table above without the `kaezon/` prefix.

# eslint-plugin-kaezon

ESLint 10 flat-config plugin with custom TypeScript and Vue rules. Install it from a private Git URL; it is not published to npm.

The package exposes the rules as a single plugin (`kaezon`) and three presets: TypeScript-only, Vue-only, and both. You can enable, disable, or override individual rules without other packages.

Vue + TypeScript apps should use `configs.all` (or `createConfig({ preset: 'all' })`).

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

The `ts`, `vue`, and `all` presets enable `kaezon/require-typescript-parser` as `'error'`. If that rule reports, the app's `languageOptions.parser` is wrong — it is not a false positive from the style rules. Typical setup:

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

export default [kaezon_plugin.configs.all]
```

Turn off one rule from a preset:

```js
import kaezon_plugin from 'eslint-plugin-kaezon'

export default [
   kaezon_plugin.createConfig({
      preset: 'all',
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
   kaezon_plugin.configs.all,
   { rules: { 'kaezon/const-case': 'off' } },
]
```

`createConfig` keys accept short names (`const-case`) or prefixed ids (`kaezon/const-case`). Emitted configs always use prefixed ids.

Optional `files` replaces the default globs (`**/*.ts`, `**/*.tsx`, `**/*.mts`, `**/*.cts`, `**/*.vue`).

## Rules

| Rule id | Description | Presets |
|---|---|---|
| `kaezon/computed-explicit-return-type` | Require explicit return types for getters passed to `computed` | vue, all |
| `kaezon/const-case` | Require UPPER_CASE for literal and `as const` declarations, and lower case for mutable or computed bindings | ts, all |
| `kaezon/prefer-object-params` | Prefer a single object parameter over multiple positional parameters | ts, all |
| `kaezon/require-satisfies-with-as-const` | Require `as const satisfies SomeType` instead of bare `as const` to validate structure at compile time | ts, all |
| `kaezon/require-typescript-parser` | Require a TypeScript parser for TS files, and `vue-eslint-parser` with a TypeScript parser for Vue files | ts, vue, all |
| `kaezon/vue-prop-name-casing-by-type` | Enforce camelCase for function props and snake_case for other props in `defineProps` | vue, all |

## API

Default export:

- `meta` — `{ name: 'eslint-plugin-kaezon', version }` (version is read from `package.json`)
- `rules` — the custom style rules plus `require-typescript-parser`
- `configs.ts` / `configs.vue` / `configs.all` — one flat config object each
- `createConfig(options?)` — build one flat config from a preset plus optional overlay

`createConfig` options:

- `preset` — `'ts' | 'vue' | 'all' | 'none'` (default `'all'`). `'none'` registers `plugins: { kaezon }` with no rules on, then applies `rules`.
- `files` — glob list; replaces the default globs when passed
- `rules` — overlay; wins over the preset. Unknown names throw.

Unknown `preset` or rule name throws. Valid short names are the ids in the table above without the `kaezon/` prefix.

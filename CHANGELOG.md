# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-02

### Added

- Plugin entry point with `configs.ts`, `configs.vue`, `configs.nuxt`, `configs.nuxt_house`, and `createConfig()`.
- `kaezon/boolean-is-prefix`: require an `is_` prefix for booleans and Vue boolean refs. Type-aware when the consumer enables typed linting.
- `kaezon/computed-explicit-return-type`: require explicit return types for `computed()` getters.
- `kaezon/const-case`: UPPER_CASE for literal and `as const` declarations, lower case for mutable or computed bindings.
- `kaezon/prefer-object-params`: prefer a single object parameter over multiple positional parameters.
- `kaezon/require-satisfies-with-as-const`: require `as const satisfies SomeType` instead of bare `as const`.
- `kaezon/require-typescript-parser`: report file types that are not parsed by a TypeScript-capable parser.
- `kaezon/vue-prop-name-casing-by-type`: camelCase for function props, snake_case for other props in `defineProps`.
- `nuxt_house` preset with the Nuxt house style on top of the kaezon rules. It loads `eslint-plugin-vue` and `@typescript-eslint/eslint-plugin` from the consuming project.

### Notes

- Written in TypeScript and published as compiled ESM in `dist/`, with `.d.ts` files generated from the source.
- Requires Node.js `>=26` and ESLint `^10.0.0` (flat config only).
- The public types (`PresetName`, `CreateConfigOptions`, `KaezonPlugin`, `KaezonRule`, `KaezonRuleContext`, `KaezonRuleMap`, `RuleConfig`, `RuleSeverity`, `FlatConfig`) are exported from the package root.
- `configs.nuxt` contains kaezon rules only and works with ESLint installed.
- `configs.nuxt_house` requires `eslint-plugin-vue` and `@typescript-eslint/eslint-plugin`.
- The plugin ships no parser. Use `@typescript-eslint/parser` and `vue-eslint-parser` in the consuming project.

[Unreleased]: https://github.com/svaldivia12/eslint-plugin-kaezon/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/svaldivia12/eslint-plugin-kaezon/releases/tag/v1.0.0

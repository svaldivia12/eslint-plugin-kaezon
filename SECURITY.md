# Security Policy

## Supported versions

The latest published minor of `eslint-plugin-kaezon` receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub Security Advisories:
<https://github.com/svaldivia12/eslint-plugin-kaezon/security/advisories/new>

Include:

- The affected version.
- A description of the issue and its impact.
- A minimal reproduction when possible.

You can expect an initial response within seven days. Once a fix is ready, a patched version is published and the advisory is disclosed with credit, unless you prefer to stay anonymous.

## Scope

This plugin runs inside the consumer's ESLint process, so rule implementations must not:

- Execute code from linted files.
- Read or write files outside the paths ESLint already reads and writes.
- Make network requests.

`nuxt_house` loads `eslint-plugin-vue` and `@typescript-eslint/eslint-plugin` from the consuming project by design. Vulnerabilities in those packages should be reported to their maintainers.

## Known advisories in development dependencies

`pnpm audit` reports one moderate advisory, [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (minimatch denial of service via globparts amplification).

It reaches the tree only through devDependencies: `eslint` depends on
`@eslint/config-array`, which depends on `minimatch ^10.2.4`. The published
package declares no runtime dependencies, so no consumer inherits it.

It cannot be fixed from this repository. The advisory is patched in
`minimatch >= 11.0.1`, while ESLint 10 requires the 10.x line, and no patched
10.x release exists. Overrides that force 11 leave the 10.2.6 copy in place
because `^10.2.4` cannot be satisfied by a major bump. This will clear when
ESLint moves to a major that allows minimatch 11.

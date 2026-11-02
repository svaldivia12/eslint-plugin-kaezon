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

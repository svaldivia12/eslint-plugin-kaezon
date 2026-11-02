/**
 * The probe files under examples/ fail on purpose, so they must never go
 * through `eslint --fix`: the rule reports are the point of the examples.
 * Everything else is linted and formatted as usual.
 */
export default {
   '*.{js,ts}': filenames => {
      const lintable = filenames.filter(file => !file.includes('/examples/'))
      if (lintable.length === 0) return []
      const quoted = lintable.map(file => JSON.stringify(file)).join(' ')
      return [`eslint --fix ${quoted}`, `prettier --write ${quoted}`]
   },
   '*.{json,md,yml,yaml}': ['prettier --write'],
}

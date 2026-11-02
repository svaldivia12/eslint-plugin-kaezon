// Two violations, deliberately different:
//
// - `total_count` is exported, so `const-case` only offers a suggestion: renaming
//   it automatically could break importers. Use the editor quick fix.
// - `add` takes two positional parameters, which `prefer-object-params` reports.
//   It has no autofix either: choosing the object shape is a human decision.
export const total_count = 1

export function add(a: number, b: number): number {
   return a + b
}

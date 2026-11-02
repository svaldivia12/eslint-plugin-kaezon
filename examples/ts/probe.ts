// Runs `kaezon/const-case` and `kaezon/prefer-object-params`.
// `npx eslint probe.ts --fix` renames total_count to TOTAL_COUNT everywhere.
export const total_count = 1

export function add(a: number, b: number): number {
   return a + b
}

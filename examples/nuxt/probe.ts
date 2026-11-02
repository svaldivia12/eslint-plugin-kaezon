// Runs the nuxt_house preset. Three things are wrong on purpose:
// the function prop is snake_case, the value prop is camelCase, and `build`
// has no explicit return type.
declare function defineProps<T>(): T

const props = defineProps<{
   onClick: () => void
   total_records: number
}>()

export function build() {
   return props.totalRecords
}

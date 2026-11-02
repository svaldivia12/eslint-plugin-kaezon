import boolean_is_prefix_rule from './boolean-is-prefix.ts'
import computed_explicit_return_type_rule from './computed-explicit-return-type.ts'
import const_case_rule from './const-case.ts'
import prefer_object_params_rule from './prefer-object-params.ts'
import require_satisfies_with_as_const_rule from './require-satisfies-with-as-const.ts'
import require_typescript_parser_rule from './require-typescript-parser.ts'
import vue_prop_name_casing_by_type_rule from './vue-prop-name-casing-by-type.ts'
import type { KaezonRuleMap } from '../types.ts'

const rules: KaezonRuleMap = {
   'boolean-is-prefix': boolean_is_prefix_rule,
   'computed-explicit-return-type': computed_explicit_return_type_rule,
   'const-case': const_case_rule,
   'prefer-object-params': prefer_object_params_rule,
   'require-satisfies-with-as-const': require_satisfies_with_as_const_rule,
   'require-typescript-parser': require_typescript_parser_rule,
   'vue-prop-name-casing-by-type': vue_prop_name_casing_by_type_rule,
}

export default { rules }
export { rules }

import computed_explicit_return_type_rule from './computed-explicit-return-type.js'
import const_case_rule from './const-case.js'
import prefer_object_params_rule from './prefer-object-params.js'
import require_satisfies_with_as_const_rule from './require-satisfies-with-as-const.js'
import vue_prop_name_casing_by_type_rule from './vue-prop-name-casing-by-type.js'

export default {
   rules: {
      'computed-explicit-return-type': computed_explicit_return_type_rule,
      'const-case': const_case_rule,
      'prefer-object-params': prefer_object_params_rule,
      'require-satisfies-with-as-const': require_satisfies_with_as_const_rule,
      'vue-prop-name-casing-by-type': vue_prop_name_casing_by_type_rule,
   },
}

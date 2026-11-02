import ts_parser from '@typescript-eslint/parser'
import kaezon from 'eslint-plugin-kaezon'

export default [
   {
      files: ['**/*.ts'],
      languageOptions: { parser: ts_parser },
   },
   kaezon.createConfig({
      files: ['**/*.ts'],
      preset: 'ts',
      rules: {
         // This example has no tsconfig, so the parser service check would fire.
         'kaezon/require-typescript-parser': 'off',
      },
   }),
]

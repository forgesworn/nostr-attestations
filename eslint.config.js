import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  { files: ['test/**/*.ts'], rules: { '@typescript-eslint/no-non-null-assertion': 'off' } },
)

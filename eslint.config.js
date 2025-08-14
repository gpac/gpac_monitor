// eslint.config.js
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default tseslint.config(
  { ignores: ['dist', 'build', 'coverage', 'node_modules'] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',

      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      ...reactHooks.configs.recommended.rules
    }
  }
)

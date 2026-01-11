// @ts-check
import js from '@eslint/js'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'
import tsEslint from 'typescript-eslint'

const config = tsEslint.config(
  { ignores: ['node_modules', '**/dist/**', '**/build/**', 'eslint.config.js'] },
  {
    extends: [js.configs.recommended, ...tsEslint.configs.recommended],
    files: ['**/*.{ts,js}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.node, ...globals.es2022 },
      parser: tsEslint.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./packages/*/tsconfig.json']
      }
    },
    plugins: {
      prettier
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      'prettier/prettier': [
        'warn',
        {
          endOfLine: 'lf',
          singleQuote: true
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)

export default config

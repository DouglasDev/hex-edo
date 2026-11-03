import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Include function-valued constants: handlers and React components often use arrows.
const functionVariable = {
  selector:
    ':matches(VariableDeclaration[declarations.0.init.type="ArrowFunctionExpression"], VariableDeclaration[declarations.0.init.type="FunctionExpression"])',
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      'dist/**',
      '.vite-cache/**',
      '.husky/_/**',
      'test-results/**',
      'playwright-report/**',
      'public/**',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@stylistic': stylistic },
    rules: {
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        {
          blankLine: 'always',
          prev: '*',
          next: ['function', 'class', 'interface', 'type', 'export'],
        },
        {
          blankLine: 'always',
          prev: ['function', 'class', 'interface', 'type', 'export'],
          next: '*',
        },
        { blankLine: 'always', prev: '*', next: functionVariable },
        { blankLine: 'always', prev: functionVariable, next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: 'block-like', next: '*' },
        { blankLine: 'always', prev: '*', next: 'multiline-expression' },
        { blankLine: 'always', prev: 'multiline-expression', next: '*' },
        { blankLine: 'always', prev: '*', next: 'return' },
      ],
      '@stylistic/lines-between-class-members': [
        'error',
        {
          enforce: [
            { blankLine: 'always', prev: '*', next: 'method' },
            { blankLine: 'always', prev: 'method', next: '*' },
          ],
        },
        { exceptAfterOverload: true },
      ],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }],
    },
  },
];

import js from '@eslint/js';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/',
      '*/node_modules/',
      'dist/',
      'build/',
      '*/dist/',
      '*/build/',
      'ui/dev-dist/',
      'logs/',
      '*.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pids/',
      '*.pid',
      '*.seed',
      '*.pid.lock',
      'coverage/',
      '*.lcov',
      '.nyc_output/',
      'jspm_packages/',
      '.npm',
      '.eslintcache',
      '*.tgz',
      '.yarn-integrity',
      '.env',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
      'uploads/',
      'data/',
      '*.min.js',
      '*.bundle.js',
      '.vscode/',
      '.idea/',
      '*.swp',
      '*.swo',
      '.DS_Store',
      '.DS_Store?',
      '._*',
      '.Spotlight-V100',
      '.Trashes',
      'ehthumbs.db',
      'Thumbs.db',
      'webpack.config.js',
      'vite.config.js',
    ],
  },
  // Base configuration for all JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      ...js.configs.recommended.rules,

      // Code complexity and refactoring rules
      'max-lines': ['error', { max: 250, skipBlankLines: true, skipComments: true }],
      // 'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-params': ['error', 4],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      // 'complexity': ['error', 10],
      'max-statements': ['error', 20],
      'max-statements-per-line': ['error', { max: 1 }],

      // Modularity and organization rules
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': [
        'error',
        {
          array: true,
          object: true,
        },
        {
          enforceForRenamedProperties: false,
        },
      ],

      // Code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-duplicate-imports': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'no-unused-private-class-members': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-constant-condition': 'error',
      'no-duplicate-case': 'error',
      'no-empty': 'error',
      'no-empty-character-class': 'error',
      'no-empty-pattern': 'error',
      'no-extra-boolean-cast': 'error',
      // Removed 'no-extra-semi' - conflicts with Prettier formatting
      'no-fallthrough': 'error',
      'no-func-assign': 'error',
      'no-import-assign': 'error',
      'no-invalid-regexp': 'error',
      'no-irregular-whitespace': 'error',
      'no-loss-of-precision': 'error',
      'no-misleading-character-class': 'error',
      'no-prototype-builtins': 'error',
      'no-regex-spaces': 'error',
      'no-shadow-restricted-names': 'error',
      'no-sparse-arrays': 'error',
      // Removed 'no-unexpected-multiline' - conflicts with Prettier formatting
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // Function and class organization
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'class-methods-use-this': 'warn',

      // Import/Export organization
      'sort-imports': [
        'error',
        {
          ignoreCase: false,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: false,
        },
      ],

      // Code formatting handled by Prettier - removed conflicting rules

      // Error prevention
      'no-implicit-globals': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-void': 'error',

      // Best practices for Node.js
      'no-process-exit': 'error',
      'no-sync': 'warn',
      'handle-callback-err': 'error',
    },
  },
  // Server-specific configuration
  {
    files: ['server/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Server-specific rules
      'no-console': 'off', // Allow console in server code for logging
      'no-process-env': 'off', // Allow process.env in server code
    },
  },
  // CLI and scripts configuration
  {
    files: ['bin/**/*.js', 'scripts/**/*.js'],
    rules: {
      'no-console': 'off', // Allow console in CLI scripts
      'no-process-exit': 'off', // Allow process.exit in CLI scripts
    },
  },
];

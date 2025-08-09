# ESLint Configuration for Better Code Refactoring and Modularity

This document explains the ESLint rules configured for this project to promote better code refactoring, modularity, and maintainability.

## Overview

The project uses two ESLint configurations:
- **Root ESLint** (`.eslintrc.js`) - For Node.js server code
- **UI ESLint** (`ui/eslint.config.js`) - For React frontend code

## Key Refactoring Rules

### 1. Code Complexity Rules

#### `max-lines: 250`
- **Purpose**: Enforces maximum file length to encourage breaking large files into smaller modules
- **Server**: 250 lines max
- **UI**: 250 lines max
- **Why**: Large files are harder to understand, test, and maintain

#### `max-lines-per-function: 50 (server) / 40 (UI)`
- **Purpose**: Limits function size to promote single responsibility principle
- **Why**: Smaller functions are easier to test, debug, and reuse

#### `max-params: 4 (server) / 3 (UI)`
- **Purpose**: Limits function parameters to encourage object destructuring or configuration objects
- **Why**: Too many parameters make functions hard to use and understand

#### `complexity: 10 (server) / 8 (UI)`
- **Purpose**: Limits cyclomatic complexity to encourage simpler logic
- **Why**: Complex functions are harder to test and maintain

#### `max-depth: 4`
- **Purpose**: Limits nesting depth to encourage early returns and guard clauses
- **Why**: Deep nesting makes code harder to follow

#### `max-statements: 20 (server) / 15 (UI)`
- **Purpose**: Limits the number of statements in a function
- **Why**: Functions with many statements often do too much

### 2. Modularity Rules

#### `prefer-const`
- **Purpose**: Enforces immutability where possible
- **Why**: Reduces bugs and makes code more predictable

#### `prefer-destructuring`
- **Purpose**: Encourages destructuring for cleaner variable assignment
- **Example**: `const { name, age } = user` instead of `const name = user.name`

#### `object-shorthand`
- **Purpose**: Promotes concise object property syntax
- **Example**: `{ name }` instead of `{ name: name }`

#### `prefer-template`
- **Purpose**: Encourages template literals over string concatenation
- **Example**: `\`Hello ${name}\`` instead of `'Hello ' + name`

### 3. React-Specific Modularity Rules

#### `react/jsx-max-props-per-line: 3`
- **Purpose**: Limits props per line for better readability
- **Why**: Too many props on one line are hard to read

#### `react/jsx-max-depth: 5`
- **Purpose**: Limits JSX nesting depth
- **Why**: Deep JSX nesting indicates components that should be broken down

#### `react/no-multi-comp`
- **Purpose**: One component per file (with exceptions for stateless components)
- **Why**: Promotes better file organization and reusability

#### `react/prefer-stateless-function`
- **Purpose**: Encourages functional components over class components when possible
- **Why**: Functional components are simpler and more performant

#### `react/jsx-no-bind`
- **Purpose**: Prevents inline function binding in JSX
- **Why**: Inline binding creates new functions on every render, hurting performance

### 4. Import/Export Organization

#### `sort-imports`
- **Purpose**: Enforces consistent import ordering
- **Why**: Organized imports are easier to scan and maintain

#### `no-duplicate-imports`
- **Purpose**: Prevents importing from the same module multiple times
- **Why**: Consolidates imports for better organization

### 5. Code Quality Rules

#### `no-unused-vars`
- **Purpose**: Removes dead code
- **Configuration**: Allows variables starting with `_` (for intentionally unused parameters)

#### `no-console` (warn in UI, off in server)
- **Purpose**: Prevents console statements in production UI code
- **Why**: Console statements should be replaced with proper logging

#### `no-debugger`
- **Purpose**: Prevents debugger statements in production code
- **Why**: Debugger statements should not be committed

## Usage

### Running ESLint

```bash
# Lint all code (server + UI)
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Lint only server code
npm run lint:server

# Lint only UI code
npm run lint:ui

# Check for zero warnings (strict mode)
npm run refactor:check
```

### Integration with Development Workflow

1. **Pre-commit hooks**: Consider adding ESLint to your pre-commit hooks
2. **CI/CD**: Run `npm run refactor:check` in your CI pipeline
3. **IDE Integration**: Configure your IDE to show ESLint errors in real-time

## Customization

### Adjusting Rule Severity

Rules can be configured as:
- `"error"` - Fails the build
- `"warn"` - Shows warning but doesn't fail
- `"off"` - Disables the rule

### Project-Specific Overrides

You can override rules for specific files or directories using the `overrides` section:

```javascript
overrides: [
  {
    files: ['**/*.test.js'],
    rules: {
      'max-lines-per-function': 'off', // Allow longer test functions
    }
  }
]
```

### Disabling Rules Temporarily

For specific lines:
```javascript
// eslint-disable-next-line max-lines-per-function
function longFunction() {
  // ... long implementation
}
```

For entire files:
```javascript
/* eslint-disable max-lines */
// ... file content
```

## Benefits of These Rules

1. **Easier Refactoring**: Smaller, focused functions are easier to move and modify
2. **Better Testing**: Simple functions with few dependencies are easier to test
3. **Improved Readability**: Consistent formatting and organization
4. **Reduced Bugs**: Many rules prevent common JavaScript pitfalls
5. **Better Performance**: React-specific rules prevent performance issues
6. **Team Consistency**: Enforced coding standards across the team

## Files That May Need Refactoring

Based on the current rules, you may need to refactor files that:
- Exceed 250 lines
- Have functions longer than 50 lines (server) or 40 lines (UI)
- Have high cyclomatic complexity
- Use outdated JavaScript patterns

The current `server/controllers/pull-request/pull-request-controller.js` file (400+ lines) would benefit from being split into smaller modules.

## Recommended Refactoring Strategies

1. **Extract Utility Functions**: Move reusable logic to separate utility files
2. **Create Service Classes**: Group related functionality into service classes
3. **Use Configuration Objects**: Replace multiple parameters with configuration objects
4. **Implement Early Returns**: Reduce nesting with guard clauses
5. **Split Large Components**: Break React components into smaller, focused components
6. **Create Custom Hooks**: Extract stateful logic into custom React hooks

## Next Steps

1. Run `npm run lint` to see current violations
2. Start with the most critical violations (errors)
3. Gradually refactor large files and functions
4. Consider adding these rules to your CI/CD pipeline
5. Train your team on the new coding standards

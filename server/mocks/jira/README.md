# Jira Mocking Service

A comprehensive mocking service for Jira API operations that follows functional programming principles. This service allows you to test Jira functionality without making actual API calls by setting an environment variable.

## Features

- **Environment-controlled**: Enable/disable via `JIRA_MOCK_MODE=true`
- **Functional Programming**: Pure functions with immutable state management
- **Complete CRUD Operations**: Create, read, update, delete issues
- **Advanced Features**: Comments, transitions, search with JQL
- **Realistic Responses**: Mock data that mimics real Jira API responses
- **Stateful**: Maintains created issues, comments, and attachments in memory

## Environment Variables

```bash
# Enable mock mode
JIRA_MOCK_MODE=true

# Disable mock mode (use real Jira API)
JIRA_MOCK_MODE=false
```

## Usage

### Basic Operations

```javascript
import { jiraMockingService } from './jira-mocking-service.js';

// Check if mock mode is enabled
const isMock = jiraMockingService.isMockMode();

// Create an issue
const issue = await jiraMockingService.createIssue({
  fields: {
    summary: 'Test Issue',
    description: 'This is a test issue',
    issuetype: { id: '10001' },
    project: { key: 'TEST' }
  }
});

// Get an issue
const retrievedIssue = await jiraMockingService.getIssue('MOCK-1001');

// Search issues
const searchResults = await jiraMockingService.searchIssues(
  'project = TEST AND status = "To Do"'
);

// Update an issue
await jiraMockingService.updateIssue('MOCK-1001', {
  fields: {
    summary: 'Updated Test Issue'
  }
});

// Add a comment
await jiraMockingService.addComment('MOCK-1001', {
  body: 'This is a test comment'
});
```

### Individual Function Imports

```javascript
import {
  createIssue,
  getIssue,
  searchIssues,
  updateIssue,
  deleteIssue,
  addComment,
  getComments,
  isMockMode
} from './jira-mocking-service.js';

// Use functions directly
if (isMockMode()) {
  const issue = await createIssue(issueData);
}
```

## Architecture

The mocking service is split into modular files following functional programming principles:

- **jira-mocking-service.js**: Main export combining all functions
- **jira-mocking-service-core.js**: Core CRUD operations
- **jira-mocking-service-extended.js**: Metadata and transition operations
- **issue-helpers.js**: Issue-related helper functions
- **metadata-helpers.js**: Metadata-related helper functions
- **mock-data.js**: Predefined mock response data
- **mock-metadata.js**: Predefined mock metadata

## Mock Data Structure

### Issues
- Auto-generated issue keys (MOCK-1001, MOCK-1002, etc.)
- Realistic field structures matching Jira API
- Support for all standard fields: summary, description, status, priority, etc.

### Comments
- Threaded comment support
- Author information
- Created/updated timestamps

### Metadata
- Project metadata with issue types
- Field configurations for create operations
- Status transitions

## Integration with Services

The mocking service is integrated into the Jira API service layer:

```javascript
// In jira-api-service.js
export const createIssue = async (payload) => {
  try {
    if (jiraMockingService.isMockMode()) {
      return await createIssueMock(payload);
    }
    return await createIssueReal(payload);
  } catch (error) {
    handleCreateIssueError(error);
  }
};
```

## Error Handling

The service provides realistic error responses:

- **400 Bad Request**: Missing required fields
- **401 Unauthorized**: Authentication errors
- **403 Forbidden**: Permission errors
- **404 Not Found**: Issue doesn't exist
- **500 Server Error**: Internal errors

## State Management

State is managed using functional programming principles:

```javascript
// Pure state functions
const getMockState = () => ({ ...mockState });
const updateMockState = (updates) => { /* immutable update */ };
const resetMockState = () => { /* reset to initial state */ };
```

## Testing Benefits

1. **No External Dependencies**: Test without connecting to Jira
2. **Consistent Data**: Predictable responses for testing
3. **Fast Execution**: No network latency
4. **Isolated Testing**: Each test starts with clean state
5. **Error Simulation**: Test error handling scenarios

## Best Practices

1. **Environment Configuration**: Always use environment variables
2. **State Reset**: Reset state between tests
3. **Validation**: Mock service validates input like real API
4. **Logging**: Includes appropriate logging for debugging
5. **Error Consistency**: Error responses match real API format

## Functional Programming Principles

- **Pure Functions**: No side effects in helper functions
- **Immutability**: State updates create new objects
- **Function Composition**: Small, composable functions
- **No Classes**: Uses functional approach instead of OOP
- **Separation of Concerns**: Each module has a specific responsibility

This mocking service provides a robust foundation for testing Jira integrations while maintaining code quality and following modern JavaScript best practices.

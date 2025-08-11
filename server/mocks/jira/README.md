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

With nock-based mocking, HTTP requests are automatically intercepted when the service is enabled:

```javascript
import { setupJiraInterceptors, enableService, isServiceActive } from './jira-nock-service.js';
import axios from 'axios';

// Enable Jira mock interceptors
setupJiraInterceptors();
enableService('jira');

// Check if service is active
const isActive = isServiceActive('jira');

// Make regular HTTP requests - they will be intercepted by nock
const baseUrl = 'https://mock-jira.atlassian.net/rest/api/2';

// Create an issue (will be intercepted)
const createResponse = await axios.post(`${baseUrl}/issue`, {
  fields: {
    summary: 'Test Issue',
    description: 'This is a test issue',
    issuetype: { id: '10001' },
    project: { key: 'MOCK' }
  }
});

// Get an issue (will be intercepted)
const getResponse = await axios.get(`${baseUrl}/issue/MOCK-1001`);

// Search issues (will be intercepted)
const searchResponse = await axios.post(`${baseUrl}/search`, {
  jql: 'project = MOCK AND status = "To Do"'
});

// Update an issue (will be intercepted)
await axios.put(`${baseUrl}/issue/MOCK-1001`, {
  fields: {
    summary: 'Updated Test Issue'
  }
});

// Add a comment (will be intercepted)
await axios.post(`${baseUrl}/issue/MOCK-1001/comment`, {
  body: 'This is a test comment'
});
```

### Service Management

```javascript
import {
  setupJiraInterceptors,
  enableService,
  disableService,
  isServiceActive,
  clearInterceptors
} from './jira-nock-service.js';

// Use functions directly
if (isMockMode()) {
  const issue = await createIssue(issueData);
}
```

## Architecture

The nock-based mocking service is split into modular files following functional programming principles:

- **jira-nock-service.js**: Main export combining all functions and interceptors
- **jira-mock-interceptors.js**: Core HTTP request interceptors for CRUD operations
- **jira-transition-interceptors.js**: Interceptors for transitions and metadata endpoints
- **jira-mock-helpers.js**: Helper functions for mock data manipulation
- **jira-mock-data.js**: Immutable mock data structures and state management
- **issue-helpers.js**: Issue-related helper functions
- **metadata-helpers.js**: Metadata-related helper functions
- **mock-metadata.js**: Predefined mock metadata responses

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

The nock-based mocking service integrates seamlessly with existing HTTP clients:

```javascript
// In jira-api-service.js - no changes needed!
export const createIssue = async (payload) => {
  try {
    // Just make the HTTP request - nock will intercept if enabled
    const baseUrl = EnvironmentConfig.getBaseUrl();
    const headers = EnvironmentConfig.getAuthHeaders();
    const response = await axios.post(`${baseUrl}/issue`, payload, { headers });
    return response.data;
  } catch (error) {
    // Handle errors normally
  }
};

// Enable mocking in test setup or specific endpoints
import { setupJiraInterceptors, enableService } from '../mocks/jira/jira-nock-service.js';

// Setup once, then all HTTP requests are intercepted
setupJiraInterceptors();
enableService('jira');
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

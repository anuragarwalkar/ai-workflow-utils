# Nock-Based Mock System

A comprehensive functional programming approach to HTTP request mocking using
nock. This system allows you to mock any external service API calls across your
entire application.

## Overview

The system is built with functional programming principles:

- Immutable state management
- Pure functions for all operations
- Composable interceptor functions
- No classes or object-oriented patterns

## Quick Start

### Basic Setup

```javascript
import { enableMockingForFeature, testUtils } from "./server/mocks/index.js";

// Enable Jira mocking for a feature
const mockContext = enableMockingForFeature(["jira"]);

// Your feature code here...

// Disable when done
mockContext.disable();
```

### Environment-Based Mocking

Set environment variables:

```bash
# Enable all mocking
MOCK_MODE=true

# Enable specific services
MOCK_SERVICES=jira,email
```

The system will automatically enable mocking based on these variables.

## Core Functions

### Service Management

```javascript
import {
  registerService,
  enableService,
  disableService,
  enableAll,
  disableAll,
  isServiceActive,
  getActiveServices,
} from "./server/mocks/core/nock-mock-service.js";

// Register a new service
registerService("myService", myMockService);

// Enable specific service
enableService("jira", { customConfig: true });

// Check if service is active
if (isServiceActive("jira")) {
  console.log("Jira mocking is active");
}

// Get all active services
const active = getActiveServices(); // ['jira', 'email']
```

### Global Controls

```javascript
import {
  setGlobalMockMode,
  isGlobalMockMode,
  cleanAll,
  getCurrentState,
} from "./server/mocks/core/nock-mock-service.js";

// Enable global mocking
setGlobalMockMode(true);

// Clean all interceptors
cleanAll();

// Get current state
const state = getCurrentState();
```

## Creating Custom Mock Services

### 1. Define Mock Data

```javascript
// my-service-data.js
export const mockData = {
  users: new Map(),
  posts: new Map(),
};

let serviceState = {
  userCounter: 1,
  postCounter: 1,
};

export const getServiceState = () => ({ ...serviceState });
export const updateServiceState = updates => {
  serviceState = { ...serviceState, ...updates };
  return getServiceState();
};
```

### 2. Create Helper Functions

```javascript
// my-service-helpers.js
import { generateId } from "../core/nock-mock-service.js";
import {
  mockData,
  getServiceState,
  updateServiceState,
} from "./my-service-data.js";

export const createMockUser = userData => {
  const state = getServiceState();
  const userId = generateId("USER");

  const user = {
    id: userId,
    name: userData.name,
    email: userData.email,
    created: new Date().toISOString(),
  };

  mockData.users.set(userId, user);
  updateServiceState({ userCounter: state.userCounter + 1 });

  return user;
};
```

### 3. Setup Interceptors

```javascript
// my-service-interceptors.js
import {
  createScope,
  validateRequiredFields,
} from "../core/nock-mock-service.js";
import { createMockUser } from "./my-service-helpers.js";

export const setupUserInterceptors = baseURL => {
  const interceptors = [];

  // Create user
  const createUserInterceptor = createScope(baseURL)
    .post("/api/users")
    .reply(async (uri, requestBody) => {
      const validation = validateRequiredFields(requestBody, ["name", "email"]);
      if (!validation.isValid) {
        return [400, { error: validation.message }];
      }

      const user = createMockUser(requestBody);
      return [201, user];
    })
    .persist();

  interceptors.push(createUserInterceptor);
  return interceptors;
};
```

### 4. Create the Service

```javascript
// my-service.js
import { createMockService } from "../core/nock-mock-service.js";
import { setupUserInterceptors } from "./my-service-interceptors.js";

const setupMyServiceInterceptors = (baseURL, config = {}) => {
  const allInterceptors = [
    ...setupUserInterceptors(baseURL),
    // Add more interceptor groups here
  ];

  return allInterceptors;
};

export const myMockService = createMockService(
  "myService",
  "https://api.myservice.com",
  setupMyServiceInterceptors
);
```

### 5. Register the Service

```javascript
// In your main mock setup
import { registerService } from "../core/nock-mock-service.js";
import { myMockService } from "./my-service/my-service.js";

registerService("myService", myMockService);
```

## Usage Patterns

### In Tests

```javascript
import { testUtils } from "./server/mocks/index.js";

describe("Feature Tests", () => {
  let mockContext;

  beforeEach(() => {
    // Setup mocks for this test suite
    mockContext = testUtils.setupMocks(["jira", "email"]);
  });

  afterEach(() => {
    // Clean up mocks
    testUtils.teardownMocks();
  });

  it("should create a Jira issue", async () => {
    // Your test code here
    // Jira API calls will be intercepted and mocked

    // Verify mock state if needed
    const state = testUtils.verifyMockState(["jira"]);
    expect(state.isValid).toBe(true);
  });
});
```

### In Development

```javascript
import { devUtils } from "./server/mocks/index.js";

// Enable all mocks for development
devUtils.enableAllForDev();

// Check status
console.log(devUtils.getStatus());

// Toggle specific service
devUtils.toggleService("jira");
```

### In Feature Code

```javascript
import { enableMockingForFeature } from "./server/mocks/index.js";

const featureMocking = enableMockingForFeature(["jira"], {
  jira: {
    customInterceptors: [
      // Add feature-specific interceptors
    ],
  },
});

// Your feature code that makes API calls
async function myFeature() {
  // These calls will be mocked if mocking is enabled
  const response = await fetch(
    "https://mock-jira.atlassian.net/rest/api/2/issue",
    {
      method: "POST",
      body: JSON.stringify({ fields: { summary: "Test Issue" } }),
    }
  );

  return response.json();
}

// Clean up when feature is done
featureMocking.disable();
```

## Available Mock Services

### Jira Mock Service

```javascript
import { jiraMockService } from "./server/mocks/jira/jira-nock-service.js";

// Available functions
import {
  createMockIssue,
  createMockComment,
  searchIssues,
  getJiraState,
  updateJiraState,
  mockData,
} from "./server/mocks/jira/jira-nock-service.js";
```

Supports:

- Issue creation, retrieval, and updates
- Comments
- Project management
- Search with JQL
- Metadata (issue types, priorities, statuses, users)

### Email Mock Service

```javascript
import { emailMockService } from "./server/mocks/email/email-mock-service.js";

// Available functions
import {
  createMockEmail,
  getEmailState,
  updateEmailState,
} from "./server/mocks/email/email-mock-service.js";
```

Supports:

- Email sending
- Sent email tracking

## Best Practices

### 1. State Management

- Always use the provided state management functions
- Never mutate state directly
- Use pure functions for all operations

### 2. Error Handling

- Use `validateRequiredFields` for request validation
- Return appropriate HTTP status codes
- Provide meaningful error messages

### 3. Interceptor Organization

- Group related interceptors in separate functions
- Keep interceptor functions focused and small
- Use descriptive names for interceptors

### 4. Testing

- Always clean up mocks after tests
- Verify mock state when needed
- Use feature-specific mocking for isolation

### 5. Development

- Use environment variables for automatic mocking
- Enable logging to debug mock behavior
- Toggle services as needed during development

## Configuration

### Environment Variables

```bash
# Global mock mode
MOCK_MODE=true

# Specific services
MOCK_SERVICES=jira,email,myService

# Service-specific config (if needed)
JIRA_MOCK_URL=https://custom-jira.mock.com
```

### Programmatic Configuration

```javascript
const config = {
  jira: {
    customInterceptors: [],
    baseURL: "https://custom-jira.mock.com",
  },
  email: {
    defaultFrom: "custom@mock.com",
  },
};

enableAll(config);
```

## Debugging

### Check Mock State

```javascript
import {
  getCurrentState,
  getActiveServices,
} from "./server/mocks/core/nock-mock-service.js";

const state = getCurrentState();
console.log("Active services:", getActiveServices());
console.log("Total interceptors:", state.interceptors.size);
```

### Verify Mock Activity

```javascript
import { testUtils } from "./server/mocks/index.js";

const verification = testUtils.verifyMockState(["jira", "email"]);
if (!verification.isValid) {
  console.log("Missing services:", verification.missingServices);
  console.log("Extra services:", verification.extraServices);
}
```

### Enable Debug Logging

The system uses the application's logger. Enable debug level to see mock
activity:

```javascript
import logger from "./server/logger.js";
logger.level = "debug";
```

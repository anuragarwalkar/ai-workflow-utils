# Quick Start Guide: Nock-Based Mocking System

## 🚀 Immediate Setup (30 seconds)

### 1. Enable Environment-Based Mocking

Add to your `.env` file:

```bash
# Enable all mocking
MOCK_MODE=true

# OR enable specific services
MOCK_SERVICES=jira,email
```

### 2. Import in Your Main Server File

```javascript
// server.js or app.js
import "./server/mocks/index.js"; // Auto-initializes mocking
```

That's it! All HTTP requests to registered services will now be mocked
automatically.

## 📝 Basic Usage Examples

### Feature Development

```javascript
import { enableMockingForFeature } from "./server/mocks/index.js";

// Your feature function
export const createIssueFeature = async () => {
  const mockContext = enableMockingForFeature(["jira"]);

  try {
    // This call will be automatically mocked
    const response = await fetch(
      "https://your-jira.atlassian.net/rest/api/2/issue",
      {
        method: "POST",
        body: JSON.stringify({
          fields: {
            project: { key: "MOCK" },
            summary: "My test issue",
            issuetype: { id: "10001" },
          },
        }),
      }
    );

    return response.json(); // Returns mocked Jira response
  } finally {
    mockContext.disable();
  }
};
```

### Testing

```javascript
import { testUtils } from "./server/mocks/index.js";

describe("My Tests", () => {
  beforeEach(() => {
    testUtils.setupMocks(["jira", "email"]);
  });

  afterEach(() => {
    testUtils.teardownMocks();
  });

  it("creates issue", async () => {
    const result = await createIssueFeature();
    expect(result.key).toMatch(/MOCK-\d+/);
  });
});
```

## 🛠 Available Mock Services

### Jira (Ready to Use)

- ✅ Issue creation, updates, retrieval
- ✅ Comments
- ✅ Search with JQL
- ✅ Projects, users, metadata

### Email (Ready to Use)

- ✅ Send emails
- ✅ Track sent emails

### Extend for Any Service

See `server/mocks/README.md` for creating custom services.

## 🔧 Advanced Usage

### Conditional Mocking

```javascript
// Only mock in development
if (process.env.NODE_ENV === "development") {
  enableMockingForFeature(["jira"]);
}
```

### Custom Interceptors

```javascript
import { createScope } from "./server/mocks/core/nock-mock-service.js";

const customInterceptor = createScope("https://my-api.com")
  .get("/special-endpoint")
  .reply(200, { custom: "response" });
```

### Debug Mock State

```javascript
import { debugMockState } from "./server/mocks/examples/integration-example.js";
debugMockState(); // Logs current mock status
```

## 🎯 Key Benefits

- **Zero Code Changes**: Your existing API calls work unchanged
- **Functional Programming**: Pure functions, immutable state
- **Feature-Specific**: Mock only what you need, when you need it
- **Environment-Aware**: Automatic enabling based on env vars
- **Test-Friendly**: Built-in test utilities
- **Extensible**: Easy to add new services

## 📚 Next Steps

1. **Read Full Documentation**: `server/mocks/README.md`
2. **See Migration Guide**: `server/mocks/examples/migration-example.js`
3. **View Integration Examples**: `server/mocks/examples/integration-example.js`
4. **Create Custom Services**: Follow patterns in `server/mocks/email/`

## 🐛 Troubleshooting

**Mocking not working?**

```javascript
import {
  getActiveServices,
  isGlobalMockMode,
} from "./server/mocks/core/nock-mock-service.js";
console.log("Active services:", getActiveServices());
console.log("Global mock mode:", isGlobalMockMode());
```

**Need to disable temporarily?**

```javascript
import { disableAll } from "./server/mocks/core/nock-mock-service.js";
disableAll();
```

**Want to see what's intercepted?** Enable debug logging in your logger
configuration.

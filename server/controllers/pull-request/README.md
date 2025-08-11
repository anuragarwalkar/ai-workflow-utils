# PR Controller Module

This module provides a modular, maintainable structure for Pull Request
operations in the AI Workflow Utils application.

## Architecture

The PR Controller has been refactored from a single 1064-line file into a
modular structure with clear separation of concerns:

```
pr/
├── prController.js          # Main controller (orchestrates operations)
├── index.js                 # Module exports
├── README.md               # This documentation
├── models/
│   └── PullRequest.js      # PR data model and validation
├── services/
│   ├── bitbucketService.js    # Bitbucket API operations
│   ├── diffProcessorService.js # Diff processing coordination
│   ├── prContentService.js    # AI-powered PR content generation
│   └── streamingService.js    # Server-Sent Events handling
├── processors/
│   ├── unidiffProcessor.js        # Unidiff format processing
│   ├── bitbucketDiffProcessor.js  # Bitbucket diff format processing
│   └── legacyDiffProcessor.js     # Legacy diff format processing
└── utils/
    ├── constants.js           # Module constants
    ├── environmentConfig.js   # Environment configuration
    ├── errorHandler.js        # Error handling utilities
    └── templateService.js     # Template management
```

## Modules Overview

### Controllers

- **prController.js**: Main controller that orchestrates PR operations using
  various services

### Models

- **PullRequest.js**: Data model for pull requests with validation and payload
  generation

### Services

- **bitbucketService.js**: Handles all Bitbucket API interactions
- **diffProcessorService.js**: Coordinates different diff processors and builds
  review data
- **prContentService.js**: AI-powered content generation for PR titles and
  descriptions
- **streamingService.js**: Server-Sent Events utilities for real-time updates

### Processors

- **unidiffProcessor.js**: Processes unified diff format (most accurate)
- **bitbucketDiffProcessor.js**: Processes Bitbucket-specific diff format
- **legacyDiffProcessor.js**: Handles legacy/fallback diff formats

### Utilities

- **constants.js**: Module-wide constants and configuration
- **environmentConfig.js**: Environment variable management
- **errorHandler.js**: Standardized error handling
- **templateService.js**: Template management for AI operations

## Key Features

### 🔧 Modular Design

- Each module has a single responsibility
- Easy to test individual components
- Clear separation of concerns

### 🚀 Backward Compatibility

- Maintains the same API interface
- Existing routes continue to work
- Gradual migration path

### 🎯 Error Handling

- Centralized error handling
- Consistent error responses
- Proper logging throughout

### 🤖 AI Integration

- LangChain service integration
- Structured output support
- Multiple AI provider support

### 📡 Real-time Updates

- Server-Sent Events for streaming
- Progress updates during operations
- Clean streaming utilities

## Usage

### Basic Usage

```javascript
import { PRController } from "./controllers/pr/index.js";

// Use the controller methods
app.get("/api/pr/:projectKey/:repoSlug", PRController.getPullRequests);
app.get(
  "/api/pr/:projectKey/:repoSlug/:pullRequestId/diff",
  PRController.getPullRequestDiff
);
app.post("/api/pr/review", PRController.reviewPullRequest);
app.post("/api/pr/create", PRController.createPullRequest);
app.post("/api/pr/preview", PRController.streamPRPreview);
```

### Using Individual Services

```javascript
import { BitbucketService, PRContentService } from "./controllers/pr/index.js";

// Get commits directly
const commits = await BitbucketService.getCommitMessages(
  projectKey,
  repoSlug,
  branchName
);

// Generate PR content
const content = await PRContentService.generatePRContentStructured(
  commits,
  ticketNumber,
  branchName,
  onProgress
);
```

### Using Models

```javascript
import { PullRequest } from "./controllers/pr/index.js";

// Create and validate PR data
const pr = new PullRequest({
  title: "feat: Add new feature",
  description: "This PR adds a new feature",
  fromBranch: "feature/new-feature",
  projectKey: "PROJ",
  repoSlug: "repo",
});

// Get Bitbucket payload
const payload = pr.toBitbucketPayload();
```

## Migration from Original Controller

The modular version maintains full backward compatibility. To migrate:

1. **Immediate**: Update imports to use the new modular structure

```javascript
// Old
import prController from "./controllers/prController.js";

// New
import { PRController } from "./controllers/pr/index.js";
```

2. **Gradual**: Start using individual services for new features

```javascript
import { BitbucketService, PRContentService } from "./controllers/pr/index.js";
```

3. **Complete**: Eventually replace route handlers with modular controller
   methods

## Testing Strategy

Each module can be tested independently:

- **Unit Tests**: Test individual processors, services, and utilities
- **Integration Tests**: Test controller methods and service interactions
- **API Tests**: Test the complete request/response cycle

## Performance Benefits

- **Reduced Memory**: Only load required modules
- **Better Caching**: Smaller, focused modules cache better
- **Easier Optimization**: Optimize individual components
- **Parallel Development**: Teams can work on different modules

## Contributing

When adding new functionality:

1. **Identify the right module**: Services for business logic, processors for
   data transformation, utils for common functionality
2. **Follow naming conventions**: Use descriptive names and consistent patterns
3. **Add proper error handling**: Use the ErrorHandler utility
4. **Document changes**: Update this README and add inline documentation
5. **Maintain backward compatibility**: Ensure existing APIs continue to work

## Future Enhancements

Potential improvements with this modular structure:

- **Caching Layer**: Add caching service for frequently accessed data
- **Validation Service**: Enhanced input validation and sanitization
- **Audit Service**: Track PR operations for compliance
- **Plugin System**: Allow custom processors and services
- **Performance Monitoring**: Add metrics and monitoring per module

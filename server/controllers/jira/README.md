# Jira Controller Module

## Overview
The Jira controller module manages all Jira-related operations including issue creation, file uploads, AI-powered content generation, and issue retrieval. It follows a modular architecture with clear separation of concerns.

## Architecture

### Components
- **JiraController**: Main orchestrator handling HTTP requests and responses
- **Services**: Business logic for Jira operations
- **Models**: Data validation and payload generation
- **Processors**: Data transformation utilities
- **Utils**: Common utilities and configuration

### Module Structure
```
jira/
├── jiraController.js          # Main orchestrator
├── index.js                   # Module exports
├── README.md                  # This documentation
├── models/
│   ├── JiraIssue.js          # Issue data model and validation
│   └── JiraAttachment.js     # Attachment data model
├── services/
│   ├── jiraApiService.js     # External Jira API interactions
│   ├── jiraContentService.js # AI-powered content generation
│   ├── jiraAttachmentService.js # File upload handling
│   └── jiraSummaryService.js # Summary fetching operations
├── processors/
│   ├── customFieldProcessor.js # Custom field data processing
│   └── attachmentProcessor.js  # File processing utilities
└── utils/
    ├── constants.js          # Jira-specific constants
    ├── environmentConfig.js  # Configuration management
    ├── errorHandler.js       # Error handling utilities
    └── validationUtils.js    # Input validation helpers
```

## API Endpoints
- `POST /api/jira/preview` - Generate AI-powered issue previews
- `POST /api/jira/create` - Create new Jira issues
- `POST /api/jira/upload` - Upload attachments to issues
- `GET /api/jira/issue/:id` - Retrieve issue details
- `POST /api/jira/summaries` - Fetch issue summaries

## Usage Examples

### Import Full Controller
```javascript
import { JiraController } from './controllers/jira/index.js';
```

### Import Specific Services
```javascript
import { JiraApiService, JiraContentService } from './controllers/jira/index.js';
```

### Import Utilities
```javascript
import { ErrorHandler, EnvironmentConfig } from './controllers/jira/index.js';
```

## Dependencies
- LangChain for AI content generation
- Axios for HTTP requests
- Multer for file uploads
- FormData for multipart requests

## Configuration
All Jira configuration is managed through environment settings:
- `JIRA_URL`: Base URL for Jira instance
- `JIRA_TOKEN`: API authentication token

# API Documentation

## Overview
The AI Workflow Utils API provides RESTful endpoints for managing Jira issues, pull requests, emails, templates, environment settings, and build operations.

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: Configured via environment settings

## Authentication
API endpoints use environment-based authentication with API keys stored securely in the configuration system.

## Common Response Format
All API responses follow a consistent structure:

```json
{
  "success": true|false,
  "data": {},
  "message": "Optional message",
  "error": "Error details (if success is false)"
}
```

## API Endpoints

### Jira API

#### Generate Jira Preview
Generate a preview of Jira issue content using AI.

**Endpoint**: `POST /api/jira/preview`

**Request Body**:
```json
{
  "prompt": "User description of the issue",
  "imageData": "base64-encoded image (optional)",
  "template": "Template content with variables",
  "issueType": "Bug|Task|Story|etc"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "summary": "Generated issue summary",
    "description": "Generated issue description",
    "issueType": "Bug",
    "priority": "Medium"
  }
}
```

#### Create Jira Issue
Create a new Jira issue with the generated content.

**Endpoint**: `POST /api/jira/create`

**Request Body**:
```json
{
  "summary": "Issue summary",
  "description": "Issue description",
  "issueType": "Bug",
  "priority": "Medium",
  "projectKey": "PROJ"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "issueKey": "PROJ-123",
    "issueId": "10001",
    "url": "https://jira.example.com/browse/PROJ-123"
  }
}
```

#### Fetch Jira Issue
Retrieve details of an existing Jira issue.

**Endpoint**: `GET /api/jira/:issueKey`

**Response**:
```json
{
  "success": true,
  "data": {
    "key": "PROJ-123",
    "summary": "Issue summary",
    "description": "Issue description",
    "status": "Open",
    "assignee": "user@example.com",
    "created": "2025-01-22T00:00:00Z",
    "updated": "2025-01-22T00:00:00Z"
  }
}
```

#### Upload Attachment
Upload a file attachment to a Jira issue.

**Endpoint**: `POST /api/jira/upload`

**Request**: Multipart form data
- `file`: File to upload
- `issueKey`: Jira issue key
- `fileName`: Original file name

**Response**:
```json
{
  "success": true,
  "data": {
    "attachmentId": "10001",
    "fileName": "screenshot.png",
    "size": 1024,
    "url": "https://jira.example.com/attachment/10001"
  }
}
```

### Template API

#### List Templates
Retrieve all available templates.

**Endpoint**: `GET /api/templates`

**Query Parameters**:
- `issueType` (optional): Filter by issue type
- `active` (optional): Filter by active status

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "default-bug",
      "name": "Default Bug Template",
      "issueType": "Bug",
      "content": "Template content with {variables}",
      "variables": ["prompt", "imageReference", "imageContext"],
      "isDefault": true,
      "isActive": true,
      "createdAt": "2025-01-22T00:00:00Z",
      "updatedAt": "2025-01-22T00:00:00Z"
    }
  ]
}
```

#### Create Template
Create a new template.

**Endpoint**: `POST /api/templates`

**Request Body**:
```json
{
  "name": "Custom Bug Template",
  "issueType": "Bug",
  "content": "Template content with {prompt} and {imageContext}",
  "isActive": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "template-1234567890",
    "name": "Custom Bug Template",
    "issueType": "Bug",
    "content": "Template content with {prompt} and {imageContext}",
    "variables": ["prompt", "imageContext"],
    "isDefault": false,
    "isActive": true,
    "createdAt": "2025-01-22T00:00:00Z",
    "updatedAt": "2025-01-22T00:00:00Z"
  },
  "message": "Template created successfully"
}
```

#### Update Template
Update an existing template.

**Endpoint**: `PUT /api/templates/:id`

**Request Body**:
```json
{
  "name": "Updated Template Name",
  "content": "Updated template content",
  "isActive": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "template-1234567890",
    "name": "Updated Template Name",
    "issueType": "Bug",
    "content": "Updated template content",
    "variables": ["prompt"],
    "isDefault": false,
    "isActive": false,
    "createdAt": "2025-01-22T00:00:00Z",
    "updatedAt": "2025-01-22T01:00:00Z"
  },
  "message": "Template updated successfully"
}
```

#### Delete Template
Delete a template.

**Endpoint**: `DELETE /api/templates/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "template-1234567890",
    "name": "Deleted Template"
  },
  "message": "Template deleted successfully"
}
```

### Environment Settings API

#### Get Environment Settings
Retrieve current environment configuration.

**Endpoint**: `GET /api/environment-settings`

**Response**:
```json
{
  "success": true,
  "data": {
    "jira": {
      "JIRA_URL": {
        "value": "https://jira.example.com",
        "label": "Jira URL",
        "description": "Your Jira instance URL",
        "type": "url",
        "required": false,
        "sensitive": false
      },
      "JIRA_TOKEN": {
        "value": "********",
        "label": "Jira API Token",
        "description": "Your Jira API token",
        "type": "string",
        "required": false,
        "sensitive": true
      }
    },
    "openai": {
      "OPENAI_COMPATIBLE_BASE_URL": {
        "value": "https://api.anthropic.com",
        "label": "AI API Base URL",
        "description": "AI API base URL",
        "type": "url",
        "required": false,
        "sensitive": false,
        "default": "https://api.anthropic.com"
      }
    }
  }
}
```

#### Update Environment Settings
Update environment configuration.

**Endpoint**: `PUT /api/environment-settings`

**Request Body**:
```json
{
  "JIRA_URL": "https://new-jira.example.com",
  "OPENAI_COMPATIBLE_API_KEY": "new-api-key",
  "ai_provider": "anthropic"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated configuration object
  },
  "message": "Environment settings updated successfully"
}
```

#### Get Provider Configuration
Get available provider options and current selections.

**Endpoint**: `GET /api/environment-settings/config`

**Response**:
```json
{
  "success": true,
  "data": {
    "ai": {
      "title": "AI Provider Configuration",
      "description": "Choose your preferred AI provider",
      "primary": true,
      "default": "ollama",
      "options": [
        {
          "value": "anthropic",
          "label": "Anthropic Claude (Recommended)",
          "section": "openai",
          "available": true
        }
      ],
      "currentSelection": "anthropic"
    }
  }
}
```

#### Get Provider Status
Get the configuration status of all providers.

**Endpoint**: `GET /api/environment-settings/providers`

**Response**:
```json
{
  "success": true,
  "data": {
    "openai_compatible": {
      "name": "OpenAI Compatible (anthropic/Claude)",
      "configured": true,
      "status": "ready"
    },
    "jira": {
      "name": "Jira",
      "configured": true,
      "status": "ready"
    }
  }
}
```

### Pull Request API

#### Create Pull Request
Create a new pull request.

**Endpoint**: `POST /api/pr/create`

**Request Body**:
```json
{
  "title": "PR title",
  "description": "PR description",
  "sourceBranch": "feature/new-feature",
  "targetBranch": "main",
  "repositoryId": "repo-id"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "prId": "123",
    "url": "https://bitbucket.example.com/pull-request/123",
    "title": "PR title",
    "status": "OPEN"
  }
}
```

#### List Pull Requests
Retrieve pull requests for a repository.

**Endpoint**: `GET /api/pr/list`

**Query Parameters**:
- `repositoryId`: Repository identifier
- `status`: PR status filter (OPEN, MERGED, DECLINED)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123",
      "title": "PR title",
      "description": "PR description",
      "status": "OPEN",
      "author": "user@example.com",
      "created": "2025-01-22T00:00:00Z",
      "updated": "2025-01-22T00:00:00Z"
    }
  ]
}
```

### Email API

#### Send Email
Send an email using the configured SMTP settings.

**Endpoint**: `POST /api/email/send`

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Email subject",
  "body": "Email body content",
  "attachments": [
    {
      "filename": "document.pdf",
      "content": "base64-encoded-content"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messageId": "message-id-123",
    "status": "sent"
  },
  "message": "Email sent successfully"
}
```

### Build API

#### Trigger Build
Trigger a build process.

**Endpoint**: `POST /api/build/trigger`

**Request Body**:
```json
{
  "buildType": "release|debug",
  "environment": "production|staging|development",
  "options": {
    "clean": true,
    "tests": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "buildId": "build-123",
    "status": "started",
    "estimatedDuration": "5 minutes"
  }
}
```

#### Get Build Status
Get the status of a build process.

**Endpoint**: `GET /api/build/status/:buildId`

**Response**:
```json
{
  "success": true,
  "data": {
    "buildId": "build-123",
    "status": "running|completed|failed",
    "progress": 75,
    "logs": ["Build step 1 completed", "Build step 2 in progress"],
    "startTime": "2025-01-22T00:00:00Z",
    "endTime": null
  }
}
```

### Chat API

#### Send Chat Message
Send a message to the AI chat interface.

**Endpoint**: `POST /api/chat/message`

**Request Body**:
```json
{
  "message": "User message",
  "context": "Optional context",
  "sessionId": "chat-session-123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "response": "AI response",
    "sessionId": "chat-session-123",
    "messageId": "msg-123"
  }
}
```

#### Get Chat History
Retrieve chat history for a session.

**Endpoint**: `GET /api/chat/history/:sessionId`

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "chat-session-123",
    "messages": [
      {
        "id": "msg-1",
        "type": "user",
        "content": "User message",
        "timestamp": "2025-01-22T00:00:00Z"
      },
      {
        "id": "msg-2",
        "type": "assistant",
        "content": "AI response",
        "timestamp": "2025-01-22T00:01:00Z"
      }
    ]
  }
}
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request validation failed
- `AUTHENTICATION_ERROR`: Authentication failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `EXTERNAL_API_ERROR`: External service error
- `INTERNAL_ERROR`: Internal server error

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error
- `502`: Bad Gateway (External API error)

## Rate Limiting
API endpoints are rate-limited to prevent abuse:
- **Default**: 100 requests per minute per IP
- **File Upload**: 10 requests per minute per IP
- **AI Generation**: 20 requests per minute per IP

## File Upload Specifications

### Supported File Types
- **Images**: PNG, JPG, JPEG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Archives**: ZIP, RAR

### File Size Limits
- **Images**: 10MB maximum
- **Documents**: 25MB maximum
- **Archives**: 50MB maximum

### Upload Process
1. Files are uploaded to `/uploads` directory
2. File validation and virus scanning
3. Metadata extraction and storage
4. Cleanup of temporary files

## WebSocket Events (Chat)

### Connection
```javascript
const socket = io('/chat');
```

### Events
- `message`: New chat message
- `typing`: User typing indicator
- `session_created`: New chat session
- `session_ended`: Chat session ended
- `error`: Error occurred

## API Versioning
Current API version: `v1`
- Version is included in the URL path: `/api/v1/`
- Backward compatibility maintained for one major version
- Deprecation notices provided 6 months before removal

## SDK and Client Libraries
Official client libraries available for:
- **JavaScript/TypeScript**: NPM package
- **Python**: PyPI package

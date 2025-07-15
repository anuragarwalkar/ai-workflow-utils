# AI Workflow Utils

<img width="1512" height="777" alt="image" src="https://github.com/user-attachments/assets/ed5e180a-da5b-4856-b984-e3c9c1bd58e4" />
<img width="1510" height="780" alt="image" src="https://github.com/user-attachments/assets/95ced2b4-d64b-4a5e-84d0-92362b414ea2" />
<img width="1511" height="778" alt="image" src="https://github.com/user-attachments/assets/134b3acd-7ff4-43b5-9397-2f4811be446c" />
<img width="1512" height="774" alt="image" src="https://github.com/user-attachments/assets/909afe74-5348-4c6b-82f0-e7ff0bc60cf2" />
<img width="1511" height="780" alt="image" src="https://github.com/user-attachments/assets/6781d64d-542d-4253-8e5b-00c10b436c7c" />

## 🚀 Overview

AI Workflow Utils is a comprehensive automation platform that streamlines software development workflows by integrating AI-powered content generation with popular development tools. The application provides intelligent automation for Jira ticket creation, build management, email notifications, and more.

## ✨ Key Features

### 🎯 **AI-Powered Jira Automation**
- **Real-time Streaming Generation**: Watch AI generate Jira content in real-time with ChatGPT-like streaming interface
- **Multi-format Support**: Create Tasks, Bugs, and User Stories with appropriate templates
- **Image Analysis**: Upload screenshots and let AI analyze them to generate detailed issue descriptions
- **Smart Content Generation**: AI automatically formats content with proper sections (Steps to Reproduce, Acceptance Criteria, etc.)
- **Dual AI Provider System**: Automatic fallback between cloud and local AI providers

### 🔧 **Build & Release Management**
- **Automated Build Processes**: Streamline your CI/CD workflows
- **Release Management**: Coordinate releases across multiple environments
- **Build Status Monitoring**: Real-time build progress tracking

### 📧 **Email Automation**
- **Smart Email Generation**: AI-powered email composition for various scenarios
- **Template Management**: Pre-built templates for common communication needs
- **Automated Notifications**: Keep stakeholders informed automatically

### 🔗 **Integration Capabilities**
- **Jira Integration**: Full CRUD operations with Jira tickets
- **Bitbucket Integration**: Automated pull request creation
- **File Management**: Support for various file formats including video conversion
- **API Integrations**: Extensible architecture for additional tool integrations

## 🏗️ Architecture

### **Frontend (React + Redux)**
- **Modern React**: Built with React 18 and functional components
- **State Management**: Redux Toolkit with RTK Query for efficient data fetching
- **Material-UI**: Professional, responsive UI components
- **Real-time Updates**: WebSocket integration for live updates
- **Streaming Support**: Custom streaming implementation for real-time AI responses

### **Backend (Node.js + Express + Webpack)**
- **Modern Express Framework**: Latest Express.js with ES6 modules
- **Webpack Build System**: ES6 import/export syntax with Babel transpilation
- **RESTful API**: Clean, well-documented API endpoints with proper namespacing
- **Streaming Support**: Server-Sent Events (SSE) for real-time data streaming
- **File Processing**: Advanced file handling with format conversion
- **Error Handling**: Comprehensive error handling and logging
- **Modular Architecture**: Clean separation of concerns with middleware patterns
- **Rate Limiting**: Built-in request rate limiting for security
- **Request Logging**: Comprehensive request/response logging
- **Centralized Configuration**: Environment variables managed through centralized config files

### **AI Integration**
- **Multi-Provider Support**: OpenAI Compatible APIs + Ollama
- **Streaming Responses**: Real-time content generation
- **Intelligent Fallbacks**: Automatic provider switching
- **Context-Aware**: Maintains conversation context for better results

## 🛠️ Prerequisites

### **Required**
- Node.js (v16 or higher)
- npm or yarn package manager
- Jira account with API access

### **AI Providers**
- **Primary**: OpenAI Compatible API server (e.g., OpenAI, Anthropic)
- **Fallback**: [Ollama](https://ollama.com/) for local AI processing
  ```bash
  # Install Ollama
  brew install ollama  # macOS
  # or download from https://ollama.com/
  ```

### **Optional Integrations**
- Bitbucket account for pull request automation
- SMTP server for email functionality

## 🚀 Quick Start

### 1. **Clone and Install**
```bash
git clone <repository-url>
cd ai-workflow-utils
npm install
```

### 2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env
cp ui/.env.example ui/.env
```

### 3. **Configure Environment Variables**

**Server Configuration (.env):**
```env
# Jira Configuration
JIRA_URL=https://your-company.atlassian.net
JIRA_TOKEN=your-jira-api-token

# Primary AI Provider (OpenAI Compatible)
OPENAI_COMPATIBLE_BASE_URL=https://api.clients.geai.globant.com
OPENAI_COMPATIBLE_API_KEY=your-api-key
OPENAI_COMPATIBLE_MODEL=vertex_ai/claude-sonnet-4-20250514

# Fallback AI Provider (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llava

# Bitbucket Integration (Optional)
BITBUCKET_AUTHORIZATION_TOKEN=your-bitbucket-token
BIT_BUCKET_URL=https://bitbucket.your-company.com

# Email Configuration (Optional)
SMTP_HOST=smtp.your-company.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-email-password

# Server Configuration
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

**Client Configuration (ui/.env):**
```env
# API Base URL for client-side requests
VITE_API_BASE_URL=http://localhost:3000

# Pull Request Configuration
VITE_PR_CREATION_REPO_KEY=your-repo-key
VITE_PR_CREATION_REPO_SLUG=your-repo-slug
VITE_GIT_REPOS=example-1,example-2
```

### 4. **Build and Start the Application**
```bash
# Build the backend with webpack (ES6 modules)
npm run build-server

# Start backend server (from built files)
npm run start-server

# For development with auto-rebuild
npm run dev-server

# Start frontend (in another terminal)
npm run dev

# Build everything for production
npm run build-all
```

### 5. **Setup Ollama (Fallback AI)**
```bash
# Pull the LLaVA model for image analysis
ollama pull llava

# Start Ollama service
ollama serve
```

## 🎯 Usage Guide

### **Creating Jira Issues**

1. **Navigate to Jira Creation**: Click on "Create Jira" from the main dashboard
2. **Enter Description**: Describe the issue or task in natural language
3. **Upload Images** (Optional): Add screenshots for AI analysis
4. **Select Issue Type**: Choose between Task, Bug, or Story
5. **Generate Preview**: Watch AI generate content in real-time
6. **Review & Edit**: Modify the generated content as needed
7. **Create Issue**: Submit to Jira with automatic attachment upload

### **Build Management**

1. **Access Build Tools**: Navigate to the Build section
2. **Configure Build**: Set up build parameters and environment
3. **Monitor Progress**: Track build status in real-time
4. **Manage Releases**: Coordinate release processes

### **Email Automation**

1. **Compose Email**: Use AI-powered email generation
2. **Select Template**: Choose from pre-built templates
3. **Customize Content**: Edit generated content as needed
4. **Send**: Deliver emails automatically

## 🔧 Advanced Configuration

### **AI Provider Configuration**

The application supports multiple AI providers with intelligent fallback:

```javascript
// Provider Priority Order
1. OpenAI Compatible API (Primary)
2. Ollama (Local Fallback)
```

### **Custom Model Configuration**

```env
# For OpenAI Compatible APIs
OPENAI_COMPATIBLE_MODEL=gpt-4-vision-preview
# or
OPENAI_COMPATIBLE_MODEL=claude-3-sonnet-20240229

# For Ollama
OLLAMA_MODEL=llava:13b
# or
OLLAMA_MODEL=codellama:7b
```

### **Streaming Configuration**

The application uses Server-Sent Events (SSE) for real-time streaming:

- **Chunk Size**: Optimized for real-time display
- **Timeout**: 60 seconds for long-running requests
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Handling**: Graceful degradation to non-streaming mode

## 🏢 Enterprise Features

### **Security**
- **API Key Management**: Secure storage and rotation
- **Access Control**: Role-based permissions
- **Audit Logging**: Comprehensive activity tracking
- **Data Privacy**: Local processing options with Ollama

### **Scalability**
- **Horizontal Scaling**: Stateless architecture
- **Load Balancing**: Multiple AI provider support
- **Caching**: Intelligent response caching
- **Rate Limiting**: Built-in API rate limiting

### **Monitoring**
- **Health Checks**: Comprehensive system monitoring
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Detailed error reporting
- **Usage Analytics**: AI provider usage statistics

## 🔌 API Reference

### **Base URL**
```
http://localhost:3000
```

---

## **Jira Endpoints**

### **POST** `/api/jira/preview`
Generate Jira content with real-time streaming

**Request Body:**
```json
{
  "prompt": "string (required) - Description of the issue or task",
  "images": ["string"] (optional) - Array of base64 encoded images,
  "issueType": "string (optional) - Bug|Task|Story (default: Bug)"
}
```

**Response:** Server-Sent Events (SSE)
```
Content-Type: text/event-stream

data: {"type": "status", "message": "Starting content generation...", "provider": "OpenAI Compatible"}

data: {"type": "chunk", "content": "Issue Summary: Login button not working"}

data: {"type": "complete", "bugReport": "...", "summary": "...", "description": "...", "provider": "OpenAI Compatible"}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/jira/preview \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Login button is not responding when clicked",
    "issueType": "Bug"
  }'
```

---

### **POST** `/api/jira/generate`
Create a new Jira issue

**Request Body:**
```json
{
  "summary": "string (required) - Issue title",
  "description": "string (required) - Issue description",
  "issueType": "string (optional) - Task|Bug|Story (default: Task)",
  "priority": "string (optional) - Low|Medium|High|Critical (default: Medium)"
}
```

**Response:**
```json
{
  "message": "Jira issue created successfully",
  "jiraIssue": {
    "id": "12345",
    "key": "CUDI-123",
    "self": "https://company.atlassian.net/rest/api/2/issue/12345"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/jira/generate \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Fix login button responsiveness",
    "description": "The login button does not respond to user clicks...",
    "issueType": "Bug",
    "priority": "High"
  }'
```

---

### **POST** `/api/jira/upload`
Upload file attachment to Jira issue

**Request:** `multipart/form-data`
```
file: File (required) - Image/video file (supports .mov to .mp4 conversion)
issueKey: string (required) - Jira issue key (e.g., CUDI-123)
fileName: string (optional) - Custom filename
```

**Response:**
```json
{
  "message": "Image uploaded to Jira successfully",
  "jiraResponse": [...],
  "fileName": "screenshot.png"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/jira/upload \
  -F "file=@screenshot.png" \
  -F "issueKey=CUDI-123" \
  -F "fileName=login-bug-screenshot.png"
```

---

### **GET** `/api/jira/issue/:id`
Fetch Jira issue details

**Parameters:**
- `id` (path) - Jira issue ID or key

**Response:**
```json
{
  "id": "12345",
  "key": "CUDI-123",
  "fields": {
    "summary": "Fix login button responsiveness",
    "description": "The login button does not respond...",
    "status": {"name": "Open"},
    "priority": {"name": "High"},
    "issuetype": {"name": "Bug"}
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/jira/issue/CUDI-123
```

---

### **POST** `/api/jira/create-pr`
Create pull request in Bitbucket

**Request Body:**
```json
{
  "ticketNumber": "string (required) - Jira ticket number (without CUDI prefix)",
  "updatedList": "string (required) - Description of changes",
  "branchName": "string (required) - Source branch name",
  "projectKey": "string (required) - Bitbucket project key",
  "repoSlug": "string (required) - Repository slug"
}
```

**Response:**
```json
{
  "message": "Pull request created successfully",
  "pullRequest": {
    "id": 123,
    "title": "feat(CUDI-456): upgrade dependencies",
    "state": "OPEN"
  },
  "prTitle": "feat(CUDI-456): upgrade dependencies",
  "prDescription": "This PR integrates the latest updates..."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/jira/create-pr \
  -H "Content-Type: application/json" \
  -d '{
    "ticketNumber": "456",
    "updatedList": "React Native, Expo SDK",
    "branchName": "feature/CUDI-456-upgrade-deps",
    "projectKey": "MOBILE",
    "repoSlug": "mobile-app"
  }'
```

---

## **Build Endpoints**

### **POST** `/api/build/release`
Start mobile app build process

**Request Body:**
```json
{
  "ticketNumber": "string (required) - Jira ticket number",
  "selectedPackages": ["string"] (optional) - Array of package names to update,
  "createPullRequest": "boolean (optional) - Whether to create PR (default: false)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Build process started",
  "buildId": "1642123456789"
}
```

**WebSocket Events:** Real-time build progress via Socket.IO
```json
{
  "type": "start|stdout|stderr|success|error",
  "message": "Build process initiated...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "exitCode": 0
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/build/release \
  -H "Content-Type: application/json" \
  -d '{
    "ticketNumber": "CUDI-123",
    "selectedPackages": ["react-native", "@expo/cli"],
    "createPullRequest": true
  }'
```

---

### **GET** `/api/build/status`
Get build service status

**Response:**
```json
{
  "success": true,
  "message": "Build service is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/api/build/status
```

---

## **Email Endpoints**

### **POST** `/api/email/send`
Send release notes email

**Query Parameters:**
- `version` (required) - Release version number
- `dryRun` (optional) - true|false (default: false) - Preview email without sending

**Response:** HTML email content
```html
<!DOCTYPE html>
<html>
<head>
  <title>Release Notes QA Build: 1.2.3</title>
</head>
<body>
  <!-- Email content with release notes -->
</body>
</html>
```

**Example:**
```bash
# Send actual email
curl -X POST "http://localhost:3000/api/email/send?version=1.2.3&dryRun=false"

# Preview email (dry run)
curl -X POST "http://localhost:3000/api/email/send?version=1.2.3&dryRun=true"
```

---

### **GET** `/api/email/status`
Get email service status

**Response:**
```json
{
  "status": "OK",
  "service": "Email Service",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## **Health Check**

### **GET** `/health`
Application health status

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.123,
  "environment": "development"
}
```

**Example:**
```bash
curl -X GET http://localhost:3000/health
```

---

## **Error Responses**

All endpoints may return these error formats:

**400 Bad Request:**
```json
{
  "error": "Invalid request payload",
  "details": "Missing required field: summary"
}
```

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "details": "Invalid API key or authentication failed"
}
```

**429 Too Many Requests:**
```json
{
  "error": "Rate limit exceeded",
  "details": "Too many requests, please try again later"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "details": "Failed to connect to external service"
}
```

---

## **Rate Limits**

- **Jira endpoints:** 50 requests per 15 minutes
- **Build endpoints:** 5 requests per hour
- **Email endpoints:** 10 requests per hour
- **Health check:** No rate limit

---

## **Authentication**

The API uses environment-based authentication:
- **Jira:** Bearer token via `JIRA_TOKEN`
- **Bitbucket:** Bearer token via `BITBUCKET_AUTHORIZATION_TOKEN`
- **AI Providers:** API keys via `OPENAI_COMPATIBLE_API_KEY`
- **Email:** SMTP credentials via environment variables

No client-side authentication is required for API access.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### **Development Setup**
```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [Wiki](wiki) for detailed guides
- **Issues**: Report bugs on [GitHub Issues](issues)
- **Discussions**: Join our [GitHub Discussions](discussions)
- **Email**: Contact us at support@your-company.com

## 🎉 Acknowledgments

- **OpenAI**: For providing excellent AI APIs
- **Ollama**: For local AI processing capabilities
- **Atlassian**: For Jira integration APIs
- **Material-UI**: For beautiful React components
- **Redux Toolkit**: For efficient state management

---

**Made with ❤️ by Anurag Arwalkar**

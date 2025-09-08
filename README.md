# 🚀 AI Workflow Utils

<div align="center">

![AI Workflow Utils](https://img.shields.io/npm/v/ai-workflow-utils?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![LangChain](https://img.shields.io/badge/LangChain-Supported-orange?style=for-the-badge)
![Express.js](https://img.shields.io/badge/Express.js-5.x-black?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**The Ultimate AI-Powered Development Workflow Automation Platform**

_Streamline your development process with intelligent Jira ticket creation,
AI-powered code reviews & pull request creation with custom template support,
featuring a beautiful dark/light theme interface_

<img width="1920" height="1484" alt="AI-Workflow-Utils-08-21-2025_03_39_PM" src="https://github.com/user-attachments/assets/87243a4f-d44d-460f-80c6-60d9624d0e00" />

</div>

## 🎉 **NEW IN v1.x.x - Game-Changing Features!**

### 🎯 **Feature #1: AI-Powered Jira Ticket Creation**

Create professional Jira tickets (Tasks, Bugs, Stories) using AI with multiple
provider support:

- **🤖 OpenAI Compatible APIs**: GPT-4, Claude, and other cloud providers
- **🏠 Local AI with Ollama LLaVA**: Complete privacy with local image analysis
- **📸 Smart Image Analysis**: Upload screenshots and get detailed issue
  descriptions
- **⚡ Real-time Streaming**: Watch AI generate content live
- **🎨 Professional Templates**: Auto-formatted with proper sections and
  acceptance criteria
- **🔗 Direct Jira Integration**: Creates tickets instantly with your access
  token

### 🚀 **Feature #2: AI-Powered Pull Request Creation**

Revolutionary AI-powered pull request creation for Atlassian Bitbucket:

- **🤖 Intelligent PR Generation**: AI analyzes commit messages to create
  professional PR titles and descriptions
- **📝 Smart Commit Analysis**: Automatically determines PR type
  (feat/fix/chore) based on commit patterns
- **⚡ Real-time Streaming**: Watch AI generate PR content live with streaming
  updates
- **🔄 Multi-Model Support**: Uses Ollama for local AI processing with privacy
- **✏️ Editable Previews**: Review and edit AI-generated content before creating
  the PR
- **💾 Smart Persistence**: Remembers project and repository settings for faster
  workflow

### 🔍 **Feature #3: AI-Powered Code Review**

Revolutionary AI-powered pull request reviews for Atlassian Bitbucket:

- **🧠 Intelligent Code Analysis**: AI reviews your code changes
- **💡 Smart Suggestions**: Get actionable improvement recommendations
- **🔄 Multi-Model Support**: OpenAI Compatible APIs + Ollama for flexibility
- **⚡ Coming Soon**: AI adds review comments directly to your PRs
- **⚡ Coming Soon**: Direct comment integration

### 📊 **Feature #4: Real-time Logs & Monitoring**

Comprehensive logging and monitoring system for troubleshooting and system
insights:

- **📋 Real-time Log Streaming**: Live view of application logs with automatic
  updates
- **🔍 Advanced Filtering**: Filter logs by level (Error, Warn, Info, Debug) and
  search by content
- **📅 Log History**: Access historical logs with pagination and date filtering
- **🎨 Syntax Highlighting**: Color-coded log levels for easy identification
- **💾 Log Management**: Automatic log rotation and size management
- **🔧 Debug Mode**: Enable detailed debug logging for troubleshooting
- **📱 Responsive Design**: Access logs from any device with mobile-friendly
  interface

### 🧩 **Feature #5: Universal API Client (NEW!)**

The new **API Client** module provides a flexible, general-purpose interface for making API requests to any service (Jira, Bitbucket, email, or custom endpoints).

- **🔗 Universal API Requests**: Send requests to any configured endpoint
- **⚡ CLI & Server Support**: Use via CLI or `/api/api-client` endpoint
- **🛠️ Modular Architecture**: Easily extend for new APIs
- **🔒 Secure & Configurable**: Manage endpoints in `~/.ai-workflow-utils/environment.json`
- **📋 Error Handling & Logging**: Built-in reliability

> **Coming Soon:** AI-powered automation, script generation, and smart workflow integration will be added in future releases.

### **🌙 Feature #6: Intelligent Dark Theme System**

Beautiful, adaptive interface that automatically adjusts to your preferences:

- **🌓 Auto Theme Detection**: Automatically follows your system's dark/light
  mode preference
- **🎨 Manual Theme Control**: Switch between Light, Dark, and Auto modes with a
  single click
- **🎭 Persistent Preferences**: Your theme choice is remembered across sessions
- **🌈 Gradient Design System**: Stunning gradient backgrounds and
  glass-morphism effects
- **📱 Consistent Theming**: Dark theme support across all components and pages
- **👁️ Eye-friendly**: Carefully crafted colors that reduce eye strain during
  long sessions
- **🔄 Smooth Transitions**: Elegant animations when switching between themes

### **🔗 Feature #6: MCP Client Configuration**

Advanced Model Context Protocol (MCP) client management for seamless AI tool integration:

- **🛠️ Comprehensive Client Management**: Create, configure, and manage multiple MCP clients
- **🌐 Flexible Connection Types**: Support for both remote URL-based and local command-based MCP servers
- **🔐 Secure Authentication**: Token-based authentication with secure credential storage
- **⚡ Real-time Testing**: Test MCP client connections instantly to ensure proper configuration
- **📝 Client Documentation**: Add descriptions and metadata for organized client management
- **🔄 Enable/Disable Toggle**: Easily activate or deactivate clients without deletion
- **🏗️ LangChain Integration**: Seamless integration with LangChain MCP adapters for AI workflows

---

## 🚀 Quick Start Guide

### **Step 1: Recommended - Ollama Setup (For Local AI)**

```bash
# Install Ollama (if you want local AI processing)
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows - Download from https://ollama.com/

# Download the LLaVA model for image analysis
ollama pull llava

# Start Ollama service
ollama serve
```

Then configure Ollama as your AI provider in the web interface.

### **Step 2: Installation**

```bash
npm install -g ai-workflow-utils
```

### **Step 3: Permission Setup (Important!)**

The application includes file upload functionality that requires proper permissions. Check if your setup is ready:

```bash
# Check if the application has necessary permissions
ai-workflow-utils check-permissions
```

If you see permission warnings:

```bash
# Option 1: Fix project directory permissions
sudo chown -R $USER:$USER ~/.npm
mkdir -p ~/ai-workflow-utils && cd ~/ai-workflow-utils

# Option 2: Use a custom upload directory
export UPLOAD_DIR=~/ai-workflow-utils/uploads
```

📖 **For detailed setup instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

### **Step 4: Launch the Application**

```bash
# Start the application directly
ai-workflow-utils
```

The application will start immediately and be available at
`http://localhost:3000`

### **Step 5: (Optional) Install as Startup Service**

For production use or to run automatically on system boot:

```bash
ai-workflow-utils startup install
```

The service will now start automatically on boot. Access at
`http://localhost:3000`

**Startup Service Management:**

```bash
ai-workflow-utils startup status    # Check service status
ai-workflow-utils startup start     # Start the service
ai-workflow-utils startup stop      # Stop the service
ai-workflow-utils startup uninstall # Remove startup service
```

### **Step 6: (Optional) PWA Installation (Progressive Web App)**
```

**Supported Platforms:**

- **macOS**: Uses LaunchAgents (user-level service)
- **Windows**: Uses Windows Service Manager
- **Linux**: Uses systemd

For detailed startup service documentation, see [STARTUP.md](STARTUP.md)

### **Step 5: Configure Using the Settings Page**

All configuration is managed through the web-based settings page:

- Visit
  [`http://localhost:3000/settings/environment`](http://localhost:3000/settings/environment)
- Configure your AI provider (Anthropic Claude, OpenAI GPT, Google Gemini,
  Ollama)
- Set up Jira integration (URL, API token)
- Configure repository provider (Bitbucket)
- Set up issue tracking (Jira, etc.)
- Configure MCP clients for Model Context Protocol integration

All changes are saved to `~/.ai-workflow-utils/environment.json` and persist
across upgrades.

**No manual .env setup required!**

### **Step 6: (Optional) PWA Installation (Progressive Web App)**

**AI Workflow Utils is a fully-featured PWA!** Install it as a native app for
the best experience:

**🖥️ Desktop Installation:**

1. Open `http://localhost:3000` in Chrome, Edge
2. Look for the "Install" button in the address bar
3. Click "Install" to add AI Workflow Utils to your desktop
4. Launch directly from your desktop/dock - no browser needed!

**✨ PWA Benefits:**

- **🚀 Faster Loading**: Cached resources for instant startup
- **📱 Native Feel**: Works like a desktop
- **🔄 Auto Updates**: Always get the latest features
- **💾 Offline Ready**: Basic functionality works without internet
- **🎯 Focused Experience**: No browser distractions

---

<details>
     
<summary><strong>🎯 Feature Deep Dive</strong></summary>

### **🎫 AI Jira Ticket Creation**

**What makes it special:**

- **Dual AI System**: Primary cloud AI with local Ollama fallback
- **Image Intelligence**: Upload screenshots and get detailed bug reports
- **Smart Templates**: Automatically formats content based on issue type
- **Real-time Generation**: Watch AI create your tickets live

**Example Usage:**

1. Navigate to "Create Jira"
2. Describe your issue: _"Login button doesn't work on mobile"_
3. Upload a screenshot (optional)
4. Select issue type (Bug/Task/Story)
5. Watch AI generate professional content
6. Review and create ticket directly in Jira

**AI Providers Supported:**

- **OpenAI GPT-4** (with vision)
- **Anthropic Claude** (with vision)
- **Any OpenAI-compatible API**
- **Ollama LLaVA** (local, private)

### **🚀 AI-Powered Pull Request Creation**

**Revolutionary PR Generation:**

- **Smart Commit Analysis**: AI analyzes your commit messages to understand the
  changes
- **Automatic Type Detection**: Determines if changes are features, fixes, or
  chores
- **Professional Formatting**: Generates conventional commit-style titles
  (feat/fix/chore)
- **Streaming Generation**: Watch AI create content in real-time with live
  updates
- **Local AI Processing**: Uses Ollama for complete privacy and offline
  capability

**How it works:**

1. Navigate to "Create PR"
2. Enter project key, repository slug, ticket number, and branch name
3. Click "Preview" to start AI generation
4. Watch AI analyze commits and generate title/description in real-time
5. Edit the generated content if needed
6. Click "Create Pull Request" to submit to Bitbucket

**AI Features:**

- **Commit Message Analysis**: Extracts meaningful information from commit
  history
- **Smart Categorization**: Automatically prefixes with feat/fix/chore based on
  content
- **Ticket Integration**: Includes ticket numbers in standardized format
- **Editable Previews**: Full control over final content before submission
- **Persistent Settings**: Remembers project and repo settings for faster
  workflow

### **🔍 AI Code Review**

**Revolutionary Code Review:**

- **Context-Aware Analysis**: AI understands your codebase
- **Security Scanning**: Identifies potential vulnerabilities
- **Performance Optimization**: Suggests efficiency improvements
- **Best Practices**: Enforces coding standards

**How it works:**

1. Open a pull request in Bitbucket
2. Navigate to "GitStash Review"
3. Enter PR details
4. AI analyzes code changes
5. Get detailed review with suggestions
6. _Coming Soon_: Direct comment integration

### **📊 Real-time Logs & Monitoring**

**Comprehensive System Monitoring:**

- **Live Log Streaming**: Real-time log updates without page refresh
- **Multi-level Filtering**: Filter by Error, Warn, Info, Debug levels
- **Smart Search**: Full-text search across all log entries
- **Historical Access**: Browse past logs with pagination
- **Performance Insights**: Monitor API calls, response times, and system health

**How it works:**

1. Navigate to "Logs" in the web interface
2. Select log level filters (All, Error, Warn, Info, Debug)
3. Use search to find specific entries or error messages
4. View real-time updates as the system operates
5. Access historical logs for troubleshooting past issues

**Monitoring Features:**

- **Error Tracking**: Immediate visibility into system errors
- **API Monitoring**: Track AI provider calls and response times
- **User Activity**: Monitor feature usage and workflow patterns
- **System Health**: Resource usage and performance metrics
- **Debug Support**: Detailed logging for development and troubleshooting

</details>

<!-- Manual environment setup is deprecated. All configuration should be done via the web-based settings page. -->

---

</details>

---

<details>
<summary><strong>🏗️ Technical Architecture & Development</strong></summary>

### **🧩 Functional Programming Architecture**

AI Workflow Utils follows **functional programming principles** throughout the
codebase:

- **Pure Functions**: Side-effect free functions with predictable outputs
- **Immutable State Management**: State updates create new objects instead of
  mutations
- **Function Composition**: Small, composable functions that work together
- **No Classes**: Functional approach instead of object-oriented programming
- **Separation of Concerns**: Each module has a specific, well-defined
  responsibility

**Benefits:**

- **Easier Testing**: Pure functions are simple to test and reason about
- **Better Maintainability**: Predictable code flow and reduced complexity
- **Improved Reliability**: Immutable state prevents many common bugs
- **Enhanced Debugging**: Clear data flow makes debugging straightforward

### **🎭 Mock-First Development**

**Comprehensive Jira Mocking Service** for development and testing:

```bash
# Enable mock mode (no real API calls)
JIRA_MOCK_MODE=true

# Use real Jira API
JIRA_MOCK_MODE=false
```

**Mock Service Features:**

- **Realistic API Responses**: Mock data that matches real Jira API structure
- **Stateful Operations**: Created issues, comments, and attachments persist in
  memory
- **Complete CRUD Support**: Create, read, update, delete operations
- **Advanced Features**: JQL search, issue transitions, field validation
- **Error Simulation**: Test error handling with realistic error responses
- **Fast Development**: No external dependencies for development/testing

**Functional Mock Architecture:**

```javascript
// Pure state management
const getMockState = () => ({ ...mockState });
const updateMockState = updates => ({ ...mockState, ...updates });

// Functional API operations
export const createIssue = async issueData => {
  /* pure function */
};
export const getIssue = async issueKey => {
  /* pure function */
};
export const searchIssues = async jql => {
  /* pure function */
};
```

### **📁 Modular Architecture**

```
server/
├── controllers/           # Feature-based controllers
│   ├── jira/             # Jira integration
│   │   ├── services/     # Business logic services
│   │   ├── models/       # Data models
│   │   ├── utils/        # Utility functions
│   │   └── README.md     # Module documentation
│   ├── pull-request/     # PR creation & review
│   ├── email/            # Email generation
│   ├── chat/             # AI chat integration
│   └── mcp/              # Model Context Protocol client management
├── mocks/                # Mock services (excluded from npm package)
│   └── jira/             # Comprehensive Jira mocking
└── services/             # Shared services
```

**Each module follows the same structure:**

- **Services**: Core business logic (functional)
- **Models**: Data transformation and validation
- **Utils**: Pure utility functions
- **README.md**: Complete module documentation

### **🔧 Development Best Practices**

- **ESLint Integration**: Enforces functional programming patterns
- **Modular Design**: Each feature is self-contained
- **Comprehensive Documentation**: Every module has detailed README
- **Mock-First Testing**: Develop without external dependencies
- **Environment Variables**: Configuration through environment
- **Type Safety**: JSDoc annotations for better IDE support

</details>

---

<details>
<summary><strong>🛠️ CLI Commands (For Advanced Users)</strong></summary>

### **Setup and Configuration**

```bash
# Interactive setup wizard
ai-workflow-setup

# Check configuration
ai-workflow-utils --config

# Test connections
ai-workflow-utils --test
```

### **Development Commands**

```bash
# Start in development mode
ai-workflow-utils --dev

# Enable debug logging
ai-workflow-utils --debug

# Specify custom port
ai-workflow-utils --port 8080

# View logs in real-time
ai-workflow-utils --logs

# Clear log files
ai-workflow-utils --clear-logs
```

### **Ollama Management**

```bash
# Check Ollama status
ai-workflow-utils --ollama-status

# Download recommended models
ai-workflow-utils --setup-ollama

# List available models
ollama list
```

</details>

---

<details>
<summary><strong>🔧 Advanced Configuration (For Developers)</strong></summary>

### **AI Provider Fallback System**

```javascript
// Automatic fallback order:
1. OpenAI Compatible API (Primary)
2. Ollama LLaVA (Local fallback)
3. Error handling with user notification
```

### **Custom Model Configuration**

```env
# For different OpenAI-compatible providers:
OPENAI_COMPATIBLE_MODEL=gpt-4-vision-preview    # OpenAI
OPENAI_COMPATIBLE_MODEL=claude-3-sonnet-20240229 # Anthropic
OPENAI_COMPATIBLE_MODEL=llama-2-70b-chat        # Custom API

# For Ollama local models:
OLLAMA_MODEL=llava:13b      # Larger model for better quality
OLLAMA_MODEL=llava:7b       # Faster, smaller model
OLLAMA_MODEL=codellama:7b   # Code-focused model
```

### **Performance Tuning**

```env
# Streaming configuration
STREAM_CHUNK_SIZE=1024
STREAM_TIMEOUT=60000

# Rate limiting
API_RATE_LIMIT=100
API_RATE_WINDOW=900000

# File upload limits
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,mp4,mov,pdf,doc,docx

# Logging configuration
LOG_LEVEL=info                # error, warn, info, debug
LOG_MAX_SIZE=10MB            # Maximum log file size
LOG_MAX_FILES=5              # Number of rotated log files
LOG_RETENTION_DAYS=30        # Days to keep log files
ENABLE_REQUEST_LOGGING=true  # Log all HTTP requests
```

</details>

---

<details>
<summary><strong>🚀 Production Deployment (For DevOps)</strong></summary>

### **Docker Deployment**

```bash
# Build the application
npm run build

# Create Docker image
docker build -t ai-workflow-utils .

# Run container
docker run -p 3000:3000 --env-file .env ai-workflow-utils
```

### **PM2 Process Management**

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs ai-workflow-utils
```

### **Nginx Reverse Proxy**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

</details>

---

<details>
<summary><strong>🔒 Security & Privacy</strong></summary>

### **Data Privacy**

- **Local AI Processing**: Use Ollama for complete data privacy
- **No Data Storage**: AI conversations are not stored
- **Secure Tokens**: Environment-based credential management
- **HTTPS Support**: SSL/TLS encryption for production

### **Security Features**

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Sanitizes all user inputs
- **Error Handling**: No sensitive data in error messages
- **Access Control**: Token-based authentication

</details>

---

<details>
<summary><strong>📊 Monitoring & Analytics (For DevOps)</strong></summary>

### **Built-in Monitoring**

- **Health Checks**: `/health` endpoint for monitoring
- **Performance Metrics**: Response times and success rates
- **Error Tracking**: Comprehensive error logging
- **Usage Statistics**: AI provider usage analytics

### **Logging Configuration**

```env
# Logging levels: error, warn, info, debug
LOG_LEVEL=info

# Log file rotation
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5

# Enable request logging
LOG_REQUESTS=true
```

</details>

---

<details>
<summary><strong>🤝 Contributing (For Developers)</strong></summary>

We welcome contributions! Here's how to get started:

### **Development Setup**

```bash
# Clone the repository
git clone https://github.com/anuragarwalkar/ai-workflow-utils.git
cd ai-workflow-utils

# Install dependencies
npm install

# Set up environment
cp .env.example .env
cp ui/.env.example ui/.env

# Start development server
npm run dev
```

### **Project Structure**

```
ai-workflow-utils/
├── bin/                 # CLI scripts
├── server/             # Backend (Node.js + Express)
├── ui/                 # Frontend (React + Redux)
├── dist/               # Built files
└── docs/               # Documentation
```

### **Contribution Guidelines**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

</details>

---

<details>
<summary><strong>📝 API Documentation (For Developers)</strong></summary>

### **Core Endpoints**

**Jira Ticket Creation:**

```bash
POST /api/jira/preview
Content-Type: application/json

{
  "prompt": "Login button not working",
  "images": ["base64-encoded-image"],
  "issueType": "Bug"
}
```

**Create Pull Request Preview (Streaming):**

```bash
POST /api/pr/stream-preview
Content-Type: application/json

{
  "projectKey": "PROJ",
  "repoSlug": "my-repo",
  "ticketNumber": "PROJ-123",
  "branchName": "feature/my-branch"
}

# Returns Server-Sent Events stream with:
# - status updates
# - title_chunk events (streaming title generation)
# - title_complete event (final title)
# - description_chunk events (streaming description generation)
# - description_complete event (final description)
# - complete event (final preview data)
```

**Create Pull Request:**

```bash
POST /api/pr/create
Content-Type: application/json

{
  "projectKey": "PROJ",
  "repoSlug": "my-repo",
  "ticketNumber": "PROJ-123",
  "branchName": "feature/my-branch",
  "customTitle": "feat(PROJ-123): Add user authentication",
  "customDescription": "## Summary\nAdded user authentication feature\n\n## Changes Made\n- Added login component\n- Implemented JWT tokens"
}
```

**GitStash PR Review:**

```bash
POST /api/pr/review
Content-Type: application/json

{
  "repoUrl": "https://bitbucket.company.com/projects/PROJ/repos/repo",
  "pullRequestId": "123",
  "reviewType": "security"
}
```

**File Upload:**

```bash
POST /api/jira/upload
Content-Type: multipart/form-data

file: [binary-data]
issueKey: "PROJ-123"
```

**MCP Client Management:**

```bash
# Get all MCP clients
GET /api/mcp/clients

# Create new MCP client
POST /api/mcp/clients
Content-Type: application/json

{
  "name": "My MCP Server",
  "url": "http://localhost:8080/mcp",
  "token": "optional-auth-token",
  "description": "Local MCP server for custom tools",
  "enabled": true
}

# Update MCP client
PUT /api/mcp/clients/:id
Content-Type: application/json

{
  "name": "Updated MCP Server",
  "enabled": false
}

# Delete MCP client
DELETE /api/mcp/clients/:id

# Test MCP client connection
POST /api/mcp/clients/:id/test
```

</details>

---

<details>
<summary><strong>🆘 Troubleshooting (For Support)</strong></summary>

### **Common Issues**

**Ollama Connection Failed:**

```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve

# Pull required model
ollama pull llava
```

**Jira Authentication Error:**

```bash
# Test Jira connection
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-company.atlassian.net/rest/api/2/myself
```

**Port Already in Use:**

```bash
# Use different port
ai-workflow-utils --port 8080

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

### **Debug Mode**

```bash
# Enable detailed logging
ai-workflow-utils --debug

# Check logs
tail -f logs/app.log
```

</details>

---

## 📞 **Support**

### **Getting Help**

- **📖 Documentation**:
  [GitHub Wiki](https://github.com/anuragarwalkar/ai-workflow-utils/wiki)
- **🐛 Bug Reports**:
  [GitHub Issues](https://github.com/anuragarwalkar/ai-workflow-utils/issues)
- **💬 Discussions**:
  [GitHub Discussions](https://github.com/anuragarwalkar/ai-workflow-utils/discussions)
- **📧 Email**: anurag.arwalkar@gmail.com

### **Community**

- **⭐ Star us on GitHub**: Show your support!
- **🔄 Share**: Help others discover this tool
- **🤝 Contribute**: Join our growing community

---

## 📈 **Roadmap**

### **Coming Soon**

- **🔗 Direct PR Comments**: AI comments directly in Bitbucket
- **🔄 Workflow Automation**: Custom automation workflows
- **📊 Analytics Dashboard**: Usage insights and metrics
- **🔌 Plugin System**: Extensible architecture
- **🌐 Multi-language Support**: Internationalization

### **Future Features**

- **🤖 Advanced AI Agents**: Specialized AI for different tasks
- **🔗 More Integrations**: GitHub, GitLab, Azure DevOps
- **📱 Mobile App**: Native mobile applications
- **🎯 Smart Routing**: Intelligent task assignment

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

---

## 🎖️ **Acknowledgments**

Special thanks to the amazing open-source community and the following
technologies that make this project possible:

- **🤖 OpenAI & Anthropic**: For providing excellent AI APIs
- **🏠 Ollama**: For enabling local AI processing with privacy
- **🎯 Atlassian**: For robust Jira and Bitbucket APIs
- **⚛️ React & Redux**: For building beautiful, responsive UIs
- **🚀 Node.js & Express**: For reliable backend infrastructure
- **🎨 Material-UI**: For professional design components

---

## 🌟 **Why Choose AI Workflow Utils?**

### **🚀 Productivity Boost**

- **10x Faster**: Create professional Jira tickets in seconds
- **AI-Powered**: Let AI handle the heavy lifting
- **Streamlined**: One tool for all your workflow needs

### **🔒 Privacy First**

- **Local Processing**: Use Ollama for complete data privacy
- **No Vendor Lock-in**: Multiple AI provider support
- **Your Data**: Stays on your infrastructure

### **🛠️ Developer Friendly**

- **Easy Setup**: Get started in minutes
- **CLI Tools**: Powerful command-line interface
- **Extensible**: Open architecture for customization

### **💼 Enterprise Ready**

- **Scalable**: Handles teams of any size
- **Secure**: Enterprise-grade security features
- **Reliable**: Battle-tested in production environments

---

<div align="center">

## 🚀 **Ready to Transform Your Workflow?**

### **Get Started Today!**

```bash
npm install -g ai-workflow-utils
```

**⭐ Star us on GitHub if this tool helps you!**

**📢 Share with your team and boost everyone's productivity!**

---

**Made with ❤️ by [Anurag Arwalkar](https://github.com/anuragarwalkar)**

_Empowering developers worldwide with AI-powered workflow automation_

</div>

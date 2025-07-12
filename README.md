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

### **Backend (Node.js + Express)**
- **RESTful API**: Clean, well-documented API endpoints
- **Streaming Support**: Server-Sent Events (SSE) for real-time data streaming
- **File Processing**: Advanced file handling with format conversion
- **Error Handling**: Comprehensive error handling and logging
- **Modular Architecture**: Clean separation of concerns

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
- **Primary**: OpenAI Compatible API server (e.g., Globant server, OpenAI, Anthropic)
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
cp react-ui/.env.example react-ui/.env
```

### 3. **Configure Environment Variables**
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
```

### 4. **Start the Application**
```bash
# Start backend server
npm run server

# Start frontend (in another terminal)
npm run client

# Or start both concurrently
npm start
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

### **Jira Endpoints**
```
POST /api/preview          # Generate Jira content (streaming)
POST /api/generate         # Create Jira issue
POST /api/upload           # Upload attachments
GET  /api/issue/:id        # Fetch Jira issue
POST /api/create-pr        # Create pull request
```

### **Build Endpoints**
```
POST /api/build/start      # Start build process
GET  /api/build/status     # Get build status
POST /api/build/deploy     # Deploy build
```

### **Email Endpoints**
```
POST /api/email/send       # Send email
GET  /api/email/templates  # Get email templates
POST /api/email/generate   # Generate email content
```

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

**Made with ❤️ by the AI Workflow Utils Team**

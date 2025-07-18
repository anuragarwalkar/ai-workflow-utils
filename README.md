# 🚀 AI Workflow Utils v1.1.0 - Major Feature Release

<div align="center">

![AI Workflow Utils](https://img.shields.io/badge/AI%20Workflow%20Utils-v1.0.6-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-16%2B-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**The Ultimate AI-Powered Development Workflow Automation Platform**

*Streamline your development process with intelligent Jira ticket creation, AI-powered code reviews, and seamless attachment management*

<img width="3024" height="2376" alt="AI-Workflow-Utils-07-19-2025_12_32_AM" src="https://github.com/user-attachments/assets/932e486d-4183-4008-8f0d-fac9025d9b5e" />


</div>

---

## 🎉 **NEW IN v1.0.7 - Game-Changing Features!**

### 🎯 **Feature #1: AI-Powered Jira Ticket Creation**
Create professional Jira tickets (Tasks, Bugs, Stories) using AI with multiple provider support:

- **🤖 OpenAI Compatible APIs**: GPT-4, Claude, and other cloud providers
- **🏠 Local AI with Ollama LLaVA**: Complete privacy with local image analysis
- **📸 Smart Image Analysis**: Upload screenshots and get detailed issue descriptions
- **⚡ Real-time Streaming**: Watch AI generate content live
- **🎨 Professional Templates**: Auto-formatted with proper sections and acceptance criteria
- **🔗 Direct Jira Integration**: Creates tickets instantly with your access token

### 🔍 **Feature #2: GitStash PR AI Review**
Revolutionary AI-powered pull request reviews for Atlassian Bitbucket:

- **🧠 Intelligent Code Analysis**: AI reviews your code changes
- **💡 Smart Suggestions**: Get actionable improvement recommendations
- **🔄 Multi-Model Support**: OpenAI Compatible APIs + Ollama for flexibility
- **📝 Automated Comments**: AI adds review comments directly to your PRs
- **⚡ Coming Soon**: Direct comment integration (currently in development)

### 📎 **Feature #3: Simple Jira Attachment Management**
Effortless file management for your Jira tickets:

- **📁 Drag & Drop Interface**: Simple file uploads
- **🎥 Video Conversion**: Automatic .mov to .mp4 conversion
- **📸 Image Optimization**: Smart image processing
- **🔗 Direct Integration**: Seamless attachment to existing tickets

---

## 🚀 **Quick Start Guide**

### **Step 1: Installation**
```bash
npm install -g ai-workflow-utils
```

### **Step 2: Initial Setup**
```bash
# Run the interactive setup wizard
ai-workflow-setup
```

The setup wizard will guide you through:
- ✅ Jira configuration (URL, access token)
- ✅ AI provider setup (OpenAI Compatible API or Ollama)
- ✅ Optional integrations (Bitbucket, Email)

### **Step 3: Ollama Setup (Recommended for Privacy)**
```bash
# Install Ollama (if not already installed)
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

### **Step 4: Launch the Application**
```bash
# Start the application
ai-workflow-utils

# Or run in development mode
ai-workflow-utils --dev
```

The application will be available at `http://localhost:3000`

---

<details>
     
<summary><strong>🎯 Feature Deep Div</strong></summary>

### **🎫 AI Jira Ticket Creation**

**What makes it special:**
- **Dual AI System**: Primary cloud AI with local Ollama fallback
- **Image Intelligence**: Upload screenshots and get detailed bug reports
- **Smart Templates**: Automatically formats content based on issue type
- **Real-time Generation**: Watch AI create your tickets live

**Example Usage:**
1. Navigate to "Create Jira" 
2. Describe your issue: *"Login button doesn't work on mobile"*
3. Upload a screenshot (optional)
4. Select issue type (Bug/Task/Story)
5. Watch AI generate professional content
6. Review and create ticket directly in Jira

**AI Providers Supported:**
- **OpenAI GPT-4** (with vision)
- **Anthropic Claude** (with vision)
- **Any OpenAI-compatible API**
- **Ollama LLaVA** (local, private)

### **🔍 GitStash PR AI Review**

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
6. *Coming Soon*: Direct comment integration

### **📎 Jira Attachment Management**

**Simplified File Handling:**
- **Universal Format Support**: Images, videos, documents
- **Smart Conversion**: Automatic .mov to .mp4 for compatibility
- **Batch Upload**: Multiple files at once
- **Preview Integration**: View attachments before upload
</details>

---

<details>
<summary><strong>⚙️ Advanced Configuration (For Developers)</strong></summary>

> **Note**: Most users should use the interactive setup wizard (`ai-workflow-setup`) instead of manual configuration.

### **Manual Environment Setup**

Create `.env` file in your project root:

```env
# === JIRA CONFIGURATION ===
JIRA_URL=https://your-company.atlassian.net
JIRA_TOKEN=your-jira-api-token

# === PRIMARY AI PROVIDER (Cloud) ===
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_API_KEY=your-openai-api-key
OPENAI_COMPATIBLE_MODEL=gpt-4-vision-preview

# === FALLBACK AI PROVIDER (Local) ===
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llava

# === BITBUCKET INTEGRATION ===
BITBUCKET_AUTHORIZATION_TOKEN=your-bitbucket-token
BIT_BUCKET_URL=https://bitbucket.your-company.com

# === SERVER CONFIGURATION ===
PORT=3000
NODE_ENV=production
```

### **Getting Your Tokens**

**Jira API Token:**
1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Copy the generated token

**OpenAI API Key:**
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy the key

**Bitbucket Token:**
1. Go to Bitbucket → Personal Settings → App passwords
2. Create new app password with repository permissions
3. Copy the generated password

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
- **📖 Documentation**: [GitHub Wiki](https://github.com/anuragarwalkar/ai-workflow-utils/wiki)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/anuragarwalkar/ai-workflow-utils/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/anuragarwalkar/ai-workflow-utils/discussions)
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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎖️ **Acknowledgments**

Special thanks to the amazing open-source community and the following technologies that make this project possible:

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
ai-workflow-setup
ai-workflow-utils
```

**⭐ Star us on GitHub if this tool helps you!**

**📢 Share with your team and boost everyone's productivity!**

---

**Made with ❤️ by [Anurag Arwalkar](https://github.com/anuragarwalkar)**

*Empowering developers worldwide with AI-powered workflow automation*

</div>

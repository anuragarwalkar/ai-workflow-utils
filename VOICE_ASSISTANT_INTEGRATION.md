# AI Voice Assistant Integration

## Overview

The AI Voice Assistant feature integrates Google Gemini 2.5 Pro's native voice capabilities into the existing chat application, providing real-time voice conversations with advanced AI features.

## Features

### Core Voice Capabilities
- **Real-time Voice Conversations**: Direct voice interaction using Gemini Live API
- **Seamless Chat Integration**: Voice responses appear in the existing chat interface
- **Mixed Input Support**: Switch between text and voice input during conversations
- **Advanced Audio Processing**: High-quality speech synthesis with multiple voice options
- **Session Management**: Persistent voice sessions with conversation memory

### Voice Options
- **Available Voices**: Chime, Kore, Aoede, Fenix
- **Language Support**: EN-US, EN-GB, ES-ES, FR-FR, DE-DE, IT-IT, JA-JP, KO-KR
- **Audio Formats**: PCM, WAV, WebM

### Technical Features
- **WebSocket Streaming**: Real-time bidirectional audio streaming
- **Automatic Reconnection**: Robust connection handling with retry logic
- **Template Integration**: Uses existing chat templates for voice conversations
- **Memory Persistence**: Voice conversations saved to chat history

## Architecture

### Backend Components

#### GeminiVoiceService (`server/services/voice/GeminiVoiceService.js`)
- Manages WebSocket connections to Gemini Live API
- Handles audio/text input and output processing
- Maintains conversation memory and session state
- Provides event-driven architecture for real-time updates

#### Voice Controller (`server/controllers/voice/voice-controller.js`)
- RESTful API endpoints for voice session management
- Error handling and validation
- Integration with existing chat infrastructure

#### Voice Routes (`server/routes/voice-routes.js`)
- `/api/voice/session/start` - Start new voice session
- `/api/voice/session/:sessionId` - Stop voice session  
- `/api/voice/session/:sessionId/text` - Send text input
- `/api/voice/session/:sessionId/audio` - Send audio input
- `/api/voice/sessions` - Get active sessions
- `/api/voice/config` - Get voice configuration

### Frontend Components

#### VoiceAssistantButton (`ui/src/components/voice/VoiceAssistantButton.jsx`)
- Primary voice interface component
- Microphone recording controls
- Visual feedback for voice states
- Audio playback for AI responses

#### Voice Hooks (`ui/src/hooks/voice/`)
- `useVoiceRecording.js` - Audio recording management
- `useVoicePlayback.js` - Audio playback controls
- `useVoiceWebSocket.js` - WebSocket connection handling

#### Redux Integration
- `voiceSlice.js` - State management for voice features
- `voiceApi.js` - RTK Query API for voice endpoints
- WebSocket event handling through existing socketService

## Setup Instructions

### Prerequisites
1. Google API Key with Gemini 2.5 Pro access
2. Node.js 18+ with WebSocket support
3. Modern browser with Web Audio API support

### Environment Configuration
```bash
# Required for voice functionality
GOOGLE_API_KEY=your_gemini_api_key_here
GOOGLE_MODEL=gemini-2.5-pro

# Optional voice configuration
VOICE_DEFAULT_LANGUAGE=en-US
VOICE_DEFAULT_VOICE=Chime
VOICE_SESSION_TIMEOUT=3600000
```

### Installation
```bash
# Install voice dependencies (already completed)
npm install ws

# Start the server with voice support
npm run dev
```

## Usage Guide

### Starting a Voice Session
1. Open the AI Chat Assistant
2. Click the microphone button in the chat input
3. Grant microphone permissions when prompted
4. Voice session will automatically connect to Gemini Live API

### Voice Interaction
- **Voice Input**: Click and hold microphone button to record
- **Text Input**: Type messages normally (voice session remains active)
- **Voice Responses**: AI responses include both text and audio
- **Session Control**: Stop/start voice sessions as needed

### Integration with Existing Chat
- Voice conversations appear in chat history
- Template system applies to voice sessions
- Conversation memory spans text and voice inputs
- Chat features (templates, history, etc.) work with voice

## API Reference

### REST Endpoints

#### Start Voice Session
```http
POST /api/voice/session/start
Content-Type: application/json

{
  "sessionId": "unique-session-id",
  "template": "CHAT_GENERIC",
  "voice": "Chime",
  "language": "en-US"
}
```

#### Send Voice Text
```http
POST /api/voice/session/{sessionId}/text
Content-Type: application/json

{
  "text": "Hello, how are you?"
}
```

#### Send Voice Audio
```http
POST /api/voice/session/{sessionId}/audio
Content-Type: application/json

{
  "audioData": "base64-encoded-audio",
  "mimeType": "audio/pcm"
}
```

### WebSocket Events

#### Client to Server
- `start-voice-session` - Initialize voice session
- `stop-voice-session` - Terminate voice session
- `voice-audio-input` - Send audio data
- `voice-text-input` - Send text input

#### Server to Client
- `voice-session-connected` - Session established
- `voice-session-ready` - Ready for input
- `voice-text` - AI text response
- `voice-audio` - AI audio response
- `voice-session-error` - Error occurred

## Configuration Options

### Voice Settings
```javascript
// Available in voice configuration
{
  availableVoices: ['Chime', 'Kore', 'Aoede', 'Fenix'],
  supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT', 'ja-JP', 'ko-KR'],
  supportedAudioFormats: ['audio/pcm', 'audio/wav', 'audio/webm'],
  maxSessionDuration: 3600000, // 1 hour
}
```

### Template Integration
Voice sessions use the same template system as text chat:
- `CHAT_GENERIC` - General conversation
- `CHAT_DEV` - Development assistance
- Custom templates - User-defined conversation styles

## Troubleshooting

### Common Issues

#### "Voice session failed to start"
- Check Google API key configuration
- Verify internet connection
- Ensure Gemini 2.5 Pro access is enabled

#### "Microphone access denied"
- Check browser permissions
- Ensure HTTPS connection for production
- Try refreshing the page and granting permissions

#### "Audio not playing"
- Check browser audio settings
- Verify volume levels
- Test with different browsers

#### "Connection timeout"
- Check network connectivity
- Verify WebSocket support
- Try restarting the voice session

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
VOICE_DEBUG=true
```

## Security Considerations

### Audio Data
- Audio streams are processed in real-time
- No permanent audio storage on the server
- WebSocket connections use standard encryption

### API Keys
- Google API keys should be kept secure
- Use environment variables for configuration
- Implement rate limiting for production use

### User Privacy
- Microphone access requires explicit user permission
- Voice data is transmitted directly to Google's servers
- No audio recording stored locally

## Performance Optimization

### Audio Quality
- Use appropriate audio formats (PCM recommended)
- Implement audio compression for slower connections
- Optimize recording quality vs. bandwidth

### Session Management
- Limit concurrent voice sessions
- Implement session timeouts
- Clean up inactive sessions automatically

### WebSocket Optimization
- Use connection pooling for multiple sessions
- Implement heartbeat for connection health
- Handle network disconnections gracefully

## Future Enhancements

### Planned Features
- **Voice Commands**: Special commands for app navigation
- **Background Mode**: Continue voice sessions while using other features
- **Voice Profiles**: User-specific voice preferences
- **Multi-language Support**: Automatic language detection
- **Voice Analytics**: Usage statistics and insights

### Integration Opportunities
- **Jira Integration**: Voice-to-ticket creation
- **Email Composition**: Voice-to-email functionality
- **Code Review**: Voice comments on pull requests
- **Build Notifications**: Voice alerts for build status

## Support

For technical support or feature requests related to the voice assistant:

1. Check the troubleshooting section above
2. Review the server logs for error details
3. Test with the REST API endpoints directly
4. Verify WebSocket connectivity

The voice assistant leverages the existing chat infrastructure, so most chat-related configurations and troubleshooting steps also apply to voice functionality.

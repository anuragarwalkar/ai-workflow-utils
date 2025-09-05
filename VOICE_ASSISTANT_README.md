# AI Voice Assistant with Gemini 2.5 Pro

## Overview

This implementation adds a comprehensive AI voice assistant to your chat application using Google's Gemini 2.5 Pro Live API. The voice assistant provides real-time voice conversations with natural speech processing and generation.

## Features

### ✅ **Implemented Features**

- **Real-time Voice Conversations**: Direct integration with Gemini Live API for natural voice interactions
- **Voice Activity Detection**: Automatic detection of speech start/stop
- **Audio Recording**: High-quality audio capture with noise cancellation
- **Voice Status Indicators**: Visual feedback for connection, listening, and speaking states
- **Session Management**: Persistent voice sessions with conversation memory
- **Integration with Chat**: Voice messages appear in the regular chat interface
- **Multiple Voice Options**: Support for different voice personalities (Chime, Kore, Aoede, Fenix)
- **Error Handling**: Robust error handling with user-friendly messages
- **Reconnection Logic**: Automatic reconnection on connection failures

### 🔄 **Architecture**

```
Frontend (React)
├── VoiceAssistantButton.jsx - Main voice controls UI
├── useVoiceAssistant.js - Main voice hook
├── useVoiceSession.js - Session management
├── useVoiceRecording.js - Audio recording
└── Integrated with existing chat interface

Backend (Node.js/Express)
├── GeminiVoiceService.js - Core voice service
├── voice-controller.js - API endpoints
├── voice-routes.js - REST routes
└── WebSocket support for real-time audio
```

## Setup Instructions

### 1. **Environment Configuration**

Ensure your `.env` file has the Google API key configured:

```bash
# Google Gemini Configuration
GOOGLE_API_KEY=your_google_api_key_here
GOOGLE_MODEL=gemini-2.5-pro

# Optional: OpenAI Compatible API for Gemini
OPENAI_COMPATIBLE_MODEL=vertex_ai/gemini-2.5-pro
OPENAI_COMPATIBLE_BASE_URL=your_vertex_ai_endpoint
OPENAI_COMPATIBLE_API_KEY=your_vertex_ai_key
```

### 2. **Required Dependencies**

The implementation uses the existing dependencies. If you need to install WebSocket support:

```bash
# Backend
npm install ws

# Frontend (already included in most React setups)
# Uses native Web APIs: MediaRecorder, AudioContext, getUserMedia
```

### 3. **Browser Requirements**

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Partial support (some audio features may be limited)
- **HTTPS Required**: Voice features require secure context

## API Endpoints

### Voice Session Management

```bash
# Start voice session
POST /api/voice/session/start
{
  "sessionId": "unique-session-id",
  "template": "CHAT_GENERIC", 
  "voice": "Chime",
  "language": "en-US"
}

# Stop voice session
DELETE /api/voice/session/:sessionId

# Send text to voice session
POST /api/voice/session/:sessionId/text
{
  "text": "Hello, how are you?"
}

# Send audio to voice session
POST /api/voice/session/:sessionId/audio
{
  "audioData": "base64-encoded-audio",
  "mimeType": "audio/webm"
}

# Get active sessions
GET /api/voice/sessions

# Get conversation history
GET /api/voice/session/:sessionId/history

# Get voice configuration
GET /api/voice/config
```

## Usage Guide

### **Starting a Voice Conversation**

1. **Click the Voice Assistant Button**: The microphone icon in the chat interface
2. **Wait for Connection**: Status will show "Connecting..." then "Voice Ready"
3. **Start Recording**: Click the microphone button to begin speaking
4. **Speak Naturally**: Talk as you would in a normal conversation
5. **Stop Recording**: Click the stop button or the mic will auto-stop after silence
6. **Listen to Response**: Gemini will respond with natural speech

### **Voice Controls**

- 🎤 **Main Button**: Start/Stop voice assistant
- 🎙️ **Recording Button**: Start/Stop recording your voice
- 🔊 **Mute Button**: Mute/Unmute audio output
- 📊 **Status Indicator**: Shows current voice state

### **Status Indicators**

- **Idle**: Voice assistant not active
- **Connecting**: Establishing connection to Gemini Live API
- **Voice Ready**: Connected and ready for input
- **Listening**: Currently recording your voice (red pulsing indicator)
- **Speaking**: AI is generating speech response
- **Error**: Connection or processing error

## Technical Details

### **Audio Processing**

- **Sample Rate**: 16kHz for optimal quality/bandwidth balance
- **Format**: WebM with Opus codec for broad browser support
- **Processing**: Real-time audio encoding and streaming
- **Noise Reduction**: Built-in echo cancellation and noise suppression

### **Conversation Memory**

- Voice conversations are integrated with chat memory
- Messages appear in the regular chat interface
- Session history is maintained for context
- Supports conversation continuation across voice/text modes

### **Error Handling**

```javascript
// Common error scenarios handled:
- Microphone permission denied
- Network connectivity issues  
- API rate limiting
- Audio processing failures
- WebSocket connection drops
```

### **Performance Optimizations**

- Lazy loading of voice components
- Efficient audio buffering
- Automatic cleanup of resources
- Connection pooling for WebSocket

## Customization

### **Voice Personalities**

```javascript
const availableVoices = [
  'Chime',    // Default, friendly and warm
  'Kore',     // Professional and clear
  'Aoede',    // Creative and expressive  
  'Fenix'     // Calm and measured
];
```

### **Templates**

Voice conversations can use different chat templates:

- `CHAT_GENERIC`: General conversation
- `CHAT_DEV`: Developer-focused discussions
- Custom templates can be added through the template system

### **Audio Settings**

```javascript
// Modify in useVoiceRecording.js
const audioConstraints = {
  sampleRate: 16000,
  channelCount: 1,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
};
```

## Troubleshooting

### **Common Issues**

1. **Microphone Not Working**
   - Check browser permissions
   - Ensure HTTPS connection
   - Try refreshing the page

2. **Voice Assistant Won't Connect**
   - Verify Google API key is valid
   - Check network connectivity
   - Ensure API quotas are not exceeded

3. **Audio Quality Issues**
   - Check microphone quality
   - Ensure stable internet connection
   - Try different browser

4. **Connection Drops**
   - Automatic reconnection should handle this
   - Check browser console for errors
   - Verify WebSocket support

### **Debug Mode**

Enable detailed logging by setting:

```javascript
// In browser console
localStorage.setItem('voice-debug', 'true');
```

## Security Considerations

- All audio is processed through Google's secure APIs
- No audio data is stored locally
- Session IDs are unique and temporary
- HTTPS required for all voice features

## Future Enhancements

- **Real-time Transcription**: Live speech-to-text display
- **Voice Commands**: Trigger specific actions with voice
- **Multi-language Support**: Expanded language options
- **Voice Cloning**: Custom voice personalities
- **Background Processing**: Voice input while typing
- **Voice Analytics**: Conversation insights and metrics

## Support

For issues related to:
- **Voice Service**: Check `server/services/voice/GeminiVoiceService.js`
- **UI Components**: Check `ui/src/components/chat/VoiceAssistantButton.jsx`
- **API Endpoints**: Check `server/controllers/voice/voice-controller.js`
- **Hooks**: Check `ui/src/hooks/useVoice*.js`

## Contributing

When contributing to voice features:

1. Follow the existing functional programming patterns
2. Maintain consistency with logging patterns
3. Add proper error handling
4. Update this documentation for new features
5. Test across different browsers and devices

---

**Enjoy your new AI voice assistant powered by Gemini 2.5 Pro! 🎤✨**

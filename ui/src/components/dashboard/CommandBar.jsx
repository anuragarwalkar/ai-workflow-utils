import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  InputBase, 
  IconButton, 
  CircularProgress, 
  Typography, 
  Paper, 
  Collapse, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText, 
  Tooltip, 
  Chip,
  Fade
} from '@mui/material';
import { 
  Send as SendIcon, 
  Mic as MicIcon, 
  MicOff as MicOffIcon,
  Close as CloseIcon, 
  AutoAwesome as AiIcon,
  Add as AddIcon,
  KeyboardArrowDown as ChevronDownIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  TaskAlt as TaskIcon,
  AccessTime as ReminderIcon,
  Description as NoteIcon,
  Search as SearchIcon,
  SmartToy as BotIcon
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setCommandBarResponse, 
  clearCommandBarResponse, 
  selectCommandBarResponse,
  setSelectedModel,
  selectSelectedModel
} from '../../store/slices/dashboardSlice';
import { dashboardApi, useGetAvailableModelsQuery } from '../../store/api/dashboardApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../../config/environment.js';

const CommandBar = () => {
  const { isDark } = useAppTheme();
  const dispatch = useDispatch();
  const responseData = useSelector(selectCommandBarResponse);
  const selectedModel = useSelector(selectSelectedModel);
  
  const { data: modelsResponse } = useGetAvailableModelsQuery();
  const rawModels = modelsResponse?.data?.models || [];
  const availableModels = Array.from(new Map(rawModels.map(m => [m.id, m])).values());
  const defaultModel = modelsResponse?.data?.defaultModel;

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [streamedContent, setStreamedContent] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [respondingProvider, setRespondingProvider] = useState(null);
  const [copied, setCopied] = useState(false);

  // Plus menu & Model switcher menu anchors
  const [plusAnchorEl, setPlusAnchorEl] = useState(null);
  const [modelAnchorEl, setModelAnchorEl] = useState(null);

  // Voice recording state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  // Set default selected model if none is set yet
  useEffect(() => {
    if (!selectedModel && defaultModel) {
      dispatch(setSelectedModel(defaultModel));
    }
  }, [selectedModel, defaultModel, dispatch]);

  // Current active model object
  const activeModelObj = availableModels.find(m => m.id === selectedModel) || 
                         availableModels.find(m => m.id === defaultModel) || 
                         availableModels[0] || 
                         null;

  const activeModelLabel = activeModelObj?.shortName || activeModelObj?.name || 'Model';

  // Setup Web Speech API for voice dictation
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(prev => (prev ? prev + ' ' : '') + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };

  const handleClear = () => {
    dispatch(clearCommandBarResponse());
    setShowResponse(false);
    setStreamedContent('');
    setCurrentIntent(null);
    setRespondingProvider(null);
  };

  const handleCopyResponse = () => {
    const textToCopy = streamedContent || 
      (responseData?.result?.answer) || 
      (responseData?.result?.data ? JSON.stringify(responseData.result.data, null, 2) : '');
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    handleClear();
    setShowResponse(true);
    
    const textToProcess = inputText;
    setInputText('');
    const chosenProvider = selectedModel || defaultModel;

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/command?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ 
          text: textToProcess,
          provider: chosenProvider 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let finalResult = null;
      let finalIntent = null;
      let finalProvider = chosenProvider;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'intent') {
                setCurrentIntent(data.intent);
                finalIntent = data.intent;
              } else if (data.type === 'chunk') {
                setStreamedContent(prev => prev + data.content);
              } else if (data.type === 'done') {
                finalResult = data.result;
                if (data.provider) {
                  finalProvider = data.provider;
                  setRespondingProvider(data.provider);
                }
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
                setStreamedContent(prev => prev + '\n\n**Error:** ' + data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, line);
            }
          }
        }
      }

      dispatch(setCommandBarResponse({ intent: finalIntent, result: finalResult, provider: finalProvider }));
      
      // Force refresh of RTK Query caches to update other tiles
      if (finalIntent === 'reminder') dispatch(dashboardApi.util.invalidateTags(['Reminder']));
      if (finalIntent === 'todo') dispatch(dashboardApi.util.invalidateTags(['Todo']));
      if (finalIntent === 'note') dispatch(dashboardApi.util.invalidateTags(['Note', 'Summary']));

    } catch (err) {
      console.error('Command processing failed:', err);
      setStreamedContent('**Error:** Failed to process command. ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectAction = (prefix) => {
    setInputText(prefix);
    setPlusAnchorEl(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Box sx={{ width: '100%', mb: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Compact Gemini-style Pill Command Bar */}
      <Paper 
        elevation={0}
        sx={{ 
          width: '100%',
          maxWidth: { xs: '100%', sm: '720px', md: '780px' },
          minHeight: '54px',
          borderRadius: '32px',
          bgcolor: isDark ? 'rgba(24, 28, 38, 0.95)' : '#ffffff',
          border: isDark 
            ? '1px solid rgba(255, 255, 255, 0.12)' 
            : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: isDark 
            ? '0 6px 24px -2px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
            : '0 6px 20px -2px rgba(0, 0, 0, 0.07)',
          display: 'flex',
          alignItems: 'center',
          px: 1.8,
          py: 1,
          position: 'relative',
          zIndex: 10,
          transition: 'all 0.2s ease-in-out',
          '&:focus-within': {
            border: isDark 
              ? '1px solid rgba(139, 92, 246, 0.6)' 
              : '1px solid rgba(124, 58, 237, 0.45)',
            boxShadow: isDark
              ? '0 6px 28px 0 rgba(124, 58, 237, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 6px 24px 0 rgba(124, 58, 237, 0.15)',
          }
        }}
      >
        {/* Left Plus Action Button */}
        <Tooltip title="Quick actions">
          <IconButton 
            size="small"
            onClick={(e) => setPlusAnchorEl(e.currentTarget)}
            sx={{ 
              color: isDark ? '#94a3b8' : '#64748b',
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              width: 36,
              height: 36,
              mr: 1.2,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                color: isDark ? '#f8fafc' : '#0f172a'
              }
            }}
          >
            <AddIcon sx={{ fontSize: 22 }} />
          </IconButton>
        </Tooltip>

        {/* Plus Quick Actions Menu */}
        <Menu
          anchorEl={plusAnchorEl}
          open={Boolean(plusAnchorEl)}
          onClose={() => setPlusAnchorEl(null)}
          PaperProps={{
            sx: {
              borderRadius: '16px',
              mt: 1,
              minWidth: 200,
              bgcolor: isDark ? '#1e2433' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
            }
          }}
        >
          <MenuItem onClick={() => handleSelectAction('Add a todo to ')} sx={{ py: 1, gap: 1 }}>
            <ListItemIcon sx={{ minWidth: 28, color: '#10B981' }}><TaskIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Create To-Do" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
          </MenuItem>
          <MenuItem onClick={() => handleSelectAction('Remind me tomorrow at 9am to ')} sx={{ py: 1, gap: 1 }}>
            <ListItemIcon sx={{ minWidth: 28, color: '#F59E0B' }}><ReminderIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Set Reminder" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
          </MenuItem>
          <MenuItem onClick={() => handleSelectAction('Note: ')} sx={{ py: 1, gap: 1 }}>
            <ListItemIcon sx={{ minWidth: 28, color: '#3B82F6' }}><NoteIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Save Note / Idea" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
          </MenuItem>
          <MenuItem onClick={() => handleSelectAction('Search vector db for ')} sx={{ py: 1, gap: 1 }}>
            <ListItemIcon sx={{ minWidth: 28, color: '#00BFA5' }}><SearchIcon fontSize="small" /></ListItemIcon>
            <ListItemText primary="Search Vector DB (LanceDB)" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
          </MenuItem>
        </Menu>

        {/* Main Text Input */}
        <InputBase
          inputRef={inputRef}
          sx={{ 
            flex: 1, 
            color: isDark ? '#f8fafc' : '#0f172a',
            fontSize: '1rem',
            px: 0.5,
            py: 0.2,
            '& input::placeholder': {
              color: isDark ? '#64748b' : '#94a3b8',
              opacity: 1
            }
          }}
          placeholder={activeModelObj ? `Ask ${activeModelLabel}, add a note, set a reminder...` : "Ask anything, add a note, set a reminder..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
        />

        {/* Right Side Controls: Model Switcher, Mic, Send */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, ml: 0.5 }}>
          {/* Gemini-style Model Switcher Pill */}
          <Tooltip title="Switch AI Model">
            <Box
              onClick={(e) => setModelAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1.3,
                py: 0.55,
                borderRadius: '18px',
                cursor: 'pointer',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.05)',
                color: isDark ? '#cbd5e1' : '#475569',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                  color: isDark ? '#ffffff' : '#0f172a',
                  borderColor: isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(124, 58, 237, 0.3)',
                }
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.84rem',
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap'
                }}
              >
                {activeModelLabel}
              </Typography>
              <ChevronDownIcon sx={{ fontSize: 18, opacity: 0.7 }} />
            </Box>
          </Tooltip>

          {/* Model Switcher Menu */}
          <Menu
            anchorEl={modelAnchorEl}
            open={Boolean(modelAnchorEl)}
            onClose={() => setModelAnchorEl(null)}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                mt: 1,
                minWidth: 260,
                bgcolor: isDark ? '#1e2433' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isDark ? '0 10px 30px -5px rgba(0,0,0,0.6)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
                p: 0.5
              }
            }}
          >
            <Box sx={{ px: 1.5, py: 1, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)' }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select AI Model
              </Typography>
            </Box>

            {availableModels.length === 0 ? (
              <MenuItem disabled sx={{ py: 1.5 }}>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>Loading models...</Typography>
              </MenuItem>
            ) : (
              availableModels.map((model) => {
                const isSelected = (selectedModel === model.id) || (!selectedModel && model.id === defaultModel);
                return (
                  <MenuItem 
                    key={model.id}
                    onClick={() => {
                      dispatch(setSelectedModel(model.id));
                      setModelAnchorEl(null);
                    }}
                    sx={{ 
                      py: 1, 
                      my: 0.3,
                      borderRadius: '10px',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      bgcolor: isSelected 
                        ? (isDark ? 'rgba(124, 58, 237, 0.15)' : 'rgba(124, 58, 237, 0.08)') 
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <AiIcon sx={{ 
                        fontSize: 18, 
                        color: isSelected ? '#8B5CF6' : (isDark ? '#94a3b8' : '#64748b') 
                      }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400, color: isDark ? '#f8fafc' : '#0f172a' }}>
                          {model.name}
                        </Typography>
                        {model.model && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>
                            {model.model}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {isSelected && (
                      <CheckIcon sx={{ fontSize: 18, color: '#8B5CF6', ml: 1 }} />
                    )}
                  </MenuItem>
                );
              })
            )}
          </Menu>

          {/* Voice Input Mic Button */}
          <Tooltip title={isListening ? "Listening... (Click to stop)" : "Voice input"}>
            <IconButton 
              size="small" 
              onClick={toggleListening}
              sx={{ 
                color: isListening ? '#EF4444' : (isDark ? '#94a3b8' : '#64748b'),
                bgcolor: isListening ? (isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)') : 'transparent',
                width: 36,
                height: 36,
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { transform: 'scale(1)', opacity: 1 },
                  '50%': { transform: 'scale(1.15)', opacity: 0.8 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
                '&:hover': { 
                  color: isListening ? '#DC2626' : (isDark ? '#f8fafc' : '#0f172a'),
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' 
                }
              }}
            >
              {isListening ? <MicOffIcon sx={{ fontSize: 20 }} /> : <MicIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Send Button */}
          <IconButton 
            size="small" 
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            sx={{ 
              width: 36,
              height: 36,
              background: (!inputText.trim() || isProcessing) 
                ? (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)') 
                : 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
              color: 'white',
              boxShadow: (!inputText.trim() || isProcessing) ? 'none' : '0 2px 8px rgba(124, 58, 237, 0.4)',
              transition: 'all 0.15s ease',
              '&:hover': { 
                background: 'linear-gradient(135deg, #6D28D9 0%, #4F46E5 100%)',
                transform: 'scale(1.04)'
              },
              '&.Mui-disabled': { 
                color: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)',
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' 
              }
            }}
          >
            {isProcessing ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SendIcon sx={{ fontSize: 17 }} />
            )}
          </IconButton>
        </Box>
      </Paper>

      {/* Response Area */}
      <Collapse 
        in={showResponse} 
        sx={{ 
          width: '100%', 
          maxWidth: { xs: '100%', sm: '680px', md: '720px' }, 
          mt: 1.5 
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '20px',
            bgcolor: isDark ? 'rgba(20, 24, 33, 0.95)' : '#ffffff',
            border: isDark ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(124, 58, 237, 0.15)',
            boxShadow: isDark 
              ? '0 8px 24px -4px rgba(0, 0, 0, 0.5)' 
              : '0 8px 24px -4px rgba(124, 58, 237, 0.08)',
            position: 'relative'
          }}
        >
          {/* Header controls: Intent Chip, Provider Badge, Copy, Close */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<AiIcon sx={{ fontSize: '16px !important', color: '#8B5CF6 !important' }} />}
                label={currentIntent ? `Intent: ${currentIntent.charAt(0).toUpperCase() + currentIntent.slice(1)}` : 'Processing...'}
                size="small"
                sx={{
                  bgcolor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(124, 58, 237, 0.08)',
                  color: isDark ? '#c4b5fd' : '#7c3aed',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: isDark ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(124, 58, 237, 0.2)',
                  borderRadius: '12px'
                }}
              />

              {(respondingProvider || activeModelLabel) && (
                <Chip
                  label={respondingProvider || activeModelLabel}
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: '0.72rem',
                    height: 24,
                    borderRadius: '12px'
                  }}
                />
              )}

              {isProcessing && <CircularProgress size={14} sx={{ color: '#8B5CF6' }} />}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={copied ? "Copied!" : "Copy answer"}>
                <IconButton 
                  size="small" 
                  onClick={handleCopyResponse}
                  sx={{ color: copied ? '#10B981' : (isDark ? '#94a3b8' : '#64748b') }}
                >
                  <CopyIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Close">
                <IconButton 
                  size="small" 
                  onClick={handleClear}
                  sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Response Text / Markdown */}
          <Box sx={{ 
            color: isDark ? '#e2e8f0' : '#334155', 
            fontSize: '0.925rem',
            lineHeight: 1.6,
            '& p': { mt: 0, mb: 1 },
            '& p:last-child': { mb: 0 },
            '& pre': { 
              bgcolor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.04)', 
              p: 1.5, 
              borderRadius: '10px',
              overflowX: 'auto',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
            },
            '& code': {
              fontFamily: 'monospace',
              fontSize: '0.85rem'
            }
          }}>
            {streamedContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamedContent}</ReactMarkdown>
            ) : responseData?.result ? (
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {responseData.intent === 'reminder' && `✅ Reminder set successfully: ${responseData.result.data?.title || 'Reminder created'}`}
                {responseData.intent === 'todo' && `✅ To-Do added successfully: ${responseData.result.data?.title || 'To-Do created'}`}
                {responseData.intent === 'note' && `✅ Note saved successfully: ${responseData.result.data?.summary || 'Note saved'}`}
                {responseData.intent === 'query' && (responseData.result.answer || 'Query answered.')}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                Thinking...
              </Typography>
            )}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default CommandBar;

import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, CircularProgress, Typography, Paper, Collapse } from '@mui/material';
import { Send as SendIcon, Mic as MicIcon, AttachFile as AttachFileIcon, Close as CloseIcon, AutoAwesome as AiIcon } from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import { useDispatch, useSelector } from 'react-redux';
import { setCommandBarResponse, clearCommandBarResponse, selectCommandBarResponse } from '../../store/slices/dashboardSlice';
import { dashboardApi } from '../../store/api/dashboardApi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE_URL } from '../../config/environment.js';

const CommandBar = () => {
  const { isDark } = useAppTheme();
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIntent, setCurrentIntent] = useState(null);
  const [streamedContent, setStreamedContent] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  
  const dispatch = useDispatch();
  const responseData = useSelector(selectCommandBarResponse);
  const inputRef = useRef(null);

  const handleClear = () => {
    dispatch(clearCommandBarResponse());
    setShowResponse(false);
    setStreamedContent('');
    setCurrentIntent(null);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    handleClear();
    setShowResponse(true);
    
    const textToProcess = inputText;
    setInputText('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/command?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ text: textToProcess })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let finalResult = null;
      let finalIntent = null;

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
              } else if (data.type === 'error') {
                console.error('Stream error:', data.error);
                setStreamedContent(prev => prev + '\\n\\n**Error:** ' + data.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, line);
            }
          }
        }
      }

      dispatch(setCommandBarResponse({ intent: finalIntent, result: finalResult }));
      
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

  return (
    <Box sx={{ width: '100%', mb: 1, display: 'flex', flexDirection: 'column' }}>
      <Paper 
        elevation={isDark ? 0 : 2}
        sx={{ 
          width: '100%', 
          borderRadius: '24px',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          position: 'relative',
          zIndex: 10
        }}
      >
        <AiIcon sx={{ color: '#7C3AED', mr: 1, opacity: 0.7 }} />
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Ask anything, add a note, set a reminder..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { color: isDark ? '#f8fafc' : '#0f172a', py: 1 }
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
            <AttachFileIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
            <MicIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            sx={{ 
              bgcolor: '#7C3AED', 
              color: 'white',
              '&:hover': { bgcolor: '#6D28D9' },
              '&.Mui-disabled': { bgcolor: isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(124, 58, 237, 0.5)', color: 'rgba(255,255,255,0.7)' }
            }}
          >
            {isProcessing ? <CircularProgress size={18} color="inherit" /> : <SendIcon fontSize="small" sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      </Paper>

      {/* Response Area */}
      <Collapse in={showResponse} sx={{ width: '100%', maxWidth: '800px', mt: 2 }}>
        <Paper
          elevation={isDark ? 0 : 1}
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.9)' : '#f8fafc',
            border: isDark ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(124, 58, 237, 0.1)',
            position: 'relative'
          }}
        >
          <IconButton 
            size="small" 
            onClick={handleClear}
            sx={{ position: 'absolute', top: 8, right: 8, color: '#64748b' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AiIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: '#7C3AED', fontWeight: 600 }}>
              {currentIntent ? `Intent: ${currentIntent.charAt(0).toUpperCase() + currentIntent.slice(1)}` : 'Processing...'}
            </Typography>
            {isProcessing && <CircularProgress size={12} sx={{ color: '#7C3AED' }} />}
          </Box>

          <Box sx={{ color: isDark ? '#e2e8f0' : '#334155', '& p': { mt: 0, mb: 1.5 }, '& pre': { bgcolor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', p: 1, borderRadius: 1 } }}>
            {streamedContent ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamedContent}</ReactMarkdown>
            ) : responseData?.result ? (
              <Typography variant="body2">
                {responseData.intent === 'reminder' && `✅ Reminder set successfully: ${responseData.result.data.title}`}
                {responseData.intent === 'todo' && `✅ To-Do added successfully: ${responseData.result.data.title}`}
                {responseData.intent === 'note' && `✅ Note saved successfully: ${responseData.result.data.summary}`}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.7 }}>Thinking...</Typography>
            )}
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default CommandBar;

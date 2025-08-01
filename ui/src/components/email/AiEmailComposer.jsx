import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Fade,
  Slide,
  Collapse,
  Stack,
  Divider,
  Alert,
  Fab,
  Backdrop,
  CircularProgress,
  useTheme,
  alpha,
  Grow,
  Snackbar,
} from '@mui/material';
import {
  Send as SendIcon,
  AutoAwesome as MagicIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Preview as PreviewIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Subject as SubjectIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  KeyboardVoice as VoiceIcon,
  SmartToy as AiIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useComposeWithAIMutation, useSendAIEmailMutation } from '../../store/api/emailApi';

const AiEmailComposer = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // API hooks
  const [composeWithAI, { isLoading: isComposing }] = useComposeWithAIMutation();
  const [sendAIEmail, { isLoading: isSendingEmail }] = useSendAIEmailMutation();
  
  // State management
  const [prompt, setPrompt] = useState('');
  const [attachedImages, setAttachedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [emailDraft, setEmailDraft] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);

  // Handlers
  const handleImageUpload = useCallback((event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setAttachedImages(prev => [...prev, ...newImages]);
  }, []);

  const removeImage = useCallback((imageId) => {
    setAttachedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId);
      // Clean up object URLs
      prev.forEach(img => {
        if (img.id === imageId) {
          URL.revokeObjectURL(img.url);
        }
      });
      return updated;
    });
  }, []);

  const handleProcessPrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Convert attached images to base64 for API
      const imageData = await Promise.all(
        attachedImages.map(async (image) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: image.name,
              data: reader.result
            });
            reader.readAsDataURL(image.file);
          });
        })
      );

      const result = await composeWithAI({
        prompt,
        attachedImages: imageData
      }).unwrap();

      setEmailDraft(result.data);
      setShowPreview(true);
      setNotification({
        open: true,
        message: 'Email draft generated successfully!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to generate email:', err);
      setError('Failed to generate email. Please try again.');
      setNotification({
        open: true,
        message: 'Failed to generate email. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailDraft) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      await sendAIEmail({
        to: emailDraft.to,
        subject: emailDraft.subject,
        body: emailDraft.body,
        attachments: attachedImages.map(img => ({
          name: img.name,
          data: img.url
        }))
      }).unwrap();

      setNotification({
        open: true,
        message: 'Email sent successfully!',
        severity: 'success'
      });
      
      // Reset form
      setShowPreview(false);
      setPrompt('');
      setAttachedImages([]);
      setEmailDraft(null);
      
      // Navigate back after success
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Failed to send email:', err);
      setError('Failed to send email. Please try again.');
      setNotification({
        open: true,
        message: 'Failed to send email. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceInput = () => {
    setIsListening(!isListening);
    // Implement voice recognition here
  };

  const regenerateDraft = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Convert attached images to base64 for API
      const imageData = await Promise.all(
        attachedImages.map(async (image) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({
              name: image.name,
              data: reader.result
            });
            reader.readAsDataURL(image.file);
          });
        })
      );

      const result = await composeWithAI({
        prompt: prompt + " (regenerate with different tone)",
        attachedImages: imageData
      }).unwrap();

      setEmailDraft(result.data);
      setNotification({
        open: true,
        message: 'Email draft regenerated!',
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to regenerate email:', err);
      setError('Failed to regenerate email. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        pointerEvents: 'none'
      }}>
        {[...Array(20)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              background: 'white',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 3 + 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)', opacity: 0 },
                '50%': { transform: 'translateY(-100px)', opacity: 1 },
              }
            }}
          />
        ))}
      </Box>

      {/* Header */}
      <Box sx={{ 
        pt: 4, 
        pb: 2, 
        px: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Fade in timeout={600}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                color: 'white', 
                fontWeight: 700,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <AiIcon sx={{ fontSize: 40 }} />
              AI Email Composer
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: alpha(theme.palette.common.white, 0.8),
                fontWeight: 300
              }}
            >
              Natural language email generation with AI intelligence
            </Typography>
          </Box>
        </Fade>
        
        <IconButton 
          onClick={() => navigate('/')}
          sx={{ 
            color: 'white',
            background: alpha(theme.palette.common.white, 0.1),
            '&:hover': { background: alpha(theme.palette.common.white, 0.2) }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 1000 }}>
          <Slide direction="up" in timeout={800}>
            {/* Input Card */}
            <Card sx={{
              mb: 3,
              borderRadius: 3,
              background: alpha(theme.palette.common.white, 0.95),
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`
            }}>
              <CardContent sx={{ p: 4 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <MagicIcon color="primary" />
                  Tell AI what email you want to send
                </Typography>
                
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  placeholder="e.g., 'Send email to Anurag about project update with timeline' or 'Email team about tomorrow's meeting'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  variant="outlined"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      background: alpha(theme.palette.primary.main, 0.02),
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.04),
                      },
                      '&.Mui-focused': {
                        background: alpha(theme.palette.primary.main, 0.04),
                      }
                    }
                  }}
                />

                {/* Image Attachments */}
                {attachedImages.length > 0 && (
                  <Collapse in={attachedImages.length > 0}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                        Attached Images ({attachedImages.length})
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
                        {attachedImages.map((image) => (
                          <Grow key={image.id} in timeout={300}>
                            <Box sx={{ 
                              position: 'relative',
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: `2px solid ${theme.palette.divider}`
                            }}>
                              <img
                                src={image.url}
                                alt={image.name}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: 'cover'
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => removeImage(image.id)}
                                sx={{
                                  position: 'absolute',
                                  top: 4,
                                  right: 4,
                                  background: alpha(theme.palette.error.main, 0.8),
                                  color: 'white',
                                  '&:hover': {
                                    background: theme.palette.error.main,
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>
                          </Grow>
                        ))}
                      </Stack>
                    </Box>
                  </Collapse>
                )}

                {/* Action Buttons */}
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleProcessPrompt}
                    disabled={!prompt.trim() || isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <MagicIcon />}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      }
                    }}
                  >
                    {isProcessing ? 'Generating...' : 'Generate Email'}
                  </Button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      background: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': { background: alpha(theme.palette.primary.main, 0.2) }
                    }}
                  >
                    <ImageIcon />
                  </IconButton>

                  <IconButton
                    onClick={handleVoiceInput}
                    sx={{
                      background: isListening 
                        ? alpha(theme.palette.error.main, 0.2) 
                        : alpha(theme.palette.primary.main, 0.1),
                      color: isListening ? theme.palette.error.main : theme.palette.primary.main,
                      '&:hover': { 
                        background: isListening 
                          ? alpha(theme.palette.error.main, 0.3)
                          : alpha(theme.palette.primary.main, 0.2) 
                      }
                    }}
                  >
                    <VoiceIcon />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          </Slide>

          {/* Email Preview */}
          {showPreview && emailDraft && (
            <Slide direction="up" in={showPreview} timeout={500}>
              <Card sx={{
                borderRadius: 3,
                background: alpha(theme.palette.common.white, 0.95),
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`
              }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: theme.palette.text.primary,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <PreviewIcon color="primary" />
                        Email Preview
                      </Typography>
                      
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={`${emailDraft.confidence}% Confidence`}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        <IconButton onClick={regenerateDraft} disabled={isProcessing}>
                          <RefreshIcon />
                        </IconButton>
                      </Stack>
                    </Box>

                    {/* Email Fields */}
                    <Stack spacing={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <PersonIcon color="action" />
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, minWidth: 60 }}>
                          To:
                        </Typography>
                        <Chip 
                          avatar={<Avatar sx={{ width: 24, height: 24 }}>{emailDraft.to[0].toUpperCase()}</Avatar>}
                          label={emailDraft.to}
                          variant="outlined"
                          sx={{ borderRadius: 2 }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <SubjectIcon color="action" />
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, minWidth: 60 }}>
                          Subject:
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {emailDraft.subject}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                          Message Body:
                        </Typography>
                        <Paper sx={{ 
                          p: 3, 
                          borderRadius: 2, 
                          background: alpha(theme.palette.grey[50], 0.5),
                          border: `1px solid ${theme.palette.divider}`
                        }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              whiteSpace: 'pre-line',
                              lineHeight: 1.6,
                              color: theme.palette.text.primary
                            }}
                          >
                            {emailDraft.body}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* AI Suggestions */}
                      {emailDraft.suggestions && emailDraft.suggestions.length > 0 && (
                        <Box>
                          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                            AI Suggestions:
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                            {emailDraft.suggestions.map((suggestion, index) => (
                              <Chip
                                key={index}
                                label={suggestion}
                                size="small"
                                clickable
                                variant="outlined"
                                sx={{ borderRadius: 2 }}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>

                    {/* Send Button */}
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                      <Fab
                        variant="extended"
                        onClick={handleSendEmail}
                        disabled={isSending}
                        sx={{
                          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          color: 'white',
                          px: 4,
                          py: 1,
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0f8a7e 0%, #32d16a 100%)',
                          }
                        }}
                      >
                        {isSending ? (
                          <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                        ) : (
                          <SendIcon sx={{ mr: 1 }} />
                        )}
                        {isSending ? 'Sending...' : 'Send Email'}
                      </Fab>
                    </Box>
                  </CardContent>
                </Card>
              </Slide>
            )}
        </Box>
      </Box>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: theme.zIndex.drawer + 1 }}
        open={isProcessing}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            AI is crafting your perfect email...
          </Typography>
        </Box>
      </Backdrop>

      {/* Error Display */}
      {error && (
        <Box sx={{ 
          position: 'fixed', 
          top: 100, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: theme.zIndex.snackbar,
          width: '90%',
          maxWidth: 600
        }}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)' 
            }}
          >
            {error}
          </Alert>
        </Box>
      )}

      {/* Success/Error Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={notification.severity} 
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AiEmailComposer;

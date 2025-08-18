/* eslint-disable max-lines */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  SmartToy as AiIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import { CurlParser } from '../../utils/curlParser';

const ApiClientHeader = ({ 
  activeRequest, 
  glassMorphismStyle, 
  requests, 
  setActiveRequest, 
  onAddRequest,
  onCloseRequest,
  currentRequest,
  onUpdateRequest,
  onSendRequest,
  loading
}) => {
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const [inputValue, setInputValue] = useState('');
  const [curlError, setCurlError] = useState('');
  const navigate = useNavigate();

  // Sync input value with current request URL
  useEffect(() => {
    setInputValue(currentRequest?.url || '');
  }, [currentRequest?.url]);

  const handleInputChange = (event) => {
    const {value} = event.target;
    setInputValue(value);
    setCurlError('');

    // Check if this looks like a cURL command
    if (value.trim().startsWith('curl ')) {
      try {
        const parsed = CurlParser.parse(value);
        onUpdateRequest({
          method: parsed.method,
          url: parsed.url,
          headers: parsed.headers,
          params: parsed.params,
          body: parsed.body
        });
        setInputValue(parsed.url); // Show just the URL after parsing
      } catch {
        setCurlError('Invalid cURL command format');
      }
    } else {
      // Regular URL input
      onUpdateRequest({ url: value });
    }
  };

  const handleMethodChange = (event) => {
    onUpdateRequest({ method: event.target.value });
  };

  const handleSend = () => {
    onSendRequest(currentRequest);
  };

  const handleCloseTab = (event, index) => {
    event.stopPropagation();
    if (onCloseRequest) {
      onCloseRequest(index);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        ...glassMorphismStyle,
        ...(isDark && {
          background: '#1E1E1E',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }),
        borderRadius: 0,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        px: 3,
        py: 2,
      }}
    >
      {/* Top row - Title and tabs */}
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={2}>
        <Box alignItems="center" display="flex" gap={2}>
          <Typography
            aria-label="Go to Home"
            role="button"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            tabIndex={0}
            variant="h5"
            onClick={() => navigate('/')}
          >
            API Client
          </Typography>
          
          <Tabs
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                borderRadius: '12px 12px 0 0',
                mr: 1,
                minHeight: 40,
                textTransform: 'none',
                position: 'relative',
                paddingRight: '32px', // Space for close button
                '&:hover .close-icon': {
                  opacity: 1,
                },
              },
              '& .close-icon': {
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0,
                transition: 'opacity 0.2s',
                zIndex: 1,
              },
            }}
            value={activeRequest}
            variant="scrollable"
            onChange={(_, newValue) => setActiveRequest(newValue)}
          >
            {requests.map((req, index) => (
              <Tab
                key={req.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', pr: 2 }}>
                    {req.name}
                    {requests.length > 1 && (
                      <IconButton
                        className="close-icon"
                        size="small"
                        sx={{
                          ml: 1,
                          p: 0.5,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                          },
                        }}
                        onClick={(e) => handleCloseTab(e, index)}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </Box>
                }
                sx={{
                  background: index === activeRequest
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                }}
              />
            ))}
          </Tabs>
          
          <IconButton
            size="small"
            sx={{
              background: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2),
              },
            }}
            onClick={onAddRequest}
          >
            <AddIcon />
          </IconButton>
        </Box>

        <Box alignItems="center" display="flex" gap={1}>
          <Tooltip title="AI Assistant">
            <IconButton
              sx={{
                background: alpha('#ff9a9e', 0.1),
                color: '#ff9a9e',
                '&:hover': {
                  background: alpha('#ff9a9e', 0.2),
                },
              }}
            >
              <AiIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton 
              sx={{
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.2),
                },
              }}
              onClick={toggleTheme}
            >
              {isDark ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Request input bar */}
      <Box alignItems="stretch" display="flex" gap={2} sx={{ height: 48 }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            sx={{
              height: '48px',
              '& .MuiSelect-select': {
                fontWeight: 600,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
              },
              ...(isDark && {
                backgroundColor: '#2D2D2D',
                color: '#E0E0E0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              }),
            }}
            value={currentRequest?.method || 'GET'}
            onChange={handleMethodChange}
          >
            <MenuItem value="GET">GET</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="PATCH">PATCH</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
            <MenuItem value="HEAD">HEAD</MenuItem>
            <MenuItem value="OPTIONS">OPTIONS</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          error={!!curlError}
          helperText={curlError}
          InputProps={{
            startAdornment: inputValue.trim().startsWith('curl ') && (
              <CodeIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
            ),
          }}
          placeholder="Enter URL or paste cURL command here..."
          size="small"
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: '48px',
              ...(isDark && {
                backgroundColor: '#2D2D2D',
                color: '#E0E0E0',
                '& input::placeholder': {
                  color: '#A0A0A0',
                  opacity: 1,
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
              }),
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
              },
            },
          }}
          value={inputValue}
          onChange={handleInputChange}
        />

        <Button
          disabled={loading || !currentRequest?.url}
          startIcon={loading ? null : <SendIcon />}
          sx={{
            minWidth: 120,
            height: '48px',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            background: isDark 
              ? 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
              : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            '&:hover': {
              background: isDark
                ? 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)'
                : 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
            },
            '&:disabled': {
              background: isDark ? '#3A3A3A' : undefined,
              color: isDark ? '#888' : undefined,
            },
          }}
          variant="contained"
          onClick={handleSend}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </Box>

      {curlError ? <Alert severity="warning" sx={{ mt: 1 }}>
          {curlError}
        </Alert> : null}
    </Paper>
  );
};

export default ApiClientHeader;

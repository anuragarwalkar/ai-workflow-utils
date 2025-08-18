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
        px: 2,
        py: 1.5,
      }}
    >
      {/* Top row - Title and tabs */}
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={1.5}>
        <Box alignItems="center" display="flex" gap={1.5}>
          <Typography
            aria-label="Go to Home"
            role="button"
            sx={{
              fontWeight: 600,
              fontSize: '18px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            tabIndex={0}
            onClick={() => navigate('/')}
          >
            API Client
          </Typography>
          
          <Tabs
            scrollButtons="auto"
            sx={{
              minHeight: '32px',
              '& .MuiTabs-indicator': {
                display: 'none', // Remove the default indicator
              },
              '& .MuiTab-root': {
                borderRadius: '6px',
                mr: 0.5,
                minHeight: '32px',
                height: '32px',
                textTransform: 'none',
                fontSize: '13px',
                fontWeight: 500,
                position: 'relative',
                paddingRight: '28px', // Space for close button
                paddingLeft: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                minWidth: '120px',
                backgroundColor: 'transparent',
                color: theme.palette.text.secondary,
                border: `1px solid ${theme.palette.grey[300]}`,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                },
                '&:hover .close-icon': {
                  opacity: 1,
                },
                ...(isDark && {
                  backgroundColor: 'transparent',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#A0A0A0',
                  '&.Mui-selected': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    borderColor: theme.palette.primary.main,
                  },
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderColor: theme.palette.primary.main,
                  },
                }),
              },
              '& .close-icon': {
                position: 'absolute',
                right: 6,
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
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                      {req.name}
                    </Typography>
                    {requests.length > 1 && (
                      <IconButton
                        className="close-icon"
                        size="small"
                        sx={{
                          ml: 'auto',
                          p: 0.25,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.15),
                            color: theme.palette.error.main,
                          },
                        }}
                        onClick={(e) => handleCloseTab(e, index)}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
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
              width: '28px',
              height: '28px',
              background: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2),
              },
            }}
            onClick={onAddRequest}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        <Box alignItems="center" display="flex" gap={0.5}>
          <Tooltip title="AI Assistant">
            <IconButton
              size="small"
              sx={{
                width: '28px',
                height: '28px',
                background: alpha('#ff9a9e', 0.1),
                color: '#ff9a9e',
                '&:hover': {
                  background: alpha('#ff9a9e', 0.2),
                },
              }}
            >
              <AiIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton 
              size="small"
              sx={{
                width: '28px',
                height: '28px',
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.2),
                },
              }}
              onClick={toggleTheme}
            >
              {isDark ? <LightModeIcon sx={{ fontSize: 16 }} /> : <DarkModeIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Request input bar */}
      <Box alignItems="stretch" display="flex" gap={0.5} sx={{ height: 36 }}>
        <FormControl size="small" sx={{ minWidth: 90 }}>
          <Select
            aria-label="HTTP method"
            sx={{
              height: '36px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              '& .MuiSelect-select': {
                padding: '6px 24px 6px 8px',
                display: 'flex',
                alignItems: 'center',
                minHeight: 'unset',
                fontWeight: 500,
                color: theme.palette.text.primary,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.grey[300],
                borderWidth: '1px',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: '1px',
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.grey[50],
                opacity: 0.6,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.grey[200],
                },
              },
              '& .MuiSelect-icon': {
                right: '6px',
                color: theme.palette.grey[600],
                fontSize: '18px',
              },
              '&:hover .MuiSelect-icon': {
                color: theme.palette.primary.main,
              },
              ...(isDark && {
                backgroundColor: '#2D2D2D',
                color: '#E0E0E0',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '1px',
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '& .MuiSelect-icon': {
                  color: '#A0A0A0',
                },
                '&:hover .MuiSelect-icon': {
                  color: theme.palette.primary.main,
                },
              }),
            }}
            value={currentRequest?.method || 'GET'}
            onChange={handleMethodChange}
          >
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="GET"
            >
              GET
            </MenuItem>
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="POST"
            >
              POST
            </MenuItem>
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="PUT"
            >
              PUT
            </MenuItem>
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="PATCH"
            >
              PATCH
            </MenuItem>
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="DELETE"
            >
              DELETE
            </MenuItem>
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="HEAD"
            >
              HEAD
            </MenuItem>
            <MenuItem 
              sx={{
                fontSize: '13px',
                fontWeight: 500,
                minHeight: '32px',
                padding: '4px 12px',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                  },
                },
              }}
              value="OPTIONS"
            >
              OPTIONS
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          error={!!curlError}
          helperText={curlError}
          InputProps={{
            startAdornment: inputValue.trim().startsWith('curl ') && (
              <CodeIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 16 }} />
            ),
          }}
          placeholder="Enter URL or paste cURL command here..."
          size="small"
          sx={{
            flex: 1,
            marginBottom: 0,
            '& .MuiOutlinedInput-root': {
              height: '36px',
              borderRadius: '6px',
              fontSize: '13px',
              '& input': {
                fontWeight: 500,
              },
              '& fieldset': {
                borderColor: theme.palette.grey[300],
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
                borderWidth: '1px',
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
              },
              '&.Mui-disabled': {
                backgroundColor: theme.palette.grey[50],
                opacity: 0.6,
                '& fieldset': {
                  borderColor: theme.palette.grey[200],
                },
              },
              ...(isDark && {
                backgroundColor: '#2D2D2D',
                color: '#E0E0E0',
                '& input::placeholder': {
                  color: '#A0A0A0',
                  opacity: 1,
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                  borderWidth: '1px',
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
              }),
            },
          }}
          value={inputValue}
          onChange={handleInputChange}
        />

        <Button
          disabled={loading || !currentRequest?.url}
          startIcon={loading ? null : <SendIcon sx={{ fontSize: 16 }} />}
          sx={{
            borderRadius: '6px',
            fontWeight: 500,
            padding: '6px 12px',
            minWidth: '70px',
            textTransform: 'none',
            // Primary filled style
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            border: `1px solid ${theme.palette.primary.main}`,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              borderColor: theme.palette.primary.dark,
              boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
            '&:focus': {
              outline: 'none',
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
            '&:active': {
              backgroundColor: theme.palette.primary.dark,
              transform: 'translateY(1px)',
            },
            '&.Mui-disabled': {
              backgroundColor: theme.palette.grey[300],
              color: theme.palette.grey[500],
              borderColor: theme.palette.grey[300],
              opacity: 0.6,
            },
            // Icon spacing
            '& .MuiButton-startIcon': {
              marginLeft: 0,
              marginRight: '4px',
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

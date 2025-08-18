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
  Api as ApiIcon,
  Close as CloseIcon,
  Code as CodeIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import { CurlParser } from '../../utils/curlParser';

// Utility function to truncate long tab names
const truncateTabName = (name, maxLength = 20) => {
  if (!name || name.length <= maxLength) {
    return name;
  }
  return `${name.substring(0, maxLength)}...`;
};

// Futuristic Logo Component
const FuturisticLogo = ({ isDark, onClick }) => {
  return (
    <Box
      aria-label="Go to Home"
      role="button"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        userSelect: 'none',
        padding: '4px 8px',
        borderRadius: '8px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isDark 
          ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)' 
          : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.1)'}`,
        '&:hover': {
          transform: 'translateY(-1px)',
          background: isDark 
            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)' 
            : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
          boxShadow: isDark
            ? '0 4px 20px rgba(102, 126, 234, 0.3)'
            : '0 4px 20px rgba(102, 126, 234, 0.2)',
        },
        '&:active': {
          transform: 'translateY(0px)',
        },
      }}
      tabIndex={0}
      onClick={onClick}
    >
      {/* Icon with animated glow effect */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            filter: 'blur(4px)',
            opacity: 0.4,
            zIndex: -1,
          },
        }}
      >
        <ApiIcon 
          sx={{ 
            fontSize: 16, 
            color: 'white',
            filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.3))',
          }} 
        />
      </Box>
      
      {/* Text with gradient and futuristic styling */}
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '18px',
          background: isDark
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 60%, #a8edea 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 60%, #667eea 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px',
          textShadow: isDark ? '0 0 10px rgba(102, 126, 234, 0.5)' : 'none',
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        }}
      >
        API Client
      </Typography>
      
      {/* Optional pulsing dot indicator */}
      <Box
        sx={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#00ff88',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              opacity: 0.4,
              transform: 'scale(1)',
            },
            '50%': {
              opacity: 1,
              transform: 'scale(1.2)',
              boxShadow: '0 0 10px #00ff88',
            },
          },
        }}
      />
    </Box>
  );
};

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
          <FuturisticLogo 
            isDark={isDark} 
            onClick={() => navigate('/')} 
          />
          
                    <Tabs
            allowScrollButtonsMobile
            scrollButtons="auto"
            sx={{
              flex: 1,
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
              },
              '& .MuiTab-root': {
                minHeight: '36px',
                padding: '6px 12px',
                minWidth: '120px',
                maxWidth: '200px',
              },
              '& .MuiTabs-flexContainer': {
                gap: '4px',
              },
              '& .MuiTabs-scroller': {
                '& .MuiTabs-scrollButtons': {
                  width: '24px',
                  '&.Mui-disabled': {
                    opacity: 0.3,
                  },
                },
              },
              '.close-icon': {
                opacity: 0,
                transition: 'opacity 0.2s',
              },
              '&:hover .close-icon, .MuiTab-root:hover .close-icon': {
                opacity: 1,
              },
              '& .MuiTab-root:hover': {
                '& .close-icon': {
                  opacity: 1,
                },
              },
              '& .MuiTab-root:hover:not(.Mui-selected)': {
                backgroundColor: alpha(theme.palette.action.hover, 0.1),
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
                  <Tooltip arrow placement="top" title={req.name}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography 
                        sx={{ 
                          fontSize: '13px', 
                          fontWeight: 500,
                          maxWidth: '120px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {truncateTabName(req.name)}
                      </Typography>
                      {requests.length > 1 && (
                        <IconButton
                          className="close-icon"
                          size="small"
                          sx={{
                            ml: 'auto',
                            p: 0.25,
                            minWidth: 'auto',
                            flexShrink: 0,
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
                  </Tooltip>
                }
                sx={{
                  background: index === activeRequest
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  minWidth: 'auto',
                  maxWidth: '200px',
                  '& .MuiTab-root': {
                    padding: '6px 12px',
                  }
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

/* eslint-disable max-lines */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
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
import EnvironmentApiService from '../../services/environmentApiService';

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
        AI API Client
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

// Helper function to parse and highlight dynamic variables
const parseVariables = (text) => {
  if (!text) return [];
  
  // Support both {{variable}} and ${variable} syntax
  const variableRegex = /(\{\{[^}]+\}\}|\$\{[^}]+\})/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = variableRegex.exec(text)) !== null) {
    // Add text before the variable
    if (match.index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.index),
        isVariable: false,
        id: `text-${lastIndex}-${match.index}`,
      });
    }
    
    // Add the variable with styling
    const [, variableText] = match;
    const isHandlebarsStyle = variableText.startsWith('{{');
    parts.push({
      text: variableText,
      isVariable: true,
      isHandlebarsStyle,
      id: `var-${match.index}-${match.index + variableText.length}`,
    });
    
    lastIndex = match.index + variableText.length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      isVariable: false,
      id: `text-${lastIndex}-${text.length}`,
    });
  }
  
  return parts;
};

// Variable Preview Component
const VariablePreview = ({ value, isDark }) => {
  const parts = parseVariables(value);
  
  if (parts.length === 0) return null;
  
  const getVariableColors = (isHandlebarsStyle, isDark) => {
    if (isHandlebarsStyle) {
      // {{variable}} style - use green/blue
      return {
        color: isDark ? '#00ff88' : '#1976d2',
        backgroundColor: isDark ? 'rgba(0, 255, 136, 0.15)' : 'rgba(25, 118, 210, 0.15)',
      };
    } else {
      // ${variable} style - use orange/purple
      return {
        color: isDark ? '#ff9800' : '#7b1fa2',
        backgroundColor: isDark ? 'rgba(255, 152, 0, 0.15)' : 'rgba(123, 31, 162, 0.15)',
      };
    }
  };
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '1px',
        left: '1px',
        right: '1px',
        bottom: '1px',
        padding: '8px 14px',
        pointerEvents: 'none',
        zIndex: 1, // Above the input
        display: 'flex',
        alignItems: 'center',
        fontSize: '13px',
        fontWeight: 500,
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        borderRadius: '5px',
      }}
    >
      {parts.map((part) => {
        const colors = part.isVariable ? getVariableColors(part.isHandlebarsStyle, isDark) : {};
        
        return (
          <span
            key={part.id}
            style={{
              color: part.isVariable ? colors.color : (isDark ? '#E0E0E0' : '#333'),
              backgroundColor: part.isVariable ? colors.backgroundColor : 'transparent',
              borderRadius: part.isVariable ? '3px' : '0',
              padding: part.isVariable ? '1px 4px' : '0',
              fontWeight: part.isVariable ? 600 : 500,
              textShadow: part.isVariable && isDark 
                ? `0 0 6px ${colors.color}40` 
                : 'none',
            }}
          >
            {part.text}
          </span>
        );
      })}
    </Box>
  );
};

// Environment Variable Input with autocomplete
const EnvironmentVariableInput = ({ 
  value, 
  error, 
  helperText, 
  placeholder, 
  variableSuggestions, 
  activeEnvironment,
  theme, 
  isDark,
  onChange 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [pendingCursorPosition, setPendingCursorPosition] = useState(null);
  const inputRef = useRef(null);

  return (
    <VariableInputContainer
      activeEnvironment={activeEnvironment}
      cursorPosition={cursorPosition}
      dropdownPosition={dropdownPosition}
      error={error}
      helperText={helperText}
      inputRef={inputRef}
      isDark={isDark}
      pendingCursorPosition={pendingCursorPosition}
      placeholder={placeholder}
      selectedSuggestionIndex={selectedSuggestionIndex}
      setCursorPosition={setCursorPosition}
      setDropdownPosition={setDropdownPosition}
      setPendingCursorPosition={setPendingCursorPosition}
      setSelectedSuggestionIndex={setSelectedSuggestionIndex}
      setShowSuggestions={setShowSuggestions}
      setSuggestions={setSuggestions}
      showSuggestions={showSuggestions}
      suggestions={suggestions}
      theme={theme}
      value={value}
      variableSuggestions={variableSuggestions}
      onChange={onChange}
    />
  );
};

// Main input container with all functionality
const VariableInputContainer = ({
  value,
  error,
  helperText,
  placeholder,
  variableSuggestions,
  activeEnvironment,
  theme,
  isDark,
  onChange,
  suggestions,
  setSuggestions,
  showSuggestions,
  setShowSuggestions,
  cursorPosition,
  setCursorPosition,
  dropdownPosition,
  setDropdownPosition,
  selectedSuggestionIndex,
  setSelectedSuggestionIndex,
  pendingCursorPosition,
  setPendingCursorPosition,
  inputRef,
}) => {

  // Calculate dropdown position based on input field
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [inputRef, setDropdownPosition]);

  // Check if cursor is inside variable syntax
  const checkVariableContext = (value, cursorPos) => {
    const beforeCursor = value.substring(0, cursorPos);
    const lastOpenHandlebars = beforeCursor.lastIndexOf('{{');
    const lastCloseHandlebars = beforeCursor.lastIndexOf('}}');
    const lastOpenDollar = beforeCursor.lastIndexOf('${');
    const lastCloseDollar = beforeCursor.lastIndexOf('}');
    
    // Check for {{}} syntax
    const inHandlebars = lastOpenHandlebars > lastCloseHandlebars && lastOpenHandlebars !== -1;
    // Check for ${} syntax
    const inDollar = lastOpenDollar > lastCloseDollar && lastOpenDollar !== -1;
    
    if (inHandlebars) {
      return { isInVariable: true, prefix: beforeCursor.substring(lastOpenHandlebars + 2) };
    }
    if (inDollar) {
      return { isInVariable: true, prefix: beforeCursor.substring(lastOpenDollar + 2) };
    }
    
    return { isInVariable: false, prefix: '' };
  };

  // Update suggestions based on variable context
  const updateSuggestions = (prefix) => {
    const filteredSuggestions = variableSuggestions.filter(variable =>
      variable.toLowerCase().includes(prefix.toLowerCase())
    );
    setSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
    setSelectedSuggestionIndex(0); // Reset selection
    updateDropdownPosition();
  };

  // Handle keyboard navigation
  const handleKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        if (suggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Detect when user types {{ or ${ and show variable suggestions
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    const cursorPos = event.target.selectionStart;
    
    const { isInVariable, prefix } = checkVariableContext(newValue, cursorPos);
    
    if (isInVariable) {
      setCursorPosition(cursorPos);
      updateSuggestions(prefix);
    } else {
      setShowSuggestions(false);
    }
    
    onChange(event);
  };

  // Build new suggestion value and position
  const buildSuggestionReplacement = (suggestion, currentCursorPos) => {
    const beforeCursor = value.substring(0, currentCursorPos);
    const afterCursor = value.substring(currentCursorPos);
    const lastOpenHandlebars = beforeCursor.lastIndexOf('{{');
    const lastOpenDollar = beforeCursor.lastIndexOf('${');
    
    if (lastOpenHandlebars > lastOpenDollar) {
      // Using {{}} syntax
      const prefix = value.substring(0, lastOpenHandlebars);
      const newValue = `${prefix}{{${suggestion}}}${afterCursor}`;
      const finalPosition = prefix.length + suggestion.length + 4; // length of {{}} = 4
      return { newValue, finalPosition };
    } else if (lastOpenDollar !== -1) {
      // Using ${} syntax
      const prefix = value.substring(0, lastOpenDollar);
      const newValue = `${prefix}\${${suggestion}}${afterCursor}`;
      const finalPosition = prefix.length + suggestion.length + 3; // length of ${} = 3
      return { newValue, finalPosition };
    }
    return null;
  };

  const handleSuggestionClick = (suggestion) => {
    // Get current cursor position from the actual input
    const currentCursorPos = inputRef.current ? inputRef.current.selectionStart : cursorPosition;
    const result = buildSuggestionReplacement(suggestion, currentCursorPos);
    
    if (!result) return;
    
    const { newValue, finalPosition } = result;
    
    // Set pending cursor position to be applied after value update
    setPendingCursorPosition(finalPosition);
    
    // Create a synthetic event
    const syntheticEvent = {
      target: { value: newValue }
    };
    onChange(syntheticEvent);
    setShowSuggestions(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    if (showSuggestions) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSuggestions, setShowSuggestions]);

  // Update position on scroll/resize
  useEffect(() => {
    const handleUpdate = () => {
      if (showSuggestions) {
        updateDropdownPosition();
      }
    };
    
    if (showSuggestions) {
      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [showSuggestions, updateDropdownPosition]);

  // Handle pending cursor position after value changes
  const handleCursorPositioning = useCallback(() => {
    if (pendingCursorPosition !== null && inputRef.current) {
      const input = inputRef.current;
      input.focus();
      
      // Handle both input and textarea elements
      if (input.setSelectionRange) {
        input.setSelectionRange(pendingCursorPosition, pendingCursorPosition);
      } else if (input.selectionStart !== undefined) {
        input.selectionStart = pendingCursorPosition;
        input.selectionEnd = pendingCursorPosition;
      }
      
      setPendingCursorPosition(null);
    }
  }, [pendingCursorPosition, setPendingCursorPosition, inputRef]);

  useEffect(() => {
    handleCursorPositioning();
  }, [value, handleCursorPositioning]);

  return (
    <Box sx={{ position: 'relative', flex: 1 }}>
      <TextField
        fullWidth
        error={error}
        helperText={helperText}
        InputProps={{
          startAdornment: value.trim().startsWith('curl ') && (
            <CodeIcon sx={{ color: theme.palette.text.secondary, mr: 1, fontSize: 16 }} />
          ),
          sx: {
            position: 'relative',
            '& input': {
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'transparent',
              // Apply variable highlighting using text color
              color: 'transparent', // Hide default text
            },
          },
        }}
        inputRef={inputRef}
        placeholder={placeholder}
        size="small"
        sx={{
          marginBottom: 0,
          '& .MuiOutlinedInput-root': {
            height: '36px',
            borderRadius: '6px',
            fontSize: '13px',
            position: 'relative',
            '& input': {
              fontWeight: 500,
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'transparent',
              caretColor: isDark ? '#E0E0E0' : '#333', // Show cursor
              '&::selection': {
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
              },
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
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
      
      {/* Variable highlighting overlay */}
      <VariablePreview isDark={isDark} value={value} />
      
      {/* Variable suggestions dropdown using Portal */}
      {showSuggestions && suggestions.length > 0 ? createPortal(
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 10000, // Very high z-index
            maxHeight: 200,
            overflow: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <Box
              key={suggestion}
              sx={{
                p: 1,
                cursor: 'pointer',
                fontSize: '12px',
                backgroundColor: index === selectedSuggestionIndex
                  ? theme.palette.action.selected
                  : 'transparent',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                },
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur
                handleSuggestionClick(suggestion);
              }}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
            >
              <Typography sx={{ fontFamily: 'monospace' }} variant="body2">
                {suggestion}
              </Typography>
              {activeEnvironment?.variables?.[suggestion] ? (
                <Typography 
                  sx={{ 
                    color: theme.palette.text.secondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 150,
                  }}
                  variant="caption"
                >
                  {activeEnvironment.variables[suggestion]}
                </Typography>
              ) : null}
            </Box>
          ))}
        </Paper>,
        document.body // Render at document root
      ) : null}
    </Box>
  );
};

const ApiClientHeader = ({ 
  activeEnvironment,
  activeRequest, 
  currentRequest,
  environments,
  glassMorphismStyle, 
  loading,
  requests, 
  setActiveRequest, 
  onAddRequest,
  onCloseRequest,
  onSendRequest,
  onUpdateRequest,
}) => {
  const theme = useTheme();
  const { isDark, toggleTheme } = useAppTheme();
  const [inputValue, setInputValue] = useState('');
  const [curlError, setCurlError] = useState('');
  const navigate = useNavigate();

  // Get variable suggestions for autocomplete
  const getVariableSuggestions = () => {
    return EnvironmentApiService.getVariableSuggestions(environments || []);
  };

  // Substitute variables in text
  const substituteVariables = (text) => {
    if (!activeEnvironment || !text) return text;
    return EnvironmentApiService.substituteVariables(text, activeEnvironment.variables || {});
  };

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
    // Create a copy of the request with environment variables substituted
    const processedRequest = {
      ...currentRequest,
      url: substituteVariables(currentRequest?.url || ''),
      headers: Object.fromEntries(
        Object.entries(currentRequest?.headers || {}).map(([key, value]) => [
          substituteVariables(key),
          substituteVariables(value)
        ])
      ),
      body: substituteVariables(currentRequest?.body || '')
    };
    
    onSendRequest(processedRequest);
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
                transition: 'background-color 0.2s',
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

        <EnvironmentVariableInput
          activeEnvironment={activeEnvironment}
          error={!!curlError}
          helperText={curlError}
          isDark={isDark}
          placeholder="Enter URL or paste cURL command here..."
          theme={theme}
          value={inputValue}
          variableSuggestions={getVariableSuggestions()}
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

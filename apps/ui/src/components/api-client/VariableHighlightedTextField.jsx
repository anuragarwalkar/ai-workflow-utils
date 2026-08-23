import React from 'react';
import { 
  Box, 
  TextField, 
  alpha 
} from '@mui/material';

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
const VariablePreview = ({ value, isDark, multiline = false }) => {
  const parts = parseVariables(value);
  
  if (parts.length === 0) return null;
  
  const getVariableColors = (isHandlebarsStyle, isDark) => {
    if (isHandlebarsStyle) {
      // {{variable}} style - use green/blue
      return {
        color: isDark ? '#00ff88' : '#1976d2',
        backgroundColor: isDark ? 'rgba(0, 255, 136, 0.1)' : 'rgba(25, 118, 210, 0.1)',
        textShadow: isDark ? '0 0 8px rgba(0, 255, 136, 0.5)' : 'none',
      };
    } else {
      // ${variable} style - use orange/purple
      return {
        color: isDark ? '#ff9800' : '#7b1fa2',
        backgroundColor: isDark ? 'rgba(255, 152, 0, 0.1)' : 'rgba(123, 31, 162, 0.1)',
        textShadow: isDark ? '0 0 8px rgba(255, 152, 0, 0.5)' : 'none',
      };
    }
  };
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        padding: multiline ? '16.5px 14px' : '8px 14px',
        pointerEvents: 'none',
        zIndex: 1,
        display: 'flex',
        alignItems: multiline ? 'flex-start' : 'center',
        fontSize: '14px',
        fontWeight: 400,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        overflow: 'hidden',
        lineHeight: multiline ? 1.4375 : 'normal',
      }}
    >
      {parts.map((part) => {
        const colors = part.isVariable ? getVariableColors(part.isHandlebarsStyle, isDark) : {};
        
        return (
          <span
            key={part.id}
            style={{
              color: part.isVariable ? colors.color : 'transparent',
              backgroundColor: part.isVariable ? colors.backgroundColor : 'transparent',
              borderRadius: part.isVariable ? '3px' : '0',
              padding: part.isVariable ? '1px 3px' : '0',
              fontWeight: part.isVariable ? 600 : 400,
              textShadow: part.isVariable ? colors.textShadow : 'none',
            }}
          >
            {part.text}
          </span>
        );
      })}
    </Box>
  );
};

// Variable Highlighted TextField Component
const VariableHighlightedTextField = ({ 
  value = '', 
  isDark = false, 
  theme,
  multiline = false,
  rows = 1,
  ...textFieldProps 
}) => {
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...textFieldProps}
        InputProps={{
          ...textFieldProps.InputProps,
          sx: {
            position: 'relative',
            '& input, & textarea': {
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'transparent',
              '&::selection': {
                backgroundColor: alpha(theme?.palette?.primary?.main || '#1976d2', 0.3),
              },
            },
            ...textFieldProps.InputProps?.sx,
          },
        }}
        multiline={multiline}
        rows={multiline ? rows : undefined}
        sx={{
          '& .MuiOutlinedInput-root': {
            position: 'relative',
            fontSize: '14px',
            '& input, & textarea': {
              fontWeight: 400,
              position: 'relative',
              zIndex: 2,
              backgroundColor: 'transparent',
            },
            ...(isDark && {
              backgroundColor: '#2D2D2D',
              color: '#E0E0E0',
              '& input::placeholder, & textarea::placeholder': {
                color: '#A0A0A0',
                opacity: 1,
              },
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&:hover fieldset': {
                borderColor: theme?.palette?.primary?.main || '#1976d2',
                boxShadow: `0 0 0 1px ${alpha(theme?.palette?.primary?.main || '#1976d2', 0.2)}`,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme?.palette?.primary?.main || '#1976d2',
                borderWidth: '1px',
                boxShadow: `0 0 0 2px ${alpha(theme?.palette?.primary?.main || '#1976d2', 0.2)}`,
              },
            }),
          },
          ...textFieldProps.sx,
        }}
        value={value}
      />
      
      {/* Variable highlighting overlay */}
      <VariablePreview isDark={isDark} multiline={multiline} value={value} />
    </Box>
  );
};

export default VariableHighlightedTextField;

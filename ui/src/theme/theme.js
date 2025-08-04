import { createTheme } from '@mui/material/styles';

// Theme mode detection utility
export const getSystemTheme = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

// Create theme factory function
export const createAppTheme = (mode = 'auto') => {
  // Determine actual theme mode
  let themeMode = mode;
  if (mode === 'auto') {
    themeMode = getSystemTheme();
  }

  const isDark = themeMode === 'dark';

  return createTheme({
    palette: {
      mode: themeMode,
      primary: {
        main: '#667eea',
        dark: '#5a67d8',
        light: '#7c3aed',
      },
      secondary: {
        main: '#f093fb',
        dark: '#f093fb',
        light: '#f5f7fa',
      },
      background: {
        default: isDark 
          ? '#1a202c'
          : '#f7fafc',
        paper: isDark 
          ? 'rgba(45, 55, 72, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
      },
      text: {
        primary: isDark ? '#f7fafc' : '#2d3748',
        secondary: isDark ? '#cbd5e0' : '#4a5568',
      },
      success: {
        main: '#48bb78',
        light: '#68d391',
      },
      info: {
        main: '#4299e1',
        light: '#63b3ed',
      },
      warning: {
        main: '#ed8936',
        light: '#f6ad55',
      },
      // Custom colors for dark theme
      divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        background: isDark 
          ? 'linear-gradient(45deg, #667eea 30%, #f093fb 90%)'
          : 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textAlign: 'center',
        marginBottom: '2rem',
      },
      h2: {
        fontSize: '1.75rem',
        fontWeight: 600,
        marginBottom: '1.5rem',
        color: isDark ? '#f7fafc' : '#2d3748',
      },
      h3: {
        fontSize: '1.25rem',
        fontWeight: 600,
        marginBottom: '1rem',
        color: isDark ? '#cbd5e0' : '#4a5568',
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.5px',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '12px',
            padding: '14px 28px',
            fontSize: '1.1rem',
            fontWeight: 600,
            letterSpacing: '0.5px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            boxShadow: '0 4px 14px 0 rgba(102, 126, 234, 0.3)',
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(102, 126, 234, 0.4)',
              transform: 'translateY(-2px)',
              background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            marginBottom: '1.5rem',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: isDark 
                ? 'rgba(45, 55, 72, 0.9)'
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: isDark 
                  ? 'rgba(45, 55, 72, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
              },
              '&.Mui-focused': {
                backgroundColor: isDark 
                  ? 'rgba(45, 55, 72, 1)'
                  : 'rgba(255, 255, 255, 1)',
                boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '20px',
            boxShadow: isDark 
              ? '0 10px 40px rgba(0, 0, 0, 0.3)'
              : '0 10px 40px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: isDark 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: isDark 
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          },
        },
      },
      MuiContainer: {
        styleOverrides: {
          root: {
            maxWidth: '900px',
            margin: '40px auto',
            padding: '20px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            boxShadow: isDark 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            border: isDark 
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: isDark 
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDark 
                ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                : '0 12px 40px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
    },
    spacing: 8,
  });
};

// Default theme with auto mode
const theme = createAppTheme('auto');

export default theme;

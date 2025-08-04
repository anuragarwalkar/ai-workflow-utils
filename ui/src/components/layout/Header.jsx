import { Typography, Box, Avatar, IconButton } from '@mui/material';
import {
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { resetCreateJira, resetViewJira } from '../../store/slices/jiraSlice';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Reset all state and go back to home
    navigate('/');
    dispatch(resetCreateJira());
    dispatch(resetViewJira());
  };

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: '60px',
        py: 1,
        mb: 2,
        px: 2,
      }}
    >
      {/* Left spacer */}
      <Box sx={{ width: 48 }} />

      {/* Center logo */}
      <Box
        onClick={handleLogoClick}
        sx={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 4,
          py: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '16px',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.15)',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          },
        }}
      >
        <Avatar
          sx={{
            width: 48,
            height: 48,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1) rotate(5deg)',
              boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
            },
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PsychologyIcon sx={{ fontSize: 24, color: 'white' }} />
            <AutoAwesomeIcon
              sx={{
                fontSize: 12,
                color: '#f093fb',
                position: 'absolute',
                top: -2,
                right: -2,
                animation: 'pulse 2s infinite',
              }}
            />
          </Box>
        </Avatar>
        <Typography
          variant='h4'
          component='h1'
          sx={{
            color: 'white',
            fontWeight: 700,
            letterSpacing: '1px',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          AI Workflow Utils
        </Typography>
        <Typography
          variant='caption'
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.7rem',
            fontWeight: 500,
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            px: 1,
            py: 0.3,
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          v {__APP_VERSION__}
        </Typography>
      </Box>

      {/* Right side controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ThemeToggle />
        <IconButton
          onClick={handleSettingsClick}
          sx={{
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.1)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Header;

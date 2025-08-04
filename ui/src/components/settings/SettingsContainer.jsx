import React, { useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Description as TemplateIcon,
  Tune as TuneIcon,
  Api as ApiIcon,
  Build as BuildIcon,
  Assignment as LogsIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentTab,
  selectError,
  setCurrentTab,
  clearError,
  setTemplates,
  setSettings,
} from '../../store/slices/templateSlice';
import {
  useGetAllTemplatesQuery,
  useGetSettingsQuery,
} from '../../store/api/templateApi';
import TemplateSettings from './templates/TemplateSettings';
import GeneralSettings from './general/GeneralSettings';
import EnvironmentSettings from './environment/EnvironmentSettings';
import AdvancedSettings from './advanced/AdvancedSettings';
import LogsViewer from './advanced/LogsViewer';
import { useAppTheme } from '../../theme/useAppTheme';

const SettingsContainer = () => {
  const dispatch = useDispatch();
  const currentTab = useSelector(selectCurrentTab);
  const error = useSelector(selectError);
  const { isDark } = useAppTheme();

  // Fetch templates and settings
  const { data: templates, isLoading: templatesLoading } =
    useGetAllTemplatesQuery();
  const { data: settings, isLoading: settingsLoading } = useGetSettingsQuery();

  // Update Redux state when data is fetched
  useEffect(() => {
    if (templates) {
      dispatch(setTemplates(templates));
    }
  }, [templates, dispatch]);

  useEffect(() => {
    if (settings) {
      dispatch(setSettings(settings));
    }
  }, [settings, dispatch]);

  const handleTabChange = (event, newValue) => {
    dispatch(setCurrentTab(newValue));
    dispatch(clearError());
  };

  const tabs = [
    {
      value: 'templates',
      label: 'Templates',
      icon: <TemplateIcon />,
      component: <TemplateSettings />,
    },
    {
      value: 'general',
      label: 'General',
      icon: <TuneIcon />,
      component: <GeneralSettings />,
    },
    {
      value: 'api',
      label: 'Environment',
      icon: <ApiIcon />,
      component: <EnvironmentSettings />,
    },
    {
      value: 'advanced',
      label: 'Advanced',
      icon: <BuildIcon />,
      component: <AdvancedSettings />,
    },
    {
      value: 'logs',
      label: 'Logs',
      icon: <LogsIcon />,
      component: <LogsViewer />,
    },
  ];

  const currentTabData = tabs.find(tab => tab.value === currentTab);

  if (templatesLoading || settingsLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
          }}
        >
          <Typography>Loading settings...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth='lg' sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SettingsIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant='h4' component='h1' sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
        </Box>
        <Typography variant='body1' color='text.secondary'>
          Configure templates, API settings, and application preferences
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity='error'
          sx={{ mb: 3 }}
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      {/* Settings Content */}
      <Paper
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: isDark
            ? 'rgba(45, 55, 72, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Tabs */}
        <Box
          sx={{
            borderBottom: 1,
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'divider',
            bgcolor: isDark ? 'rgba(45, 55, 72, 0.8)' : 'grey.50',
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: isDark
                  ? 'rgba(255, 255, 255, 0.7)'
                  : 'rgba(0, 0, 0, 0.7)',
                '&.Mui-selected': {
                  color: isDark ? '#ffffff' : 'primary.main',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: isDark ? '#667eea' : 'primary.main',
              },
            }}
          >
            {tabs.map(tab => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.label}
                icon={tab.icon}
                iconPosition='start'
                sx={{
                  '& .MuiTab-iconWrapper': {
                    mr: 1,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ p: 3 }}>{currentTabData?.component}</Box>
      </Paper>
    </Container>
  );
};

export default SettingsContainer;

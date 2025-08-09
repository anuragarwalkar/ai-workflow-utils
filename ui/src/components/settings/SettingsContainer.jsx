import React, { useEffect } from 'react';
import {
  Alert,
  Box,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  Api as ApiIcon,
  Build as BuildIcon,
  Assignment as LogsIcon,
  Settings as SettingsIcon,
  Description as TemplateIcon,
  Tune as TuneIcon,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearError,
  selectCurrentTab,
  selectError,
  setCurrentTab,
  setSettings,
  setTemplates,
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
          <Typography component='h1' sx={{ fontWeight: 600 }} variant='h4'>
            Settings
          </Typography>
        </Box>
        <Typography color='text.secondary' variant='body1'>
          Configure templates, API settings, and application preferences
        </Typography>
      </Box>

      {/* Error Alert */}
      {error ? (
        <Alert
          severity='error'
          sx={{ mb: 3 }}
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      ) : null}

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
            value={currentTab}
            variant='scrollable'
            onChange={handleTabChange}
          >
            {tabs.map(tab => (
              <Tab
                icon={tab.icon}
                iconPosition='start'
                key={tab.value}
                label={tab.label}
                sx={{
                  '& .MuiTab-iconWrapper': {
                    mr: 1,
                  },
                }}
                value={tab.value}
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

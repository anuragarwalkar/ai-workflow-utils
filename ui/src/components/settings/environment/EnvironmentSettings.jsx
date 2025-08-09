import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
  Refresh,
  Save,
  Science,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  useGetEnvironmentSettingsQuery,
  useGetProviderConfigQuery,
  useGetProvidersQuery,
  useResetSettingsMutation,
  useTestConnectionMutation,
  useUpdateEnvironmentSettingsMutation,
} from '../../../store/api/environmentSettingsApi';

const EnvironmentSettings = () => {
  const [settings, setSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [changedKeys, setChangedKeys] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState({});
  const [showSensitive, setShowSensitive] = useState({});

  // API hooks
  const {
    data: environmentData,
    isLoading,
    error,
    refetch,
  } = useGetEnvironmentSettingsQuery();
  const { data: providersData } = useGetProvidersQuery();
  const { data: providerConfigData } = useGetProviderConfigQuery();
  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateEnvironmentSettingsMutation();
  const [testConnection, { isLoading: isTesting }] =
    useTestConnectionMutation();
  const [resetSettings, { isLoading: isResetting }] =
    useResetSettingsMutation();

  // Initialize settings when data loads
  useEffect(() => {
    if (environmentData?.data && providerConfigData?.data) {
      const flatSettings = {};

      // Extract settings from each section in data
      Object.values(environmentData.data).forEach(sectionData => {
        Object.entries(sectionData).forEach(([key, config]) => {
          if (config.value !== undefined && config.value !== null) {
            flatSettings[key] = config.value;
          }
        });
      });

      // Ensure provider settings are set
      Object.entries(providerConfigData.data).forEach(
        ([providerType, config]) => {
          const key = `${providerType}_provider`;
          if (!flatSettings[key] && config.default) {
            flatSettings[key] = config.default;
          }
        }
      );

      setSettings(flatSettings);
      setOriginalSettings(flatSettings);
      setChangedKeys(new Set());
    }
  }, [environmentData, providerConfigData]);

  // Refetch data when providers change
  useEffect(() => {
    if (providersData?.data) {
      // If providers data changed, refetch environment settings to get updated sections
      refetch();
    }
  }, [providersData?.data, refetch]);

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // Mark this key as changed if the value is different from original
    setChangedKeys(prev => {
      const newSet = new Set(prev);
      if (value !== originalSettings[key]) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return newSet;
    });
  };

  const toggleSectionExpanded = sectionName => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const toggleShowSensitive = key => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    try {
      // Include all changed settings
      const updatedSettings = Array.from(changedKeys).reduce((acc, key) => {
        acc[key] = settings[key];
        return acc;
      }, {});

      if (Object.keys(updatedSettings).length === 0) {
        // No need for local toast - API will handle this
        return;
      }

      const result = await updateSettings(updatedSettings).unwrap();

      // Update local settings with server response
      if (result.data) {
        // Extract settings from server response
        const flatSettings = {};
        Object.values(result.data).forEach(sectionData => {
          Object.entries(sectionData).forEach(([key, config]) => {
            if (config.value !== undefined && config.value !== null) {
              flatSettings[key] = config.value;
            }
          });
        });

        setSettings(flatSettings);
        setOriginalSettings(flatSettings);
      }

      setChangedKeys(new Set());

      // Force refresh providers and config if provider settings were changed
      if (
        updatedSettings.ai_provider ||
        updatedSettings.repository_provider ||
        updatedSettings.issue_provider
      ) {
        refetch();
      }

      // Toast is now handled by the API layer
    } catch {
      // Error toast is now handled by the API layer
    }
  };

  const handleTestConnection = async provider => {
    try {
      // Toast is now handled by the API layer
      await testConnection({ provider, config: settings }).unwrap();
    } catch {
      // Error toast is now handled by the API layer
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        'Are you sure you want to reset all settings to defaults? This cannot be undone.'
      )
    ) {
      try {
        await resetSettings().unwrap();
        // Toast is now handled by the API layer
        refetch();
      } catch {
        // Error toast is now handled by the API layer
      }
    }
  };

  const checkSectionConfigured = sectionName => {
    const sectionData = environmentData?.data?.[sectionName];
    if (!sectionData) return false;

    // Check if all required fields have values
    const configFields = Object.entries(sectionData);
    const requiredFields = configFields.filter(([, config]) => config.required);

    if (requiredFields.length === 0) {
      // If no required fields, check if at least one field has a value
      return configFields.some(([key]) => Boolean(settings[key]));
    }

    // Check if all required fields have values
    return requiredFields.every(([key]) => Boolean(settings[key]));
  };

  const renderProviderStatus = provider => {
    if (!environmentData?.data) return null;

    const isConfigured = checkSectionConfigured(provider);

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          color={isConfigured ? 'success' : 'default'}
          label={isConfigured ? 'Configured' : 'Not Configured'}
          size='small'
        />
        <IconButton
          disabled={isTesting || !isConfigured}
          size='small'
          title='Test Connection'
          onClick={() => handleTestConnection(provider)}
        >
          {isTesting ? <CircularProgress size={16} /> : <Science />}
        </IconButton>
      </Box>
    );
  };

  const renderProviderCard = (providerType, providerConfig) => {
    const key = `${providerType}_provider`;

    // Use the backend settings value directly, without any default fallback
    const currentSelection = settings[key] || '';

    return (
      <Card
        key={providerType}
        sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}
      >
        <CardContent>
          <Typography
            component='h3'
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
            variant='h6'
          >
            <Science color='primary' />
            {providerConfig.title}
          </Typography>
          <Typography color='text.secondary' sx={{ mb: 3 }} variant='body2'>
            {providerConfig.description}
          </Typography>

          <Grid container spacing={2}>
            <Grid item md={6} xs={12}>
              <TextField
                fullWidth
                select
                label={`Primary ${providerConfig.title.split(' ')[0]} Provider`}
                SelectProps={{
                  native: true,
                  sx: { backgroundColor: 'background.paper' },
                }}
                size='small'
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'background.paper',
                    px: 0.5,
                  },
                }}
                value={currentSelection}
                onChange={e => handleInputChange(key, e.target.value)}
              >
                {providerConfig.options.map(option => (
                  <option
                    disabled={!option.available}
                    key={option.value}
                    value={option.value}
                  >
                    {option.label} {option.comingSoon ? '(Coming Soon)' : ''}
                  </option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderSection = (sectionName, sectionData) => {
    const isExpanded = expandedSections[sectionName] !== false; // Default to expanded

    return (
      <Card key={sectionName} sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => toggleSectionExpanded(sectionName)}
          >
            <Typography component='h3' variant='h6'>
              {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}{' '}
              Configuration
            </Typography>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </Box>

          {/* Provider status for sections */}
          {sectionName !== 'server' && (
            <Box sx={{ mt: 1 }}>{renderProviderStatus(sectionName)}</Box>
          )}

          <Collapse in={isExpanded}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {Object.entries(sectionData).map(([key, config]) => (
                  <Grid item key={key} md={6}
xs={12}>
                    <TextField
                      fullWidth
                      helperText={config.description}
                      InputProps={
                        config.sensitive
                          ? {
                              endAdornment: (
                                <IconButton
                                  edge='end'
                                  size='small'
                                  onClick={() => toggleShowSensitive(key)}
                                >
                                  {showSensitive[key] ? (
                                    <VisibilityOff />
                                  ) : (
                                    <Visibility />
                                  )}
                                </IconButton>
                              ),
                            }
                          : undefined
                      }
                      label={config.label}
                      placeholder={config.default || ''}
                      size='small'
                      type={
                        config.sensitive && !showSensitive[key]
                          ? 'password'
                          : 'text'
                      }
                      value={settings[key] || ''}
                      onChange={e => handleInputChange(key, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  const getVisibleSections = () => {
    if (!environmentData?.data || !providerConfigData?.data) return [];

    const visibleSections = new Set();

    // Add sections based on selected providers only
    Object.entries(providerConfigData.data).forEach(
      ([providerType, providerConfig]) => {
        const currentProvider =
          settings[`${providerType}_provider`] || providerConfig.default;
        const selectedOption = providerConfig.options.find(
          opt => opt.value === currentProvider
        );

        if (
          selectedOption?.section &&
          environmentData.data[selectedOption.section]
        ) {
          visibleSections.add(selectedOption.section);
        }
      }
    );

    // Always show server configuration
    if (environmentData.data.server) {
      visibleSections.add('server');
    }

    return Array.from(visibleSections);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        Failed to load environment settings:{' '}
        {error.data?.error || error.message}
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography component='h1' variant='h5'>
          Environment Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size='small'
            startIcon={<Refresh />}
            variant='outlined'
            onClick={refetch}
          >
            Refresh
          </Button>
          <Button
            color='warning'
            disabled={isResetting}
            size='small'
            variant='outlined'
            onClick={handleReset}
          >
            {isResetting ? <CircularProgress size={16} /> : 'Reset to Defaults'}
          </Button>
          <Button
            disabled={isUpdating}
            size='small'
            startIcon={<Save />}
            variant='contained'
            onClick={handleSave}
          >
            {isUpdating ? <CircularProgress size={16} /> : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        Environment settings are stored in your local database
        (~/.ai-workflow-utils/environment.json). Changes here will update your
        local settings and persist across application restarts.
      </Alert>

      {/* Dynamic Provider Cards */}
      {providerConfigData?.data
        ? Object.entries(providerConfigData.data).map(
            ([providerType, providerConfig]) =>
              renderProviderCard(providerType, providerConfig)
          )
        : null}

      {/* Dynamic Configuration Sections */}
      {environmentData?.data
        ? getVisibleSections().map(sectionName =>
            renderSection(sectionName, environmentData.data[sectionName])
          )
        : null}
    </Box>
  );
};

export default EnvironmentSettings;

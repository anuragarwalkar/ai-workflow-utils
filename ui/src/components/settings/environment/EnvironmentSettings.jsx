import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
  Grid,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Snackbar
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Science,
  Refresh,
  Save,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material'
import {
  useGetEnvironmentSettingsQuery,
  useUpdateEnvironmentSettingsMutation,
  useGetProvidersQuery,
  useGetProviderConfigQuery,
  useTestConnectionMutation,
  useResetSettingsMutation
} from '../../../store/api/environmentSettingsApi'

const EnvironmentSettings = () => {
  const [settings, setSettings] = useState({})
  const [expandedSections, setExpandedSections] = useState({})
  const [showSensitive, setShowSensitive] = useState({})
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  // API hooks
  const { data: environmentData, isLoading, error, refetch } = useGetEnvironmentSettingsQuery()
  const { data: providersData } = useGetProvidersQuery()
  const { data: providerConfigData } = useGetProviderConfigQuery()
  const [updateSettings, { isLoading: isUpdating }] = useUpdateEnvironmentSettingsMutation()
  const [testConnection, { isLoading: isTesting }] = useTestConnectionMutation()
  const [resetSettings, { isLoading: isResetting }] = useResetSettingsMutation()

  // Initialize settings when data loads
  useEffect(() => {
    if (environmentData?.data) {
      const flatSettings = {}
      Object.values(environmentData.data).forEach(section => {
        Object.entries(section).forEach(([key, config]) => {
          flatSettings[key] = config.value || ''
        })
      })
      setSettings(flatSettings)
    }
  }, [environmentData])

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleSectionExpanded = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  const toggleShowSensitive = (key) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    try {
      await updateSettings(settings).unwrap()
      setSnackbar({
        open: true,
        message: 'Environment settings saved successfully!',
        severity: 'success'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to save settings: ${error.data?.error || error.message}`,
        severity: 'error'
      })
    }
  }

  const handleTestConnection = async (provider) => {
    try {
      const result = await testConnection({ provider, config: settings }).unwrap()
      setSnackbar({
        open: true,
        message: `${provider} connection test: ${result.data.message}`,
        severity: result.data.status === 'success' ? 'success' : 'warning'
      })
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Connection test failed: ${error.data?.error || error.message}`,
        severity: 'error'
      })
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        await resetSettings().unwrap()
        setSnackbar({
          open: true,
          message: 'Settings reset to defaults successfully!',
          severity: 'success'
        })
        refetch()
      } catch (error) {
        setSnackbar({
          open: true,
          message: `Failed to reset settings: ${error.data?.error || error.message}`,
          severity: 'error'
        })
      }
    }
  }

  const renderProviderStatus = (provider) => {
    if (!providersData?.data) return null
    
    const providerInfo = providersData.data[provider]
    if (!providerInfo) return null

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={providerInfo.configured ? 'Configured' : 'Not Configured'}
          color={providerInfo.configured ? 'success' : 'default'}
          size="small"
        />
        <IconButton
          size="small"
          onClick={() => handleTestConnection(provider)}
          disabled={isTesting || !providerInfo.configured}
          title="Test Connection"
        >
          {isTesting ? <CircularProgress size={16} /> : <Science />}
        </IconButton>
      </Box>
    )
  }

  const renderProviderCard = (providerType, providerConfig) => {
    const currentSelection = settings[`${providerType}_provider`] || providerConfig.default

    return (
      <Card key={providerType} sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Typography variant="h6" component="h3" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Science color="primary" />
            {providerConfig.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {providerConfig.description}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label={`Primary ${providerConfig.title.split(' ')[0]} Provider`}
                value={currentSelection}
                onChange={(e) => handleInputChange(`${providerType}_provider`, e.target.value)}
                size="small"
                SelectProps={{ native: true }}
              >
                {providerConfig.options.map((option) => (
                  <option 
                    key={option.value} 
                    value={option.value}
                    disabled={!option.available}
                  >
                    {option.label} {option.comingSoon ? '(Coming Soon)' : ''}
                  </option>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  const renderSection = (sectionName, sectionData) => {
    const isExpanded = expandedSections[sectionName] !== false // Default to expanded

    return (
      <Card key={sectionName} sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => toggleSectionExpanded(sectionName)}
          >
            <Typography variant="h6" component="h3">
              {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Configuration
            </Typography>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </Box>

          {/* Provider status for relevant sections */}
          {['jira', 'openai', 'openai_direct', 'google', 'ollama', 'bitbucket'].includes(sectionName) && (
            <Box sx={{ mt: 1 }}>
              {renderProviderStatus(sectionName === 'openai' ? 'openai_compatible' : sectionName)}
            </Box>
          )}

          <Collapse in={isExpanded}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {Object.entries(sectionData).map(([key, config]) => (
                  <Grid item xs={12} md={6} key={key}>
                    <TextField
                      fullWidth
                      label={config.label}
                      value={settings[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      type={config.sensitive && !showSensitive[key] ? 'password' : 'text'}
                      placeholder={config.default || ''}
                      helperText={config.description}
                      size="small"
                      InputProps={config.sensitive ? {
                        endAdornment: (
                          <IconButton
                            onClick={() => toggleShowSensitive(key)}
                            edge="end"
                            size="small"
                          >
                            {showSensitive[key] ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      } : undefined}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    )
  }

  const getVisibleSections = () => {
    if (!environmentData?.data || !providerConfigData?.data) return []

    const visibleSections = []
    
    // Add sections based on selected providers
    for (const [providerType, providerConfig] of Object.entries(providerConfigData.data)) {
      const selectedProvider = settings[`${providerType}_provider`] || providerConfig.default
      const selectedOption = providerConfig.options.find(opt => opt.value === selectedProvider)
      
      if (selectedOption && selectedOption.available) {
        const sectionName = selectedOption.section
        if (environmentData.data[sectionName] && !visibleSections.includes(sectionName)) {
          visibleSections.push(sectionName)
        }
      }
    }

    // Always show server configuration
    if (environmentData.data.server) {
      visibleSections.push('server')
    }

    return visibleSections
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load environment settings: {error.data?.error || error.message}
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Environment Settings
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refetch}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            color="warning"
            onClick={handleReset}
            disabled={isResetting}
            size="small"
          >
            {isResetting ? <CircularProgress size={16} /> : 'Reset to Defaults'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={isUpdating}
            size="small"
          >
            {isUpdating ? <CircularProgress size={16} /> : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Environment settings are stored in your local database (~/.ai-workflow-utils/environment.json). 
        Changes here will update your local settings and persist across application restarts.
      </Alert>

      {/* Dynamic Provider Cards */}
      {providerConfigData?.data && Object.entries(providerConfigData.data).map(([providerType, providerConfig]) =>
        renderProviderCard(providerType, providerConfig)
      )}

      {/* Dynamic Configuration Sections */}
      {environmentData?.data && getVisibleSections().map(sectionName =>
        renderSection(sectionName, environmentData.data[sectionName])
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default EnvironmentSettings

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
  CircularProgress
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
  const [originalSettings, setOriginalSettings] = useState({})
  const [changedKeys, setChangedKeys] = useState(new Set())
  const [expandedSections, setExpandedSections] = useState({})
  const [showSensitive, setShowSensitive] = useState({})

  // API hooks
  const { data: environmentData, isLoading, error, refetch } = useGetEnvironmentSettingsQuery()
  const { data: providersData } = useGetProvidersQuery()
  const { data: providerConfigData } = useGetProviderConfigQuery()
  const [updateSettings, { isLoading: isUpdating }] = useUpdateEnvironmentSettingsMutation()
  const [testConnection, { isLoading: isTesting }] = useTestConnectionMutation()
  const [resetSettings, { isLoading: isResetting }] = useResetSettingsMutation()

    // Initialize settings when data loads
  useEffect(() => {
    if (environmentData?.data && providerConfigData?.data) {
      const flatSettings = {}
      
      // Extract settings from each section in data
      Object.values(environmentData.data).forEach(sectionData => {
        Object.entries(sectionData).forEach(([key, config]) => {
          if (config.value !== undefined && config.value !== null) {
            flatSettings[key] = config.value
          }
        })
      })

      // Ensure provider settings are set
      Object.entries(providerConfigData.data).forEach(([providerType, config]) => {
        const key = `${providerType}_provider`
        if (!flatSettings[key] && config.default) {
          flatSettings[key] = config.default
        }
      })

      setSettings(flatSettings)
      setOriginalSettings(flatSettings)
      setChangedKeys(new Set())
    }
  }, [environmentData, providerConfigData])

  // Refetch data when providers change
  useEffect(() => {
    if (providersData?.data) {
      // If providers data changed, refetch environment settings to get updated sections
      refetch()
    }
  }, [providersData?.data, refetch])

  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Mark this key as changed if the value is different from original
    setChangedKeys(prev => {
      const newSet = new Set(prev)
      if (value !== originalSettings[key]) {
        newSet.add(key)
      } else {
        newSet.delete(key)
      }
      return newSet
    })
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
      // Include all changed settings
      const updatedSettings = Array.from(changedKeys).reduce((acc, key) => {
        acc[key] = settings[key]
        return acc
      }, {})

      if (Object.keys(updatedSettings).length === 0) {
        // No need for local toast - API will handle this
        return
      }

      const result = await updateSettings(updatedSettings).unwrap()
      
      // Update local settings with server response
      if (result.data) {
        // Extract settings from server response
        const flatSettings = {}
        Object.values(result.data).forEach(sectionData => {
          Object.entries(sectionData).forEach(([key, config]) => {
            if (config.value !== undefined && config.value !== null) {
              flatSettings[key] = config.value
            }
          })
        })
        
        setSettings(flatSettings)
        setOriginalSettings(flatSettings)
      }
      
      setChangedKeys(new Set())
      
      // Force refresh providers and config if provider settings were changed
      if (updatedSettings.ai_provider || updatedSettings.repository_provider || updatedSettings.issue_provider) {
        refetch()
      }
      
      // Toast is now handled by the API layer
    } catch {
      // Error toast is now handled by the API layer
    }
  }

  const handleTestConnection = async (provider) => {
    try {
      // Toast is now handled by the API layer
      await testConnection({ provider, config: settings }).unwrap()
    } catch {
      // Error toast is now handled by the API layer
    }
  }

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      try {
        await resetSettings().unwrap()
        // Toast is now handled by the API layer
        refetch()
      } catch {
        // Error toast is now handled by the API layer
      }
    }
  }

  const checkSectionConfigured = (sectionName) => {
    const sectionData = environmentData?.data?.[sectionName]
    if (!sectionData) return false

    // Check if all required fields have values
    const configFields = Object.entries(sectionData)
    const requiredFields = configFields.filter(([, config]) => config.required)
    
    if (requiredFields.length === 0) {
      // If no required fields, check if at least one field has a value
      return configFields.some(([key]) => Boolean(settings[key]))
    }
    
    // Check if all required fields have values
    return requiredFields.every(([key]) => Boolean(settings[key]))
  }

  const renderProviderStatus = (provider) => {
    if (!environmentData?.data) return null
    
    const isConfigured = checkSectionConfigured(provider)

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={isConfigured ? 'Configured' : 'Not Configured'}
          color={isConfigured ? 'success' : 'default'}
          size="small"
        />
        <IconButton
          size="small"
          onClick={() => handleTestConnection(provider)}
          disabled={isTesting || !isConfigured}
          title="Test Connection"
        >
          {isTesting ? <CircularProgress size={16} /> : <Science />}
        </IconButton>
      </Box>
    )
  }

  const renderProviderCard = (providerType, providerConfig) => {
    const key = `${providerType}_provider`
    
    // Use the backend settings value directly, without any default fallback
    const currentSelection = settings[key] || ''

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
                onChange={(e) => handleInputChange(key, e.target.value)}
                size="small"
                SelectProps={{ 
                  native: true,
                  sx: { backgroundColor: 'background.paper' }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'background.paper',
                    px: 0.5,
                  }
                }}
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

          {/* Provider status for sections */}
          {sectionName !== 'server' && (
            <Box sx={{ mt: 1 }}>
              {renderProviderStatus(sectionName)}
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

    const visibleSections = new Set()
    
    // Add sections based on selected providers only
    Object.entries(providerConfigData.data).forEach(([providerType, providerConfig]) => {
      const currentProvider = settings[`${providerType}_provider`] || providerConfig.default
      const selectedOption = providerConfig.options.find(opt => opt.value === currentProvider)
      
      if (selectedOption?.section && environmentData.data[selectedOption.section]) {
        visibleSections.add(selectedOption.section)
      }
    })
    
    // Always show server configuration
    if (environmentData.data.server) {
      visibleSections.add('server')
    }

    return Array.from(visibleSections)
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
    </Box>
  )
}

export default EnvironmentSettings

/* eslint-disable max-lines */
import React, { useCallback, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import CurlImporter from './CurlImporter';

const RequestBuilder = ({ 
  request, 
  onUpdate}) => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);



  const handleHeaderChange = useCallback((key, value) => {
    onUpdate({
      headers: {
        ...request.headers,
        [key]: value,
      },
    });
  }, [onUpdate, request.headers]);

  const handleParamChange = useCallback((key, value) => {
    onUpdate({
      params: {
        ...request.params,
        [key]: value,
      },
    });
  }, [onUpdate, request.params]);

  const handleBodyChange = useCallback((event) => {
    onUpdate({ body: event.target.value });
  }, [onUpdate]);

  const handleBodyTypeChange = useCallback((event) => {
    onUpdate({ bodyType: event.target.value });
  }, [onUpdate]);

  const handleAuthChange = useCallback((authData) => {
    onUpdate({ auth: { ...request.auth, ...authData } });
  }, [onUpdate, request.auth]);

  const handleCurlImport = useCallback((parsedRequest) => {
    onUpdate(parsedRequest);
  }, [onUpdate]);


  const glassMorphismStyle = {
    background: isDark 
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '16px',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Request Configuration Tabs */}
      <Paper elevation={0} sx={{ 
        ...glassMorphismStyle, 
        borderRadius: 0,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Tabs
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48,
              ...(isDark && {
                color: '#E0E0E0',
                '&.Mui-selected': {
                  color: '#667eea',
                },
              }),
            },
            ...(isDark && {
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
              },
            }),
          }}
          value={activeTab}
          variant="fullWidth"
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Params" />
          <Tab label="Authorization" />
          <Tab label="Headers" />
          <Tab label="Body" />
          <Tab label="Import cURL" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
    <Box sx={{ flex: 1, p: 2, overflow: 'auto' }}>
        {activeTab === 0 && (
          <ParamsEditor
            isDark={isDark}
            params={request.params || {}}
            onChange={handleParamChange}
          />
        )}
        {activeTab === 1 && (
          <AuthEditor
            auth={request.auth || { type: 'none' }}
            isDark={isDark}
            onChange={handleAuthChange}
          />
        )}
        {activeTab === 2 && (
          <HeadersEditor
            headers={request.headers || {}}
            isDark={isDark}
            onChange={handleHeaderChange}
          />
        )}
        {activeTab === 3 && (
          <BodyEditor
            body={request.body || ''}
            bodyType={request.bodyType || 'json'}
            isDark={isDark}
            onBodyChange={handleBodyChange}
            onBodyTypeChange={handleBodyTypeChange}
          />
        )}
        {activeTab === 4 && (
          <CurlImporter onImport={handleCurlImport} />
        )}
      </Box>
    </Box>
  );
};

const ParamsEditor = ({ params, onChange, isDark }) => {
  const [entries, setEntries] = useState(
    Object.entries(params).length > 0 
      ? Object.entries(params) 
      : [['', '']]
  );

  const handleAdd = () => {
    setEntries(prev => [...prev, ['', '']]);
  };

  const handleRemove = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    
    // Update parent
    const newParams = {};
    newEntries.forEach(([key, value]) => {
      if (key) newParams[key] = value;
    });
    onChange('', '', newParams);
  };

  const handleChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field === 'key' ? 0 : 1] = value;
    setEntries(newEntries);
    
    // Update parent
    const newParams = {};
    newEntries.forEach(([key, val]) => {
      if (key) newParams[key] = val;
    });
    onChange('', '', newParams);
  };

  return (
    <Box
      sx={{
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        borderRadius: 2,
    p: 2,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      }}
    >
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={2}>
        <Typography sx={{ color: isDark ? '#E0E0E0' : 'inherit' }} variant="h6">
          Query Parameters
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          sx={{
            textTransform: 'none',
            ...(isDark && {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#E0E0E0',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
            }),
          }}
          variant="outlined"
          onClick={handleAdd}
        >
          Add Parameter
        </Button>
      </Box>
      
      {entries.map(([key, value], index) => (
    <Grid container key={index} spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
          <Grid item lg={5} sm={4} xs={5}>
            <TextField
              fullWidth
              placeholder="Parameter name"
              size="small"
              sx={{
                marginBottom: 0,
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& input::placeholder': {
                      color: '#A0A0A0',
                      opacity: 1,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }),
              }}
              value={key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
            />
          </Grid>
          <Grid item lg={5} sm={4} xs={5}>
            <TextField
              fullWidth
              placeholder="Parameter value"
              size="small"
              sx={{
                marginBottom: 0,
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& input::placeholder': {
                      color: '#A0A0A0',
                      opacity: 1,
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }),
              }}
              value={value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
            />
          </Grid>
          <Grid item lg={2} sm={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} xs={2}>
            <IconButton 
              size="small" 
              sx={{
                color: isDark ? '#E0E0E0' : 'inherit',
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(244, 67, 54, 0.1)' : undefined,
                },
              }}
              onClick={() => handleRemove(index)}
            >
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      ))}
    </Box>
  );
};

const AuthEditor = ({ auth, onChange, isDark }) => {
  const authTypes = [
    { value: 'none', label: 'No Auth' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'basic', label: 'Basic Auth' },
    { value: 'apikey', label: 'API Key' },
  ];

  const handleAuthTypeChange = (event) => {
    onChange({ type: event.target.value });
  };

  const handleFieldChange = (field, value) => {
    onChange({ [field]: value });
  };

  return (
    <Box
      sx={{
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        borderRadius: 2,
        p: 3,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      }}
    >
  <Typography sx={{ mb: 2, color: isDark ? '#E0E0E0' : 'inherit' }} variant="h6">
        Authorization
      </Typography>
      
  <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item md={6} xs={12}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: isDark ? '#E0E0E0' : 'inherit' }}>
              Auth Type
            </InputLabel>
            <Select
              label="Auth Type"
              sx={{
                ...(isDark && {
                  backgroundColor: '#2D2D2D',
                  color: '#E0E0E0',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#E0E0E0',
                  },
                }),
              }}
              value={auth.type || 'none'}
              onChange={handleAuthTypeChange}
            >
              {authTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item md={6} xs={12}>
          {auth.type === 'bearer' && (
            <TextField
              fullWidth
              label="Token"
              placeholder="Enter your bearer token"
              sx={{
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#A0A0A0',
                  },
                }),
              }}
              value={auth.token || ''}
              onChange={(e) => handleFieldChange('token', e.target.value)}
            />
          )}
          
          {auth.type === 'apikey' && (
            <TextField
              fullWidth
              label="API Key"
              placeholder="Enter your API key"
              sx={{
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#A0A0A0',
                  },
                }),
              }}
              value={auth.apiKey || ''}
              onChange={(e) => handleFieldChange('apiKey', e.target.value)}
            />
          )}
        </Grid>
      </Grid>

      {auth.type === 'basic' && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item md={6} xs={12}>
            <TextField
              fullWidth
              label="Username"
              placeholder="Enter username"
              sx={{
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#A0A0A0',
                  },
                }),
              }}
              value={auth.username || ''}
              onChange={(e) => handleFieldChange('username', e.target.value)}
            />
          </Grid>
          <Grid item md={6} xs={12}>
            <TextField
              fullWidth
              label="Password"
              placeholder="Enter password"
              sx={{
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#A0A0A0',
                  },
                }),
              }}
              type="password"
              value={auth.password || ''}
              onChange={(e) => handleFieldChange('password', e.target.value)}
            />
          </Grid>
        </Grid>
      )}

      {auth.type === 'apikey' && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item md={6} xs={12}>
            <TextField
              fullWidth
              label="Header Name"
              placeholder="X-API-Key"
              sx={{
                marginBottom: 0,
                ...(isDark && {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#2D2D2D',
                    color: '#E0E0E0',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#A0A0A0',
                  },
                }),
              }}
              value={auth.apiKeyHeader || 'X-API-Key'}
              onChange={(e) => handleFieldChange('apiKeyHeader', e.target.value)}
            />
          </Grid>
          <Grid item md={6} xs={12}>
            {/* API Key field is already handled in the main grid above */}
          </Grid>
        </Grid>
      )}

      {auth.type !== 'none' && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: isDark ? '#2A2A2A' : '#f5f5f5', borderRadius: 1 }}>
          <Typography sx={{ color: isDark ? '#A0A0A0' : 'text.secondary' }} variant="body2">
            This authorization will automatically add the appropriate headers to your request.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const HeadersEditor = ({ headers, onChange, isDark }) => {
  const [entries, setEntries] = useState(
    Object.entries(headers).length > 0 
      ? Object.entries(headers) 
      : [['', '']]
  );

  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkHeaders, setBulkHeaders] = useState('');

  const commonHeaders = [
    'Accept',
    'Accept-Encoding',
    'Accept-Language',
    'Authorization',
    'Cache-Control',
    'Content-Type',
    'User-Agent',
    'X-API-Key',
    'X-Requested-With',
    'Origin',
    'Referer',
  ];

  const handleAdd = () => {
    setEntries(prev => [...prev, ['', '']]);
  };

  const handleRemove = (index) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    updateParent(newEntries);
  };

  const handleChange = (index, field, value) => {
    const newEntries = [...entries];
    newEntries[index][field === 'key' ? 0 : 1] = value;
    setEntries(newEntries);
    updateParent(newEntries);
  };

  const updateParent = (newEntries) => {
    const newHeaders = {};
    newEntries.forEach(([key, value]) => {
      if (key) newHeaders[key] = value;
    });
    onChange('', '', newHeaders);
  };

  const handleBulkEdit = () => {
    try {
      const parsed = JSON.parse(bulkHeaders);
      const newEntries = Object.entries(parsed);
      setEntries(newEntries);
      updateParent(newEntries);
      setShowBulkEdit(false);
    } catch (error) {
        console.error('error in request builder:', error);
    }
  };

  const exportToBulk = () => {
    const headerObj = {};
    entries.forEach(([key, value]) => {
      if (key) headerObj[key] = value;
    });
    setBulkHeaders(JSON.stringify(headerObj, null, 2));
    setShowBulkEdit(true);
  };

  return (
    <Box
      sx={{
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
        borderRadius: 2,
        p: 3,
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
      }}
    >
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={2}>
        <Typography sx={{ color: isDark ? '#E0E0E0' : 'inherit' }} variant="h6">
          Headers
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            size="small"
            startIcon={<CopyIcon />}
            sx={{
              textTransform: 'none',
              ...(isDark && {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#E0E0E0',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              }),
            }}
            variant="outlined"
            onClick={exportToBulk}
          >
            Bulk Edit
          </Button>
          <Button
            size="small"
            startIcon={<AddIcon />}
            sx={{
              textTransform: 'none',
              ...(isDark && {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#E0E0E0',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              }),
            }}
            variant="outlined"
            onClick={handleAdd}
          >
            Add Header
          </Button>
        </Box>
      </Box>

      {showBulkEdit ? (
        <Box>
          <TextField
            fullWidth
            multiline
            label="Headers (JSON)"
            rows={8}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                fontSize: '0.875rem',
                ...(isDark && {
                  backgroundColor: '#2D2D2D',
                  color: '#E0E0E0',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }),
              },
              ...(isDark && {
                '& .MuiInputLabel-root': {
                  color: '#A0A0A0',
                },
              }),
            }}
            value={bulkHeaders}
            onChange={(e) => setBulkHeaders(e.target.value)}
          />
          <Box display="flex" gap={1}>
            <Button size="small" variant="contained" onClick={handleBulkEdit}>
              Apply
            </Button>
            <Button size="small" onClick={() => setShowBulkEdit(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          {/* Header Titles */}
          <Grid container spacing={1} sx={{ mb: 0.5 }}>
            <Grid item lg={5} sm={4} xs={5}>
              <Typography sx={{ fontWeight: 600, color: isDark ? '#A0A0A0' : 'text.secondary', mb: 0 }} variant="body2">
                Key
              </Typography>
            </Grid>
            <Grid item lg={5} sm={4} xs={5}>
              <Typography sx={{ fontWeight: 600, color: isDark ? '#A0A0A0' : 'text.secondary', mb: 0 }} variant="body2">
                Value
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ mb: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : undefined }} />

          {entries.map(([key, value], index) => (
            <Grid container key={index} spacing={1} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Grid item lg={5} sm={4} xs={5}>
                <Autocomplete
                  freeSolo
                  options={commonHeaders}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Header name"
                      size="small"
                      sx={{
                        width: '100%',
                        marginBottom: 0,
                        minWidth: '200px',
                        ...(isDark && {
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#2D2D2D',
                            color: '#E0E0E0',
                            '& input::placeholder': {
                              color: '#A0A0A0',
                              opacity: 1,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          },
                        }),
                      }}
                      onChange={(e) => handleChange(index, 'key', e.target.value)}
                    />
                  )}
                  value={key}
                  onChange={(_, newValue) => handleChange(index, 'key', newValue || '')}
                />
              </Grid>
              <Grid item lg={5} sm={4} xs={5}>
                <TextField
                  fullWidth
                  placeholder="Header value"
                  size="small"
                  sx={{
                    width: '100%',
                    marginBottom: 0,
                    ...(isDark && {
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '#2D2D2D',
                        color: '#E0E0E0',
                        '& input::placeholder': {
                          color: '#A0A0A0',
                          opacity: 1,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      },
                    }),
                  }}
                  value={value}
                  onChange={(e) => handleChange(index, 'value', e.target.value)}
                />
              </Grid>
              <Grid item lg={2} sm={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} xs={2}>
                <IconButton 
                  size="small" 
                  sx={{
                    color: isDark ? '#E0E0E0' : 'inherit',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(244, 67, 54, 0.1)' : undefined,
                    },
                  }}
                  onClick={() => handleRemove(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
        </>
      )}
    </Box>
  );
};

const BodyEditor = ({ body, bodyType, onBodyChange, onBodyTypeChange, isDark }) => {
  return (
    <Box>
      <Box alignItems="center" display="flex" justifyContent="space-between" mb={2}>
        <Typography sx={{ color: isDark ? '#E0E0E0' : 'inherit' }} variant="h6">
          Request Body
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: isDark ? '#E0E0E0' : 'inherit' }}>
            Type
          </InputLabel>
          <Select
            label="Type"
            sx={{
              ...(isDark && {
                backgroundColor: '#2D2D2D',
                color: '#E0E0E0',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                '& .MuiSvgIcon-root': {
                  color: '#E0E0E0',
                },
              }),
            }}
            value={bodyType}
            onChange={onBodyTypeChange}
          >
            <MenuItem value="json">JSON</MenuItem>
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="form-data">Form Data</MenuItem>
            <MenuItem value="x-www-form-urlencoded">URL Encoded</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <TextField
        fullWidth
        multiline
        placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Enter request body'}
        rows={12}
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: '0.875rem',
            ...(isDark && {
              backgroundColor: '#2D2D2D',
              color: '#E0E0E0',
              '& textarea::placeholder': {
                color: '#A0A0A0',
                opacity: 1,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
            }),
          },
        }}
        value={body}
        onChange={onBodyChange}
      />
    </Box>
  );
};


export default RequestBuilder;

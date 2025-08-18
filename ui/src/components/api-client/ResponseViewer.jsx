import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { useAppTheme } from '../../theme/useAppTheme';

const ResponseViewer = ({ response, loading }) => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);

  const glassMorphismStyle = {
    background: isDark 
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '16px',
  };

  if (loading) {
    return (
      <Box 
        alignItems="center" 
        display="flex" 
        justifyContent="center" 
        sx={{ height: '100%', flexDirection: 'column', gap: 2 }}
      >
        <CircularProgress size={40} />
        <Typography color="text.secondary">Sending request...</Typography>
      </Box>
    );
  }

  if (!response) {
    return (
      <Box 
        alignItems="center" 
        display="flex" 
        justifyContent="center" 
        sx={{ height: '100%', opacity: 0.6 }}
      >
        <Typography color="text.secondary" variant="h6">
          Send a request to see the response
        </Typography>
      </Box>
    );
  }

  if (response.error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Request Failed</Typography>
          <Typography>{response.message}</Typography>
        </Alert>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return '#4caf50';
    if (status >= 300 && status < 400) return '#ff9800';
    if (status >= 400 && status < 500) return '#f44336';
    if (status >= 500) return '#9c27b0';
    return '#666';
  };

  return (
    <Box sx={{ height: '100%', overflow: 'hidden' }}>
      {/* Response Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box alignItems="center" display="flex" gap={2} mb={1}>
          <Typography variant="h6">Response</Typography>
          <Chip
            label={`${response.status} ${response.statusText || ''}`}
            size="small"
            sx={{
              background: getStatusColor(response.status),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
          <Chip
            label={`${response.responseTime || 0}ms`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`${response.size || 0}B`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Response Tabs */}
      <Paper elevation={0} sx={{ ...glassMorphismStyle, m: 2, mb: 1 }}>
        <Tabs
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
          value={activeTab}
          variant="fullWidth"
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Body" />
          <Tab label="Headers" />
          <Tab label="Raw" />
        </Tabs>
      </Paper>

      {/* Response Content */}
      <Paper 
        elevation={0} 
        sx={{ 
          ...glassMorphismStyle, 
          m: 2, 
          p: 2, 
          height: 'calc(100% - 180px)', 
          overflow: 'auto' 
        }}
      >
        {activeTab === 0 && (
          <ResponseBody contentType={response.contentType} data={response.data} />
        )}
        {activeTab === 1 && (
          <ResponseHeaders headers={response.headers} />
        )}
        {activeTab === 2 && (
          <RawResponse response={response} />
        )}
      </Paper>
    </Box>
  );
};

const ResponseBody = ({ data, contentType }) => {
  const isJson = contentType && contentType.includes('application/json');
  
  if (!data) {
    return (
      <Typography color="text.secondary" fontStyle="italic">
        No response body
      </Typography>
    );
  }

  if (isJson) {
    return (
      <Box
        component="pre"
        sx={{
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          margin: 0,
          padding: 0,
        }}
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    );
  }

  return (
    <Box
      component="pre"
      sx={{
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0,
        padding: 0,
      }}
    >
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </Box>
  );
};

const ResponseHeaders = ({ headers }) => {
  if (!headers || Object.keys(headers).length === 0) {
    return (
      <Typography color="text.secondary" fontStyle="italic">
        No response headers
      </Typography>
    );
  }

  return (
    <Box>
      {Object.entries(headers).map(([key, value]) => (
        <Box key={key} sx={{ mb: 1, pb: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography sx={{ fontWeight: 600, color: 'primary.main' }} variant="body2">
            {key}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {Array.isArray(value) ? value.join(', ') : value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const RawResponse = ({ response }) => {
  return (
    <Box
      component="pre"
      sx={{
        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        margin: 0,
        padding: 0,
      }}
    >
      {JSON.stringify(response, null, 2)}
    </Box>
  );
};

export default ResponseViewer;

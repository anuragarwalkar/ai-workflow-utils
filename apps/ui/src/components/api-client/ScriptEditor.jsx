import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
  useTheme,
  alpha,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import { useAppTheme } from '../../theme/useAppTheme';
import { useExecuteScriptMutation } from '../../store/api/apiClientApi';

const ScriptEditor = ({ 
  preScript = '', 
  postScript = '', 
  onPreScriptChange, 
  onPostScriptChange,
  isDark 
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [testResult, setTestResult] = useState(null);
  const [executeScript, { isLoading: testingScript }] = useExecuteScriptMutation();

  const handleTabChange = useCallback((_, newValue) => {
    setActiveTab(newValue);
    setTestResult(null); // Clear test results when switching tabs
  }, []);

  const handleTestScript = useCallback(async () => {
    const currentScript = activeTab === 0 ? preScript : postScript;
    
    if (!currentScript.trim()) {
      setTestResult({
        success: false,
        error: 'Script is empty'
      });
      return;
    }

    setTestResult(null);

    try {
      const result = await executeScript({
        script: currentScript,
        context: {
          environment: { test: 'value' },
          request: { method: 'GET', url: 'https://example.com' },
          response: { status: 200, data: { test: 'data' } }
        }
      }).unwrap();

      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message || 'Failed to execute script'
      });
    }
  }, [activeTab, preScript, postScript, executeScript]);

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
      {/* Header with Tabs */}
      <Paper elevation={0} sx={{ 
        ...glassMorphismStyle, 
        borderRadius: 0,
        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 0.5 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 40,
                fontSize: '0.875rem',
                px: 2,
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
          >
            <Tab label="Pre-request Script" />
            <Tab label="Post-response Script" />
          </Tabs>

          <Button
            size="small"
            startIcon={testingScript ? <CircularProgress size={16} /> : <PlayIcon />}
            onClick={handleTestScript}
            disabled={testingScript}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              ...(isDark && {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#E0E0E0',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
              }),
            }}
            variant="outlined"
          >
            Test Script
          </Button>
        </Box>
      </Paper>

      {/* Script Editor */}
      <Box sx={{ flex: 1, p: 1 }}>
        {/* Documentation/Help */}
        <Box sx={{ mb: 1, px: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
            {activeTab === 0 ? (
              <>
                <strong>Pre-request:</strong> Executed before sending request. Set environment variables, modify request data.
              </>
            ) : (
              <>
                <strong>Post-response:</strong> Executed after receiving response. Test responses, extract data to environment.
              </>
            )}
            {' | '}
            <span style={{ opacity: 0.8 }}>
              Functions: setEnvironmentVariable(key, value), getEnvironmentVariable(key) | 
              Objects: environment, request, response, console
            </span>
          </Typography>
        </Box>

        {/* Monaco Editor */}
        <Box
          sx={{
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
            borderRadius: 1,
            mb: 1,
            height: '400px',
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme={isDark ? 'vs-dark' : 'light'}
            value={activeTab === 0 ? preScript : postScript}
            onChange={(value) => {
              if (activeTab === 0) {
                onPreScriptChange(value || '');
              } else {
                onPostScriptChange(value || '');
              }
            }}
            options={{
              minimap: { enabled: false },
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              fontSize: 13,
              padding: { top: 8, bottom: 8 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              contextmenu: true,
              quickSuggestions: {
                other: true,
                comments: false,
                strings: false
              },
              suggestOnTriggerCharacters: true,
            }}
          />
        </Box>

        {/* Test Results */}
        {testResult && (
          <Box sx={{ mb: 1 }}>
            {testResult.success ? (
              <Alert severity="success" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  Script executed successfully!
                </Typography>
                {testResult.environment && Object.keys(testResult.environment).length > 0 && (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Environment variables:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.7rem',
                        fontFamily: 'Monaco, Consolas, monospace',
                        mt: 0.25,
                        p: 0.5,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        borderRadius: 0.5,
                        overflow: 'auto',
                        maxHeight: '80px',
                      }}
                    >
                      {JSON.stringify(testResult.environment, null, 2)}
                    </Box>
                  </Box>
                )}
              </Alert>
            ) : (
              <Alert severity="error" sx={{ py: 0.5 }}>
                <Typography variant="caption">
                  Script execution failed: {testResult.error}
                </Typography>
                {testResult.stack && (
                  <Box
                    component="pre"
                    sx={{
                      fontSize: '0.7rem',
                      fontFamily: 'Monaco, Consolas, monospace',
                      mt: 0.5,
                      p: 0.5,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      borderRadius: 0.5,
                      overflow: 'auto',
                      maxHeight: '80px',
                    }}
                  >
                    {testResult.stack}
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        )}

        {/* Script Examples - Collapsible */}
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Examples:
          </Typography>
          
          {activeTab === 0 ? (
            <Box
              component="pre"
              sx={{
                fontSize: '0.7rem',
                fontFamily: 'Monaco, Consolas, monospace',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                p: 1,
                borderRadius: 0.5,
                overflow: 'auto',
                color: isDark ? '#E0E0E0' : 'text.primary',
                maxHeight: '120px',
              }}
            >
{`// Set environment variables
setEnvironmentVariable('authToken', 'your-token-here');
setEnvironmentVariable('timestamp', new Date().toISOString());
console.log('Current environment:', environment);`}
            </Box>
          ) : (
            <Box
              component="pre"
              sx={{
                fontSize: '0.7rem',
                fontFamily: 'Monaco, Consolas, monospace',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
                p: 1,
                borderRadius: 0.5,
                overflow: 'auto',
                color: isDark ? '#E0E0E0' : 'text.primary',
                maxHeight: '120px',
              }}
            >
{`// Test response and extract data
if (response.status === 200) {
  console.log('Request successful!');
  if (response.data?.token) {
    setEnvironmentVariable('extractedToken', response.data.token);
  }
}`}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ScriptEditor;

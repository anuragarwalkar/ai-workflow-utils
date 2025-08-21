/**
 * Tools Demo Component - Showcase the tools system
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { Code as CodeIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import { toolsRegistry } from './ToolsRegistry';
import { ToolCard, ToolsList, ToolsToggle } from './ui';

// Import tools to ensure they're registered
import './tools';

const ToolsDemo = () => {
  const [toolsEnabled, setToolsEnabled] = useState(true);
  const [executingTools, setExecutingTools] = useState([]);
  const [_demoResults, setDemoResults] = useState({});

  const availableTools = toolsRegistry.getAllTools();

  const executeDemoTool = async (toolName) => {
    const tool = toolsRegistry.getTool(toolName);
    if (!tool) return;

    const executionId = `demo-${Date.now()}`;
    const toolExecution = {
      id: executionId,
      tool,
      status: 'running',
      parameters: { query: 'demo input' },
      result: null,
      error: null,
    };

    setExecutingTools(prev => [...prev, toolExecution]);

    try {
      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await tool.execute({ query: 'demo input' });
      
      setExecutingTools(prev =>
        prev.map(t =>
          t.id === executionId
            ? { ...t, status: 'completed', result }
            : t
        )
      );

      setDemoResults(prev => ({ ...prev, [toolName]: result }));

    } catch (error) {
      setExecutingTools(prev =>
        prev.map(t =>
          t.id === executionId
            ? { ...t, status: 'error', error: error.message }
            : t
        )
      );
    }
  };

  const clearResults = () => {
    setExecutingTools([]);
    setDemoResults({});
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography gutterBottom variant="h4">
          AI Tools System Demo
        </Typography>
        <Typography color="text.secondary" variant="body1">
          Demonstration of the modular tools system for AI chat integration
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Tools Control */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box alignItems="center" display="flex" gap={2} mb={2}>
              <Typography variant="h6">Tools Control</Typography>
              <ToolsToggle
                enabled={toolsEnabled}
                onToggle={setToolsEnabled}
              />
            </Box>
            <Box display="flex" gap={2}>
              <Button
                disabled={!toolsEnabled}
                startIcon={<PlayIcon />}
                variant="contained"
                onClick={() => executeDemoTool('code_analyzer')}
              >
                Test Code Analyzer
              </Button>
              <Button
                disabled={!toolsEnabled}
                startIcon={<PlayIcon />}
                variant="contained"
                onClick={() => executeDemoTool('file_search')}
              >
                Test File Search
              </Button>
              <Button
                color="secondary"
                variant="outlined"
                onClick={clearResults}
              >
                Clear Results
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Available Tools */}
        <Grid item md={6} xs={12}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h6">
                Available Tools
              </Typography>
              <Typography gutterBottom color="text.secondary" variant="body2">
                {availableTools.length} tools registered
              </Typography>
              <Divider sx={{ my: 2 }} />
              {availableTools.map((tool) => (
                <Box key={tool.name} mb={2}>
                  <Box alignItems="center" display="flex" gap={1} mb={1}>
                    <CodeIcon color="primary" fontSize="small" />
                    <Typography variant="subtitle2">{tool.name}</Typography>
                  </Box>
                  <Typography color="text.secondary" variant="body2">
                    {tool.description}
                  </Typography>
                  {Boolean(tool.parameters) && (
                    <Box component="pre" sx={{ fontSize: '0.75rem', mt: 1, overflow: 'auto' }}>
                      {JSON.stringify(tool.parameters, null, 2)}
                    </Box>
                  )}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Results */}
        <Grid item md={6} xs={12}>
          <Card>
            <CardContent>
              <Typography gutterBottom variant="h6">
                Execution Results
              </Typography>
              <Typography gutterBottom color="text.secondary" variant="body2">
                Live tool execution demonstration
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {executingTools.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No tools executed yet. Click the test buttons above.
                </Typography>
              ) : (
                <ToolsList title="Recent Executions" tools={executingTools} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Integration Example */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography gutterBottom variant="h6">
              Integration Example
            </Typography>
            <Typography gutterBottom color="text.secondary" variant="body2">
              Example of how to use the tools system in your chat components:
            </Typography>
            <Box
              component="pre"
              sx={{
                backgroundColor: 'background.default',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                fontSize: '0.875rem',
                overflow: 'auto',
                p: 2,
              }}
            >
{`// Import the enhanced hook
import { useChatWithTools } from './hooks/useChatWithTools';

// Use in your component
const MyChat = () => {
  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    toolsEnabled,
    toggleTools,
  } = useChatWithTools({ enableTools: true });

  return (
    <div>
      <ToolsToggle enabled={toolsEnabled} onToggle={toggleTools} />
      {/* Your chat UI components */}
      {messages.map(message => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
};`}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ToolsDemo;

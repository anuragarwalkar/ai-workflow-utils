import React, { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  TextField,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Code as CodeIcon,
  ExpandMore as ExpandMoreIcon,
  ContentPaste as PasteIcon,
} from '@mui/icons-material';
import { CurlParser } from '../../utils/curlParser';
import { useAppTheme } from '../../theme/useAppTheme';

const CurlImporter = ({ onImport }) => {
  const theme = useTheme();
  const { isDark } = useAppTheme();
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleParse = () => {
    if (!curlCommand.trim()) {
      setError('Please enter a curl command');
      return;
    }

    try {
      const parsed = CurlParser.parse(curlCommand);
      onImport(parsed);
      setSuccess('Curl command imported successfully!');
      setError('');
      setCurlCommand('');
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCurlCommand(text);
      setError('');
      setSuccess('');
    } catch {
      setError('Failed to paste from clipboard');
    }
  };

  const handleExampleClick = (example) => {
    setCurlCommand(example.curl);
    setError('');
    setSuccess('');
  };

  const examples = CurlParser.getExamples();

  const glassMorphismStyle = {
    background: isDark 
      ? alpha(theme.palette.background.paper, 0.8)
      : alpha(theme.palette.background.paper, 0.9),
    backdropFilter: 'blur(20px)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    borderRadius: '12px',
  };

  return (
    <Box>
      <Typography sx={{ alignItems: 'center', display: 'flex', gap: 1, mb: 2 }} variant="h6">
        <CodeIcon />
        Import from cURL
      </Typography>

      {/* Input Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
          <Typography color="text.secondary" sx={{ flexGrow: 1 }} variant="body2">
            Paste your curl command below to automatically populate the request
          </Typography>
          <Button
            size="small"
            startIcon={<PasteIcon />}
            sx={{ textTransform: 'none' }}
            onClick={handlePasteFromClipboard}
          >
            Paste
          </Button>
        </Box>

        <TextField
          fullWidth
          multiline
          placeholder={`curl -X POST "https://api.example.com/users" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer your-token" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'`}
          rows={8}
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              fontSize: '0.875rem',
              ...glassMorphismStyle,
            },
          }}
          value={curlCommand}
          onChange={(e) => {
            setCurlCommand(e.target.value);
            setError('');
            setSuccess('');
          }}
        />

        <Button
          disabled={!curlCommand.trim()}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
          variant="contained"
          onClick={handleParse}
        >
          Parse & Import
        </Button>
      </Box>

      {/* Status Messages */}
      {Boolean(error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {Boolean(success) && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Examples Section */}
      <Paper elevation={0} sx={{ ...glassMorphismStyle, p: 2 }}>
        <Typography sx={{ fontWeight: 600, mb: 2 }} variant="subtitle1">
          Example cURL Commands
        </Typography>

        {examples.map((example) => (
          <Accordion
            elevation={0}
            key={example.name}
            sx={{
              mb: 1,
              backgroundColor: 'transparent',
              '&:before': { display: 'none' },
              '& .MuiAccordionSummary-root': {
                borderRadius: '8px',
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography sx={{ flexGrow: 1, fontWeight: 500 }} variant="body2">
                  {example.name}
                </Typography>
                <Chip
                  clickable
                  label="Try it"
                  size="small"
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    },
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExampleClick(example);
                  }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                component="pre"
                sx={{
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '0.75rem',
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  padding: 2,
                  borderRadius: '8px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                }}
              >
                {example.curl}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
};

export default CurlImporter;

/* eslint-disable react/jsx-max-depth */
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from '@mui/material';

/**
 * Meeting Settings Component - Configuration options for meeting features
 */
const MeetingSettings = () => {
  const [transcriptionProvider, setTranscriptionProvider] = React.useState('openai-whisper');
  const [autoSummarize, setAutoSummarize] = React.useState(true);
  const [defaultQuality, setDefaultQuality] = React.useState('medium');

  return (
    <Box>
      <Typography gutterBottom variant="h6">
        Meeting Settings
      </Typography>

      <Card>
        <CardContent>
          <Box display="flex" flexDirection="column" gap={3}>
            <FormControl fullWidth>
              <InputLabel>Transcription Provider</InputLabel>
              <Select
                value={transcriptionProvider}
                onChange={(e) => setTranscriptionProvider(e.target.value)}
              >
                <MenuItem value="openai-whisper">OpenAI Whisper</MenuItem>
                <MenuItem value="google-speech">Google Speech-to-Text</MenuItem>
                <MenuItem value="azure-speech">Azure Speech Services</MenuItem>
                <MenuItem value="mock">Mock (for testing)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Default Recording Quality</InputLabel>
              <Select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value)}
              >
                <MenuItem value="low">Low (64 kbps)</MenuItem>
                <MenuItem value="medium">Medium (128 kbps)</MenuItem>
                <MenuItem value="high">High (256 kbps)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={autoSummarize}
                  onChange={(e) => setAutoSummarize(e.target.checked)}
                />
              }
              label="Auto-generate summary after recording"
            />

            <Typography color="textSecondary" variant="body2">
              Settings are currently stored locally. Future versions will sync with the server.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MeetingSettings;

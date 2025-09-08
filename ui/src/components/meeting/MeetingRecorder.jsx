/* eslint-disable max-lines */
/* eslint-disable react/jsx-max-depth */
/* eslint-disable max-statements */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  PlayArrow as PlayIcon,
  RecordVoiceOver as RecordIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { createLogger } from '../../utils/log';
import { MeetingRecorderStyles } from './MeetingRecorder.style';
import { API_BASE_URL } from '../../config/environment.js';

/**
 * Meeting Recorder Component - Handles recording interface and controls
 */
const MeetingRecorder = ({ currentRecording, isRecording, onRecordingChange }) => {
  const logger = createLogger('MEETING_RECORDER');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [audioSource, setAudioSource] = useState('microphone');
  const [quality, setQuality] = useState('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [availableAudioSources, setAvailableAudioSources] = useState(null);

  // Audio recording states
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [microphonePermission, setMicrophonePermission] = useState('prompt'); // 'granted', 'denied', 'prompt'
  const [isRecordingActive, setIsRecordingActive] = useState(false);

  // Timer for recording duration
  useEffect(() => {
    let interval = null;
    if (isRecording && currentRecording) {
      interval = setInterval(() => {
        const startTime = new Date(currentRecording.startTime).getTime();
        const now = Date.now();
        setRecordingDuration(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      setRecordingDuration(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, currentRecording]);

  // Load available audio sources on mount
  useEffect(() => {
    loadAudioSources();
  }, []);

  // Check microphone permission on mount
  useEffect(() => {
    checkMicrophonePermission();
  }, []);

  // Cleanup audio resources on unmount
  useEffect(() => {
    return () => {
      cleanupAudioResources();
    };
  }, []);

  /**
   * Load available audio sources
   */
  const loadAudioSources = async () => {
    try {
      logger.info('loadAudioSources', 'Loading audio sources');
      
      const response = await fetch(`${API_BASE_URL}/api/meeting/audio/sources`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAvailableAudioSources(data.data);
        }
      }
    } catch (err) {
      logger.error('loadAudioSources', 'Error:', err);
    }
  };

  /**
   * Check microphone permission
   */
  const checkMicrophonePermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' });
      setMicrophonePermission(permission.state);
      
      // Listen for permission changes
      permission.addEventListener('change', () => {
        setMicrophonePermission(permission.state);
      });
      
      return permission.state === 'granted';
    } catch (error) {
      logger.error('checkMicrophonePermission', 'Error checking permission:', error);
      return false;
    }
  };

  /**
   * Request microphone access
   */
  const requestMicrophoneAccess = async () => {
    try {
      logger.info('requestMicrophoneAccess', 'Requesting microphone access');
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);
      setMicrophonePermission('granted');
      
      logger.info('requestMicrophoneAccess', 'Microphone access granted');
      return stream;
    } catch (error) {
      logger.error('requestMicrophoneAccess', 'Error accessing microphone:', error);
      setMicrophonePermission('denied');
      throw new Error('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  /**
   * Start actual audio recording
   */
  const startAudioRecording = async (stream) => {
    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks = [];
      setAudioChunks(chunks);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        logger.info('startAudioRecording', 'Recording stopped, processing audio data');
      };
      
      recorder.start(1000); // Collect data every second
      setMediaRecorder(recorder);
      setIsRecordingActive(true);
      
      logger.info('startAudioRecording', 'Audio recording started');
      return recorder;
    } catch (error) {
      logger.error('startAudioRecording', 'Error starting audio recording:', error);
      throw new Error(`Failed to start audio recording: ${  error.message}`);
    }
  };

  /**
   * Stop audio recording and process
   */
  const stopAudioRecording = async () => {
    try {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        setIsRecordingActive(false);
        
        // Wait for data to be available
        await new Promise(resolve => {
          mediaRecorder.onstop = resolve;
        });
        
        // Create blob from chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        logger.info('stopAudioRecording', 'Audio recording completed', { 
          size: audioBlob.size,
          type: audioBlob.type 
        });
        
        return audioBlob;
      }
    } catch (error) {
      logger.error('stopAudioRecording', 'Error stopping recording:', error);
      throw error;
    }
  };

  /**
   * Clean up audio resources
   */
  const cleanupAudioResources = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    if (mediaRecorder) {
      setMediaRecorder(null);
    }
    setIsRecordingActive(false);
    setAudioChunks([]);
  };

  /**
   * Start recording
   */
  const handleStartRecording = async () => {
    if (!meetingTitle.trim()) {
      setError('Please enter a meeting title');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('handleStartRecording', 'Starting recording process');

      // Step 1: Request microphone access
      let stream = audioStream;
      if (!stream) {
        stream = await requestMicrophoneAccess();
      }

      // Step 2: Start actual audio recording
      await startAudioRecording(stream);

      // Step 3: Notify backend about recording session
      const participantList = participants
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const requestBody = {
        title: meetingTitle.trim(),
        participants: participantList,
        audioSource,
        quality,
      };

      const response = await fetch(`${API_BASE_URL}/api/meeting/recording/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        onRecordingChange(true, data.data);
        logger.info('handleStartRecording', 'Recording started successfully');
      } else {
        throw new Error(data.error?.message || 'Failed to start recording session');
      }
    } catch (err) {
      logger.error('handleStartRecording', 'Error:', err);
      setError(err.message);
      
      // Clean up on error
      cleanupAudioResources();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Stop recording
   */
  const handleStopRecording = async () => {
    if (!currentRecording?.recordingId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logger.info('handleStopRecording', 'Stopping recording');

      // Step 1: Stop actual audio recording and get the audio data
      const audioBlob = await stopAudioRecording();

      // Step 2: Send audio data to backend
      const formData = new FormData();
      formData.append('audioFile', audioBlob, `recording-${currentRecording.recordingId}.webm`);
      formData.append('autoSummarize', 'true');

      const response = await fetch(`${API_BASE_URL}/api/meeting/recording/${currentRecording.recordingId}/stop`, {
        method: 'PUT',
        body: formData, // Send as FormData instead of JSON to include audio file
      });

      const data = await response.json();

      if (data.success) {
        onRecordingChange(false, null);
        // Reset form
        setMeetingTitle('');
        setParticipants('');
        
        // Clean up audio resources
        cleanupAudioResources();
        
        logger.info('handleStopRecording', 'Recording stopped and audio uploaded successfully');
      } else {
        throw new Error(data.error?.message || 'Failed to stop recording');
      }
    } catch (err) {
      logger.error('handleStopRecording', 'Error:', err);
      setError(err.message);
      
      // Clean up resources even on error
      cleanupAudioResources();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Format duration as MM:SS
   */
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get audio source icon
   */
  const getAudioSourceIcon = (source) => {
    switch (source) {
      case 'microphone':
        return <MicIcon />;
      case 'system':
        return <ComputerIcon />;
      case 'both':
        return <RecordIcon />;
      default:
        return <MicIcon />;
    }
  };

  return (
    <MeetingRecorderStyles>
      <Box className="recorder-container">
        {error ? <Alert className="error-alert" severity="error">
            {error}
          </Alert> : null}

        {/* Microphone Permission Status */}
        <Card className="mic-status-card">
          <CardContent>
            <Box alignItems="center" display="flex" gap={2}>
              {microphonePermission === 'granted' ? (
                <>
                  <MicIcon color="success" />
                  <Typography color="success.main" variant="body2">
                    Microphone access granted
                  </Typography>
                  {isRecordingActive ? <Chip 
                      color="error" 
                      icon={<RecordIcon />} 
                      label="Recording..." 
                      size="small"
                    /> : null}
                </>
              ) : microphonePermission === 'denied' ? (
                <>
                  <MicOffIcon color="error" />
                  <Typography color="error.main" variant="body2">
                    Microphone access denied. Please enable microphone access in your browser settings.
                  </Typography>
                </>
              ) : (
                <>
                  <MicIcon color="warning" />
                  <Typography color="warning.main" variant="body2">
                    Microphone permission required for recording
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        {!isRecording ? (
          <>
            {/* Recording Setup Form */}
            <Card className="setup-card">
              <CardContent>
                <Typography className="section-title" variant="h6">
                  Meeting Setup
                </Typography>

                <Box className="form-section">
                  <TextField
                    fullWidth
                    className="meeting-title-field"
                    label="Meeting Title"
                    placeholder="Enter meeting title"
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                  />

                  <TextField
                    fullWidth
                    className="participants-field"
                    label="Participants (optional)"
                    placeholder="John Doe, Jane Smith, ..."
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                  />

                  <Box className="audio-settings">
                    <FormControl fullWidth className="audio-source-select">
                      <InputLabel>Audio Source</InputLabel>
                      <Select
                        value={audioSource}
                        onChange={(e) => setAudioSource(e.target.value)}
                      >
                        <MenuItem value="microphone">
                          <Box className="menu-item">
                            <MicIcon />
                            <span>Microphone Only</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="system">
                          <Box className="menu-item">
                            <ComputerIcon />
                            <span>System Audio</span>
                          </Box>
                        </MenuItem>
                        <MenuItem value="both">
                          <Box className="menu-item">
                            <RecordIcon />
                            <span>Microphone + System Audio</span>
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth className="quality-select">
                      <InputLabel>Quality</InputLabel>
                      <Select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                      >
                        <MenuItem value="low">Low (64 kbps)</MenuItem>
                        <MenuItem value="medium">Medium (128 kbps)</MenuItem>
                        <MenuItem value="high">High (256 kbps)</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  className="start-button"
                  disabled={isLoading || !meetingTitle.trim()}
                  size="large"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <PlayIcon />}
                  variant="contained"
                  onClick={handleStartRecording}
                >
                  {isLoading ? 'Starting Recording...' : 'Start Recording'}
                </Button>
              </CardContent>
            </Card>

            {/* Audio Source Info */}
            {availableAudioSources ? <Card className="audio-info-card">
                <CardContent>
                  <Typography className="section-title" variant="h6">
                    Available Audio Sources
                  </Typography>
                  
                  <Box className="audio-sources-list">
                    {availableAudioSources.microphone?.available ? <Box className="audio-source-item">
                        <Chip
                          icon={<MicIcon />}
                          label={`Microphone (${availableAudioSources.microphone.devices.length} devices)`}
                          variant="outlined"
                        />
                      </Box> : null}
                    
                    {availableAudioSources.system?.available ? <Box className="audio-source-item">
                        <Chip
                          icon={<ComputerIcon />}
                          label="System Audio"
                          variant="outlined"
                        />
                      </Box> : null}
                  </Box>
                </CardContent>
              </Card> : null}
          </>
        ) : (
          <>
            {/* Recording in Progress */}
            <Card className="recording-card">
              <CardContent>
                <Box className="recording-header">
                  <Box className="recording-indicator">
                    <MicIcon className="recording-icon" />
                    <Typography className="recording-text" variant="h6">
                      Recording in Progress
                    </Typography>
                  </Box>
                  
                  <Typography className="recording-duration" variant="h4">
                    {formatDuration(recordingDuration)}
                  </Typography>
                </Box>

                <Divider className="section-divider" />

                <Box className="recording-details">
                  <Typography className="detail-item" variant="body1">
                    <strong>Meeting:</strong> {currentRecording?.title}
                  </Typography>
                  
                  <Typography className="detail-item" variant="body1">
                    <strong>Audio Source:</strong>
                    <Chip
                      className="audio-source-chip"
                      icon={getAudioSourceIcon(currentRecording?.audioSource)}
                      label={currentRecording?.audioSource || 'Unknown'}
                      size="small"
                      variant="outlined"
                    />
                  </Typography>
                  
                  <Typography className="detail-item" variant="body1">
                    <strong>Quality:</strong> {currentRecording?.quality}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  className="stop-button"
                  disabled={isLoading}
                  size="large"
                  startIcon={isLoading ? <CircularProgress size={20} /> : <StopIcon />}
                  variant="contained"
                  onClick={handleStopRecording}
                >
                  {isLoading ? 'Stopping Recording...' : 'Stop Recording'}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </MeetingRecorderStyles>
  );
};

export default MeetingRecorder;

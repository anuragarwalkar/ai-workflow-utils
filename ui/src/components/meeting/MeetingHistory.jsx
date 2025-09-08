/* eslint-disable max-statements */
/* eslint-disable max-lines */
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Pagination,
  Typography,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Summarize as SummaryIcon,
  VolumeUp as VolumeIcon,
} from '@mui/icons-material';
import { createLogger } from '../../utils/log';
import { API_BASE_URL } from '../../config/environment.js';

/**
 * Meeting History Component - Displays past meetings and summaries
 */
const MeetingHistory = () => {
  const logger = createLogger('MEETING_HISTORY');
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  useEffect(() => {
    loadMeetings();
  }, [page]);

  /**
   * Load meetings from API
   */
  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      logger.info('loadMeetings', 'Loading meetings', { page });

      const response = await fetch(`${API_BASE_URL}/api/meeting/history?page=${page}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setMeetings(data.data.meetings);
        setTotalPages(Math.ceil(data.data.total / 10));
      } else {
        throw new Error(data.error?.message || 'Failed to load meetings');
      }
    } catch (err) {
      logger.error('loadMeetings', 'Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a meeting
   */
  const handleDeleteMeeting = async (meetingId) => {
    try {
      logger.info('handleDeleteMeeting', 'Deleting meeting', { meetingId });

      const response = await fetch(`${API_BASE_URL}/api/meeting/${meetingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadMeetings(); // Reload the list
      } else {
        throw new Error(data.error?.message || 'Failed to delete meeting');
      }
    } catch (err) {
      logger.error('handleDeleteMeeting', 'Error:', err);
      setError(err.message);
    }
  };

  /**
   * Handle clicking on a meeting to view details
   */
  const handleMeetingClick = (meeting) => {
    setSelectedMeeting(meeting);
    setShowDetails(true);
  };

  /**
   * Handle closing the meeting details dialog
   */
  const handleCloseDetails = () => {
    // Stop audio if playing
    if (audioRef) {
      audioRef.pause();
      setIsPlaying(false);
    }
    setShowDetails(false);
    setSelectedMeeting(null);
  };

  /**
   * Handle audio play/pause
   */
  const handleAudioPlayPause = () => {
    if (!audioRef) return;
    
    if (isPlaying) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      audioRef.play();
      setIsPlaying(true);
    }
  };

  /**
   * Handle audio element events
   */
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (error) => {
    logger.error('handleAudioError', 'Audio playback error:', error);
    setIsPlaying(false);
    setError('Failed to load audio file');
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format duration
   */
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  return (
    <Box>
      <Typography gutterBottom variant="h6">
        Meeting History
      </Typography>

      {error ? <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert> : null}

      <Card>
        <CardContent>
          {isLoading ? (
            <Typography color="textSecondary">Loading meetings...</Typography>
          ) : meetings.length === 0 ? (
            <Typography color="textSecondary">No meetings found</Typography>
          ) : (
            <>
              <List>
                {meetings.map((meeting) => (
                  <ListItem 
                    button
                    divider 
                    key={meeting.id}
                    onClick={() => handleMeetingClick(meeting)}
                  >
                    <ListItemText
                      primary={meeting.title}
                      secondary={
                        <Box>
                          <Typography variant="caption">
                            {formatDate(meeting.createdAt)}
                          </Typography>
                          {meeting.duration ? <Chip
                              label={formatDuration(meeting.duration)}
                              size="small"
                              style={{ marginLeft: 8 }}
                            /> : null}
                          <Chip
                            color={meeting.status === 'completed' ? 'success' : 'default'}
                            label={meeting.status}
                            size="small"
                            style={{ marginLeft: 8 }}
                          />
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(event, newPage) => setPage(newPage)}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details Dialog */}
      <Dialog 
        fullWidth 
        maxWidth="md"
        open={showDetails}
        onClose={handleCloseDetails}
      >
        {selectedMeeting ? <>
            <DialogTitle>
              <Box alignItems="center" display="flex" gap={1}>
                <SummaryIcon />
                {selectedMeeting.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box mb={2}>
                <Typography color="textSecondary" variant="subtitle2">
                  Meeting Details
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(selectedMeeting.createdAt)}
                </Typography>
                {selectedMeeting.duration ? <Typography variant="body2">
                    <strong>Duration:</strong> {formatDuration(selectedMeeting.duration)}
                  </Typography> : null}
                <Typography variant="body2">
                  <strong>Status:</strong>{' '}
                  <Chip 
                    color={selectedMeeting.status === 'completed' ? 'success' : 'default'}
                    label={selectedMeeting.status}
                    size="small"
                  />
                </Typography>
                {selectedMeeting.participants && selectedMeeting.participants.length > 0 ? <Typography variant="body2">
                    <strong>Participants:</strong> {selectedMeeting.participants.join(', ')}
                  </Typography> : null}
              </Box>

              <Divider />

              {/* Audio Player Section */}
              {selectedMeeting.audioFilePath ? <Box mt={2}>
                  <Typography color="textSecondary" variant="subtitle2">
                    Audio Recording
                  </Typography>
                  <Box alignItems="center" display="flex" gap={2} mt={1}>
                    <IconButton 
                      color="primary"
                      onClick={handleAudioPlayPause}
                    >
                      {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </IconButton>
                    <VolumeIcon color="action" />
                    <audio
                      controls
                      ref={(ref) => setAudioRef(ref)}
                      src={`/api/meeting/${selectedMeeting.id}/audio`}
                      style={{ flex: 1 }}
                      onEnded={handleAudioEnded}
                      onError={handleAudioError}
                    />
                  </Box>
                </Box> : null}

              <Divider />

              <Box mt={2}>
                <Typography color="textSecondary" variant="subtitle2">
                  Summary
                </Typography>
                {selectedMeeting.summary ? (
                  <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }} variant="body1">
                    {selectedMeeting.summary}
                  </Typography>
                ) : (
                  <Typography color="textSecondary" sx={{ mt: 1 }} variant="body2">
                    {selectedMeeting.status === 'processing' 
                      ? 'Summary is being generated...'
                      : 'No summary available'
                    }
                  </Typography>
                )}
              </Box>

              {selectedMeeting.transcript ? <Box mt={2}>
                  <Divider />
                  <Typography color="textSecondary" sx={{ mt: 2 }} variant="subtitle2">
                    Transcript
                  </Typography>
                  <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }} variant="body2">
                    {selectedMeeting.transcript}
                  </Typography>
                </Box> : null}
            </DialogContent>
            <DialogActions>
              {selectedMeeting.audioFilePath ? <Button 
                  startIcon={<DownloadIcon />}
                  onClick={() => window.open(`/api/meeting/${selectedMeeting.id}/audio`, '_blank')}
                >
                  Download Audio
                </Button> : null}
              <Button onClick={handleCloseDetails}>
                Close
              </Button>
            </DialogActions>
          </> : null}
      </Dialog>
    </Box>
  );
};

export default MeetingHistory;

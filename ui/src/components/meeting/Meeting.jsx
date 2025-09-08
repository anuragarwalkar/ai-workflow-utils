import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  History as HistoryIcon,
  Mic as MicIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useUnreleasedFeatures } from '../../hooks/useFeatureFlag';
import MeetingRecorder from './MeetingRecorder';
import MeetingHistory from './MeetingHistory';
import MeetingSettings from './MeetingSettings';
import { MeetingStyles } from './Meeting.style';

/**
 * Meeting Component - Main container for meeting recording and summarization
 * Follows Material-UI design patterns and project guidelines
 */
const Meeting = () => {
  const [showUnreleasedFeatures] = useUnreleasedFeatures();
  const [activeTab, setActiveTab] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRecording, setCurrentRecording] = useState(null);

  // Check for active recordings on component mount
  useEffect(() => {
    checkActiveRecordings();
  }, []);

  /**
   * Check for any active recordings
   */
  const checkActiveRecordings = async () => {
    try {
      console.log('[MEETING] [checkActiveRecordings] Checking for active recordings');
      
      const response = await fetch('/api/meeting/recordings/active');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setIsRecording(true);
          setCurrentRecording(data.data[0]);
        }
      }
    } catch (error) {
      console.error('[MEETING] [checkActiveRecordings] Error:', error);
    }
  };

  /**
   * Handle tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    console.log('[MEETING] [handleTabChange] Tab changed to:', newValue);
  };

  /**
   * Handle recording state changes
   * @param {boolean} recording - Recording state
   * @param {Object} recordingData - Recording data
   */
  const handleRecordingChange = (recording, recordingData = null) => {
    setIsRecording(recording);
    setCurrentRecording(recordingData);
    console.log('[MEETING] [handleRecordingChange] Recording state changed:', { recording, recordingData });
  };

  const tabs = [
    {
      label: 'Record Meeting',
      icon: <MicIcon />,
      component: (
        <MeetingRecorder
          currentRecording={currentRecording}
          isRecording={isRecording}
          onRecordingChange={handleRecordingChange}
        />
      ),
    },
    {
      label: 'Meeting History',
      icon: <HistoryIcon />,
      component: <MeetingHistory />,
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      component: <MeetingSettings />,
    },
  ];

  return (
    <MeetingStyles>
      <Box className="meeting-container">
        {/* Header */}
        <Box className="meeting-header">
          <Typography className="meeting-title" variant="h4">
            AI Meeting Summarizer
          </Typography>
          <Typography className="meeting-subtitle" variant="body2">
            Record meetings and generate AI-powered summaries with action items
          </Typography>
          
          {isRecording ? <Alert 
              className="recording-alert" 
              icon={<MicIcon className="pulsing-icon" />}
              severity="info"
            >
              Recording in progress - {currentRecording?.title || 'Untitled Meeting'}
            </Alert> : null}
        </Box>

        {/* Tabs */}
        <Card className="meeting-card">
          <Box className="tabs-container">
            <Tabs
              className="meeting-tabs"
              value={activeTab}
              variant="fullWidth"
              onChange={handleTabChange}
            >
              {tabs.map((tab, index) => (
                <Tab
                  className="meeting-tab"
                  icon={tab.icon}
                  iconPosition="start"
                  key={index}
                  label={tab.label}
                />
              ))}
            </Tabs>
          </Box>

          <CardContent className="tab-content">
            {tabs[activeTab]?.component}
          </CardContent>
        </Card>

        {/* Feature Status */}
        {showUnreleasedFeatures ? <Box className="feature-status">
            <Chip
              color="warning"
              label="Alpha Feature"
              size="small"
              variant="outlined"
            />
            <Typography className="feature-note" variant="caption">
              This feature is in alpha testing. Please report any issues.
            </Typography>
          </Box> : null}
      </Box>
    </MeetingStyles>
  );
};

export default Meeting;

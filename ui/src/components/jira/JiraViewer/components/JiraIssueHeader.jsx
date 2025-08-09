import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import {
  BugReport,
  SubdirectoryArrowRight,
  Task,
  Visibility,
} from '@mui/icons-material';
import { useAppTheme } from '../../../../theme/useAppTheme';

const JiraIssueHeader = ({ jiraData }) => {
  const { isDark } = useAppTheme();

  const getIssueIcon = issueType => {
    switch (issueType?.toLowerCase()) {
      case 'bug':
        return <BugReport sx={{ color: '#ff6b6b' }} />;
      case 'task':
        return <Task sx={{ color: '#4ecdc4' }} />;
      case 'story':
        return <SubdirectoryArrowRight sx={{ color: '#45b7d1' }} />;
      default:
        return <Task sx={{ color: '#4ecdc4' }} />;
    }
  };

  const getPriorityColor = priority => {
    switch (priority?.toLowerCase()) {
      case 'highest':
      case 'critical':
        return '#ff4757';
      case 'high':
        return '#ff7675';
      case 'medium':
        return '#fdcb6e';
      case 'low':
        return '#6c5ce7';
      case 'lowest':
        return '#a29bfe';
      default:
        return '#74b9ff';
    }
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'done':
      case 'resolved':
      case 'closed':
        return '#00b894';
      case 'in progress':
      case 'in review':
        return '#fdcb6e';
      case 'blocked':
        return '#e17055';
      case 'to do':
      case 'open':
        return '#74b9ff';
      default:
        return '#a29bfe';
    }
  };

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        background: isDark
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(255, 255, 255, 0.7)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.05)'
          : '1px solid rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {getIssueIcon(jiraData.fields?.issuetype?.name)}
        <Typography
          sx={{
            color: isDark
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(45, 55, 72, 0.7)',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            letterSpacing: 1,
            fontWeight: 500,
          }}
          variant='body2'
        >
          {jiraData.fields?.project?.name || 'Project'} / {jiraData.key}
        </Typography>
      </Box>

      <Typography
        sx={{
          color: isDark ? 'white' : '#2d3748',
          fontWeight: 600,
          mb: 2,
          lineHeight: 1.2,
          pr: 2,
          fontSize: '1.1rem',
        }}
        variant='h6'
      >
        {jiraData.fields?.summary || 'No title available'}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Chip
          label={jiraData.fields?.issuetype?.name || 'Unknown'}
          size='small'
          sx={{
            background: 'rgba(102, 126, 234, 0.15)',
            color: isDark ? 'white' : '#2d3748',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            fontSize: '0.65rem',
            fontWeight: 500,
            height: 22,
          }}
        />
        <Chip
          label={jiraData.fields?.status?.name || 'Unknown'}
          size='small'
          sx={{
            background: `${getStatusColor(jiraData.fields?.status?.name)}20`,
            color: getStatusColor(jiraData.fields?.status?.name),
            border: `1px solid ${getStatusColor(jiraData.fields?.status?.name)}40`,
            fontSize: '0.65rem',
            fontWeight: 500,
            height: 22,
          }}
        />
        <Chip
          label={jiraData.fields?.priority?.name || 'None'}
          size='small'
          sx={{
            background: `${getPriorityColor(jiraData.fields?.priority?.name)}20`,
            color: getPriorityColor(jiraData.fields?.priority?.name),
            border: `1px solid ${getPriorityColor(jiraData.fields?.priority?.name)}40`,
            fontSize: '0.65rem',
            fontWeight: 500,
            height: 22,
          }}
        />
      </Box>
    </Box>
  );
};

export default JiraIssueHeader;

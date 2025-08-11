import React from 'react';
import { Avatar, Box, Chip, Typography } from '@mui/material';
import { BugReport, SubdirectoryArrowRight, Task, TrendingUp } from '@mui/icons-material';
import { useAppTheme } from '../../../../theme/useAppTheme';

const JiraSidebar = ({ jiraData }) => {
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

  return (
    <Box
      sx={{
        width: '320px',
        background: isDark ? 'rgba(20, 20, 40, 0.95)' : 'rgba(248, 250, 252, 0.95)',
        backdropFilter: 'blur(20px)',
        borderLeft: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px',
      }}
    >
      {/* Details Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            color: isDark ? 'white' : '#2d3748',
            fontWeight: 600,
            mb: 2,
            fontSize: '1rem',
          }}
          variant='h6'
        >
          Details
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Type */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Type:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getIssueIcon(jiraData.fields?.issuetype?.name)}
              <Typography
                sx={{
                  color: isDark ? 'white' : '#2d3748',
                  fontWeight: 500,
                }}
                variant='body2'
              >
                {jiraData.fields?.issuetype?.name || 'Unknown'}
              </Typography>
            </Box>
          </Box>

          {/* Priority */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Priority:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp
                sx={{
                  color: getPriorityColor(jiraData.fields?.priority?.name),
                  fontSize: 16,
                }}
              />
              <Typography
                sx={{
                  color: getPriorityColor(jiraData.fields?.priority?.name),
                  fontWeight: 500,
                }}
                variant='body2'
              >
                {jiraData.fields?.priority?.name || 'None'}
              </Typography>
            </Box>
          </Box>

          {/* Resolution */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Resolution:
            </Typography>
            <Typography
              sx={{ color: isDark ? 'white' : '#2d3748', fontWeight: 500 }}
              variant='body2'
            >
              {jiraData.fields?.resolution?.name || 'Unresolved'}
            </Typography>
          </Box>

          {/* Component */}
          {jiraData.fields?.components && jiraData.fields.components.length > 0 ? (
            <Box>
              <Typography
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                  display: 'block',
                  fontSize: '0.75rem',
                  mb: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
                variant='caption'
              >
                Component/s:
              </Typography>
              <Typography
                sx={{
                  color: isDark ? 'white' : '#2d3748',
                  fontWeight: 500,
                }}
                variant='body2'
              >
                {jiraData.fields.components.map(c => c.name).join(', ')}
              </Typography>
            </Box>
          ) : null}

          {/* Labels */}
          {jiraData.fields?.labels && jiraData.fields.labels.length > 0 ? (
            <Box>
              <Typography
                variant='caption'
                sx={{
                  color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                  display: 'block',
                  fontSize: '0.75rem',
                  mb: 0.5,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Labels:
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {jiraData.fields.labels.map((label, index) => (
                  <Chip
                    key={index}
                    label={label}
                    size='small'
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      background: 'rgba(102, 126, 234, 0.15)',
                      color: isDark ? 'white' : '#2d3748',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                    }}
                  />
                ))}
              </Box>
            </Box>
          ) : null}
        </Box>
      </Box>

      {/* People Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            color: isDark ? 'white' : '#2d3748',
            fontWeight: 600,
            mb: 2,
            fontSize: '1rem',
          }}
          variant='h6'
        >
          People
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Assignee */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Assignee:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: '0.7rem',
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                }}
              >
                {jiraData.fields?.assignee?.displayName?.charAt(0) || 'U'}
              </Avatar>
              <Typography
                sx={{
                  color: isDark ? 'white' : '#2d3748',
                  fontWeight: 500,
                }}
                variant='body2'
              >
                {jiraData.fields?.assignee?.displayName || 'Unassigned'}
              </Typography>
            </Box>
          </Box>

          {/* Reporter */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Reporter:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                sx={{
                  width: 24,
                  height: 24,
                  fontSize: '0.7rem',
                  background: 'linear-gradient(45deg, #4ecdc4 30%, #44a08d 90%)',
                }}
              >
                {jiraData.fields?.reporter?.displayName?.charAt(0) || 'U'}
              </Avatar>
              <Typography
                sx={{
                  color: isDark ? 'white' : '#2d3748',
                  fontWeight: 500,
                }}
                variant='body2'
              >
                {jiraData.fields?.reporter?.displayName || 'Unknown'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Dates Section */}
      <Box>
        <Typography
          sx={{
            color: isDark ? 'white' : '#2d3748',
            fontWeight: 600,
            mb: 2,
            fontSize: '1rem',
          }}
          variant='h6'
        >
          Dates
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Created */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Created:
            </Typography>
            <Typography
              sx={{ color: isDark ? 'white' : '#2d3748', fontWeight: 500 }}
              variant='body2'
            >
              {new Date(jiraData.fields?.created).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }) || 'Unknown'}
            </Typography>
          </Box>

          {/* Updated */}
          <Box>
            <Typography
              sx={{
                color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 55, 72, 0.6)',
                display: 'block',
                fontSize: '0.75rem',
                mb: 0.5,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
              variant='caption'
            >
              Updated:
            </Typography>
            <Typography
              sx={{ color: isDark ? 'white' : '#2d3748', fontWeight: 500 }}
              variant='body2'
            >
              {new Date(jiraData.fields?.updated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }) || 'Unknown'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default JiraSidebar;

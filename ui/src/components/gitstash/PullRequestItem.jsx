import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { Person as PersonIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import { formatDate, getAuthorName, getStatusColor } from '../../utils/pullRequestUtils';

const PullRequestHeader = ({ pr }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      mb: 1,
    }}
  >
    <Typography component='span' variant='subtitle1'>
      {pr.title}
    </Typography>
    <Chip color={getStatusColor(pr.state)} label={pr.state} size='small' variant='outlined' />
  </Box>
);

const PullRequestMeta = ({ pr }) => (
  <Box component='div'>
    <Typography color='text.secondary' component='div' sx={{ mb: 0.5 }} variant='body2'>
      #{pr.id} • by {getAuthorName(pr)}
    </Typography>
    <Box
      component='div'
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 0.5,
      }}
    >
      <ScheduleIcon color='action' fontSize='small' />
      <Typography color='text.secondary' component='span' variant='caption'>
        Created: {formatDate(pr.createdDate)}
      </Typography>
    </Box>
  </Box>
);

const PullRequestDetails = ({ pr }) => (
  <Box
    component='div'
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      flexWrap: 'wrap',
    }}
  >
    <Typography color='text.secondary' component='span' variant='caption'>
      From: {pr.fromRef?.displayId || 'Unknown'}
    </Typography>
    <Typography color='text.secondary' component='span' variant='caption'>
      To: {pr.toRef?.displayId || 'Unknown'}
    </Typography>
    {pr.reviewers?.length > 0 && (
      <Typography color='text.secondary' component='span' variant='caption'>
        Reviewers: {pr.reviewers.length}
      </Typography>
    )}
    {pr.properties?.commentCount > 0 && (
      <Typography color='text.secondary' component='span' variant='caption'>
        Comments: {pr.properties.commentCount}
      </Typography>
    )}
    {pr.properties?.openTaskCount > 0 && (
      <Typography color='text.secondary' component='span' variant='caption'>
        Tasks: {pr.properties.openTaskCount}
      </Typography>
    )}
  </Box>
);

const PullRequestDescription = ({ description }) => {
  if (!description) return null;

  return (
    <Typography component='div' sx={{ mt: 1, maxWidth: '80%' }} variant='body2'>
      {description.length > 100 ? `${description.substring(0, 100)}...` : description}
    </Typography>
  );
};

const PullRequestItem = ({ pr, selectedPullRequest, onSelectPR }) => (
  <ListItem disablePadding>
    <ListItemButton
      selected={selectedPullRequest?.id === pr.id}
      sx={{
        border: selectedPullRequest?.id === pr.id ? 2 : 1,
        borderColor: selectedPullRequest?.id === pr.id ? 'primary.main' : 'divider',
        borderRadius: 1,
        mb: 1,
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
      onClick={() => onSelectPR(pr)}
    >
      <ListItemAvatar>
        <Avatar>
          <PersonIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={<PullRequestHeader pr={pr} />}
        secondary={
          <Box component='div'>
            <PullRequestMeta pr={pr} />
            <PullRequestDetails pr={pr} />
            <PullRequestDescription description={pr.description} />
          </Box>
        }
      />
    </ListItemButton>
  </ListItem>
);

export default PullRequestItem;

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { log } from '../../utils/log';

const RunningJobsBanner = ({ cronJobs, isJobRunning, currentJobName }) => {
  const [displayedJobs, setDisplayedJobs] = useState([]);

  useEffect(() => {
    // Get running or recently completed jobs
    const runningJobs = cronJobs.filter(job => job.status === 'running');
    setDisplayedJobs(runningJobs);
    log('[RUNNING_JOBS_BANNER] [useEffect] Jobs state', {
      runningCount: runningJobs.length,
      isJobRunning,
      currentJobName,
    });
  }, [cronJobs, isJobRunning, currentJobName]);

  if (!isJobRunning && displayedJobs.length === 0) {
    return null;
  }

  return (
    <Box mb={3}>
      {isJobRunning && currentJobName ? (
        <Alert
          icon={<CircularProgress size={20} />}
          severity='info'
        >
          <Box alignItems='center' display='flex' gap={2}>
            <Box flex={1}>
              <Typography sx={{ fontWeight: 'bold' }} variant='body2'>
                Running: {currentJobName}
              </Typography>
              <Typography sx={{ fontSize: '12px', mt: 0.5 }} variant='caption'>
                Execution in progress. Check progress modal for details.
              </Typography>
            </Box>
            <Chip
              icon={<ScheduleIcon />}
              label='In Progress'
              size='small'
              variant='outlined'
            />
          </Box>
        </Alert>
      ) : null}

      {displayedJobs.length > 0 && !isJobRunning ? (
        <Alert severity='warning'>
          <Box>
            <Typography sx={{ fontWeight: 'bold', mb: 1 }} variant='body2'>
              Jobs Status Overview
            </Typography>
            <Box display='flex' flexWrap='wrap' gap={1}>
              {displayedJobs.map(job => (
                <Chip
                  icon={job.status === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
                  key={job.id}
                  label={`${job.name} - ${job.status}`}
                  variant='outlined'
                />
              ))}
            </Box>
          </Box>
        </Alert>
      ) : null}
    </Box>
  );
};

export default RunningJobsBanner;

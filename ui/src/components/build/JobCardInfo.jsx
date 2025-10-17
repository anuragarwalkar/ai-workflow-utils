import React from 'react';
import { Typography } from '@mui/material';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const JobCardInfo = ({ description, lastRun, nextRun, schedule, cronExpression }) => (
  <>
    {description ? (
      <Typography color='text.secondary' mb={2} variant='body2'>
        {description}
      </Typography>
    ) : null}

    <Typography mb={1} variant='body2'>
      <strong>Schedule:</strong>{' '}
      {schedule?.type === 'daily'
        ? `Daily at ${schedule.time}`
        : schedule?.type === 'weekly'
          ? `Weekly on ${DAYS_OF_WEEK[schedule.dayOfWeek]} at ${schedule.time}`
          : `Custom: ${cronExpression}`}
    </Typography>

    {lastRun ? (
      <Typography mb={1} variant='body2'>
        <strong>Last Run:</strong> {new Date(lastRun).toLocaleString()}
      </Typography>
    ) : null}

    {nextRun ? (
      <Typography mb={2} variant='body2'>
        <strong>Next Run:</strong> {new Date(nextRun).toLocaleString()}
      </Typography>
    ) : null}
  </>
);

export default JobCardInfo;

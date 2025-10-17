import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
} from '@mui/material';
import JobCardInfo from './JobCardInfo';
import JobActionButtons from './JobActionButtons';

const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    running: 'warning',
    failed: 'error',
  };
  return colors[status] || 'default';
};

const JobCardGrid = ({
  cronJobs,
  onToggle,
  onTrigger,
  onEdit,
  onDelete,
}) => (
  <Grid container spacing={3}>
    {cronJobs.map(job => (
      <Grid item key={job.id} lg={4} md={6} xs={12}>
        <Card>
          <CardContent>
            <Box
              alignItems='flex-start'
              display='flex'
              justifyContent='space-between'
              mb={2}
            >
              <Typography component='h3' variant='h6'>
                {job.name}
              </Typography>
              <Chip
                color={getStatusColor(job.status)}
                label={job.status}
                size='small'
              />
            </Box>

            <JobCardInfo
              cronExpression={job.cronExpression}
              description={job.description}
              lastRun={job.lastRun}
              nextRun={job.nextRun}
              schedule={job.schedule}
            />

            <JobActionButtons
              enabled={job.enabled}
              job={job}
              jobId={job.id}
              status={job.status}
              onDelete={onDelete}
              onEdit={onEdit}
              onToggle={onToggle}
              onTrigger={onTrigger}
            />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

export default JobCardGrid;

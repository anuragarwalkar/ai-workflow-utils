import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import {
  useDeleteCronJobMutation,
  useGetAllCronJobsQuery,
  useToggleCronJobMutation,
  useTriggerCronJobManuallyMutation,
} from '../../store/api/cronJobApi';
import { log } from '../../utils/log';
import CronJobDialog from './CronJobDialog';
import CronJobProgress from './CronJobProgress';
import ExecutionHistory from './ExecutionHistory';
import JobCardGrid from './JobCardGrid';
import RunningJobsBanner from './RunningJobsBanner';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const EmptyState = ({ buildConfig, onAddClick }) => (
  <Box py={8} textAlign='center'>
    <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
    <Typography color='text.secondary' mb={1} variant='h6'>
      No Scheduled Builds
    </Typography>
    <Typography color='text.secondary' mb={3} variant='body2'>
      Create your first scheduled build to automate your release process.
    </Typography>
    <Button
      disabled={!buildConfig}
      startIcon={<AddIcon />}
      variant='outlined'
      onClick={onAddClick}
    >
      Schedule Your First Build
    </Button>
  </Box>
);

const CronJobSchedule = ({ buildConfig, onScheduleCreated }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const { isRunning: isJobRunning, currentJobName } = useSelector(
    state => state.cronJobProgress
  );

  const { data: cronJobs = [], isLoading, refetch } = useGetAllCronJobsQuery();
  const [deleteCronJob] = useDeleteCronJobMutation();
  const [toggleCronJob] = useToggleCronJobMutation();
  const [triggerManually] = useTriggerCronJobManuallyMutation();

  const handleOpenDialog = (job = null) => {
    setEditingJob(job);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingJob(null);
    refetch();
  };

  const handleDeleteJob = async (jobId) => {
    try {
      log('[CRON_JOB_SCHEDULE] [handleDeleteJob] Deleting', { jobId });
      await deleteCronJob(jobId).unwrap();
    } catch (err) {
      log('[CRON_JOB_SCHEDULE] [handleDeleteJob] Error', { error: err });
    }
  };

  const handleToggleJob = async (jobId) => {
    try {
      log('[CRON_JOB_SCHEDULE] [handleToggleJob] Toggling', { jobId });
      await toggleCronJob(jobId).unwrap();
    } catch (err) {
      log('[CRON_JOB_SCHEDULE] [handleToggleJob] Error', { error: err });
    }
  };

  const handleTriggerManually = async (jobId) => {
    try {
      log('[CRON_JOB_SCHEDULE] [handleTriggerManually] Triggering', { jobId });
      await triggerManually(jobId).unwrap();
    } catch (err) {
      log('[CRON_JOB_SCHEDULE] [handleTriggerManually] Error', { error: err });
    }
  };

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' p={4}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        alignItems='center'
        display='flex'
        justifyContent='space-between'
        mb={3}
      >
        <Typography component='h2' variant='h5'>
          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Scheduled Builds
        </Typography>
        <Button
          disabled={!buildConfig}
          startIcon={<AddIcon />}
          variant='contained'
          onClick={() => handleOpenDialog()}
        >
          Schedule New Build
        </Button>
      </Box>

      {!buildConfig && (
        <Alert severity='info' sx={{ mb: 3 }}>
          Configure build settings first to enable scheduling.
        </Alert>
      )}

      <RunningJobsBanner
        cronJobs={cronJobs}
        currentJobName={currentJobName}
        isJobRunning={isJobRunning}
      />

      {cronJobs.length ? (
        <JobCardGrid
          cronJobs={cronJobs}
          onDelete={handleDeleteJob}
          onEdit={handleOpenDialog}
          onToggle={handleToggleJob}
          onTrigger={handleTriggerManually}
        />
      ) : (
        <EmptyState
          buildConfig={buildConfig}
          onAddClick={() => handleOpenDialog()}
        />
      )}

      <ExecutionHistory cronJobs={cronJobs} />

      <CronJobDialog
        buildConfig={buildConfig}
        editingJob={editingJob}
        open={openDialog}
        onClose={handleCloseDialog}
        onScheduleCreated={onScheduleCreated}
      />

      <Dialog
        fullWidth
        maxWidth='md'
        open={isJobRunning}
        onClose={() => {}}
      >
        <CronJobProgress
          jobName={currentJobName}
          onClose={() => {}}
        />
      </Dialog>
    </Box>
  );
};

export default CronJobSchedule;
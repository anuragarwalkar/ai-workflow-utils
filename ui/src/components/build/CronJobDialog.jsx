import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from '@mui/material';
import {
  useConvertScheduleToCronMutation,
  useCreateCronJobMutation,
  useUpdateCronJobMutation,
} from '../../store/api/cronJobApi';
import { log } from '../../utils/log';

const SCHEDULE_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom Cron Expression' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const buildJobData = ({ scheduleForm, buildConfig, cronExpression }) => ({
  name: scheduleForm.name,
  description: scheduleForm.description,
  ticketNumber: scheduleForm.ticketNumber,
  cronExpression,
  schedule: {
    type: scheduleForm.type,
    time: scheduleForm.time,
    ...(scheduleForm.type === 'weekly' && { dayOfWeek: scheduleForm.dayOfWeek }),
  },
  buildConfig: buildConfig || {},
  enabled: scheduleForm.enabled,
});

const CronJobDialog = ({ open, onClose, editingJob, buildConfig, onScheduleCreated }) => {
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    ticketNumber: '',
    type: 'daily',
    time: '09:00',
    dayOfWeek: 1,
    cronExpression: '',
    enabled: true,
  });

  const [createCronJob] = useCreateCronJobMutation();
  const [updateCronJob] = useUpdateCronJobMutation();
  const [convertSchedule] = useConvertScheduleToCronMutation();

  useEffect(() => {
    if (editingJob && editingJob.id) {
      log('[CRON_JOB_DIALOG] [useEffect] Loading job for edit', { 
        jobId: editingJob.id,
        jobName: editingJob.name,
      });
      setScheduleForm({
        name: editingJob.name || '',
        description: editingJob.description || '',
        ticketNumber: editingJob.ticketNumber || '',
        type: (editingJob.schedule && editingJob.schedule.type) || 'custom',
        time: (editingJob.schedule && editingJob.schedule.time) || '09:00',
        dayOfWeek: (editingJob.schedule && editingJob.schedule.dayOfWeek) || 1,
        cronExpression: editingJob.cronExpression || '',
        enabled: editingJob.enabled !== undefined ? editingJob.enabled : true,
      });
    } else if (!editingJob && open) {
      log('[CRON_JOB_DIALOG] [useEffect] Resetting form for new job');
      setScheduleForm({
        name: '',
        description: '',
        ticketNumber: '',
        type: 'daily',
        time: '09:00',
        dayOfWeek: 1,
        cronExpression: '',
        enabled: true,
      });
    }
  }, [editingJob, open]);

  const handleFormChange = (field, value) => {
    log('[CRON_JOB_DIALOG] [handleFormChange] Form field changed', { field, value });
    setScheduleForm(prev => ({ ...prev, [field]: value }));
  };

  const convertScheduleIfNeeded = async (scheduleForm, convertSchedule) => {
    if (scheduleForm.type === 'custom') {
      return scheduleForm.cronExpression;
    }

    const scheduleConfig = {
      type: scheduleForm.type,
      time: scheduleForm.time,
      ...(scheduleForm.type === 'weekly' && { dayOfWeek: scheduleForm.dayOfWeek }),
    };
    const convertResult = await convertSchedule(scheduleConfig).unwrap();
    return convertResult.cronExpression;
  };

  const handleSave = async () => {
    try {
      const cronExpression = await convertScheduleIfNeeded(scheduleForm, convertSchedule);
      const jobData = buildJobData({ scheduleForm, buildConfig, cronExpression });
      const isUpdating = !!editingJob;

      if (isUpdating) {
        await updateCronJob({ id: editingJob.id, ...jobData }).unwrap();
      } else {
        const newJob = await createCronJob(jobData).unwrap();
        onScheduleCreated?.(newJob);
      }

      onClose();
    } catch (error) {
      log('[CRON_JOB_DIALOG] [handleSave] Error', { error: error.message || error });
    }
  };

  const isFormValid = () => {
    return scheduleForm.name && 
           (scheduleForm.type !== 'custom' || scheduleForm.cronExpression);
  };

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={onClose}>
      <DialogTitle>
        {editingJob ? 'Edit Scheduled Build' : 'Schedule New Build'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label='Job Name'
              value={scheduleForm.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Ticket Number (JIRA/Issue ID)'
              placeholder='e.g., PROJ-123'
              value={scheduleForm.ticketNumber}
              onChange={(e) => handleFormChange('ticketNumber', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              label='Description'
              rows={2}
              value={scheduleForm.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                label='Schedule Type'
                value={scheduleForm.type}
                onChange={(e) => handleFormChange('type', e.target.value)}
              >
                {SCHEDULE_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {scheduleForm.type !== 'custom' && (
            <Grid item sm={6} xs={12}>
              <TextField
                fullWidth
                InputLabelProps={{ shrink: true }}
                label='Time'
                type='time'
                value={scheduleForm.time}
                onChange={(e) => handleFormChange('time', e.target.value)}
              />
            </Grid>
          )}
          
          {scheduleForm.type === 'weekly' && (
            <Grid item sm={6} xs={12}>
              <FormControl fullWidth>
                <InputLabel>Day of Week</InputLabel>
                <Select
                  label='Day of Week'
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) => handleFormChange('dayOfWeek', e.target.value)}
                >
                  {DAYS_OF_WEEK.map(day => (
                    <MenuItem key={day.value} value={day.value}>
                      {day.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {scheduleForm.type === 'custom' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                helperText='Example: "0 9 * * 1-5" runs at 9 AM Monday through Friday'
                label='Cron Expression'
                placeholder='0 9 * * 1-5'
                value={scheduleForm.cronExpression}
                onChange={(e) => handleFormChange('cronExpression', e.target.value)}
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={scheduleForm.enabled}
                  onChange={(e) => handleFormChange('enabled', e.target.checked)}
                />
              }
              label='Enable immediately'
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          disabled={!isFormValid()}
          variant='contained'
          onClick={handleSave}
        >
          {editingJob ? 'Update' : 'Create'} Schedule
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CronJobDialog;
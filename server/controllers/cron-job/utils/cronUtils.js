export const generateCronExpression = (schedule) => {
  const { type, time = '09:00', dayOfWeek, cronExpression: customCron } = schedule;
  const [hour, minute] = time.split(':');

  switch (type) {
    case 'daily':
      return { success: true, data: `${minute} ${hour} * * *` };
    case 'weekly':
      if (dayOfWeek === undefined) {
        return {
          success: false,
          message: 'Day of week is required for weekly schedule',
        };
      }
      return { success: true, data: `${minute} ${hour} * * ${dayOfWeek}` };
    case 'custom':
      if (!customCron) {
        return {
          success: false,
          message: 'Cron expression is required for custom schedule',
        };
      }
      return { success: true, data: customCron };
    default:
      return {
        success: false,
        message: 'Invalid schedule type. Must be daily, weekly, or custom',
      };
  }
};

export const getNextRunTime = (_cronExpression) => {
  // TODO: Implement using cron-parser or similar library
  // For now, return a placeholder
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
};

export const formatJobStatus = (job) => {
  return {
    ...job,
    nextRunFormatted: job.nextRun ? new Date(job.nextRun).toLocaleString() : null,
    lastRunFormatted: job.lastRun ? new Date(job.lastRun).toLocaleString() : null,
  };
};
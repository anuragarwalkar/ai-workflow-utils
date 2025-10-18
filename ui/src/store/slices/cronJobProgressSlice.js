import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isRunning: false,
  cronJobLogs: [],
  cronJobStatus: null, // 'start', 'success', 'error', null
  cronJobError: null,
  currentJobId: null,
  currentJobName: null,
};

const cronJobProgressSlice = createSlice({
  name: 'cronJobProgress',
  initialState,
  reducers: {
    startCronJob: (state, action) => {
      state.isRunning = true;
      state.cronJobLogs = [];
      state.cronJobStatus = 'start';
      state.currentJobId = action.payload.jobId;
      state.currentJobName = action.payload.jobName;
      state.cronJobError = null;
    },
    addCronJobLog: (state, action) => {
      const logEntry = {
        timestamp: action.payload.timestamp || new Date().toISOString(),
        message: action.payload.message,
        logType: action.payload.logType || 'info',
      };
      state.cronJobLogs.push(logEntry);
      if (action.payload.logType === 'success' || action.payload.logType === 'error') {
        state.isRunning = false;
        state.cronJobStatus = action.payload.logType;
      }
    },
    clearCronJobLogs: state => {
      state.cronJobLogs = [];
      state.cronJobStatus = null;
    },
    setCronJobError: (state, action) => {
      state.cronJobError = action.payload;
      state.isRunning = false;
      state.cronJobStatus = 'error';
    },
    completeCronJob: (state, action) => {
      state.isRunning = false;
      state.cronJobStatus = action.payload.status || 'success';
    },
    resetCronJobProgress: state => {
      state.isRunning = false;
      state.cronJobLogs = [];
      state.cronJobStatus = null;
      state.cronJobError = null;
      state.currentJobId = null;
      state.currentJobName = null;
    },
  },
});

export const {
  startCronJob,
  addCronJobLog,
  clearCronJobLogs,
  setCronJobError,
  completeCronJob,
  resetCronJobProgress,
} = cronJobProgressSlice.actions;

export default cronJobProgressSlice.reducer;

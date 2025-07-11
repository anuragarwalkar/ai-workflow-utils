import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isBuilding: false,
  buildLogs: [],
  buildStatus: null, // 'start', 'success', 'error', null
  isModalOpen: false,
  lastBuildId: null,
  error: null,
};

const buildSlice = createSlice({
  name: 'build',
  initialState,
  reducers: {
    startBuild: (state, action) => {
      state.isBuilding = true;
      state.buildLogs = [];
      state.buildStatus = 'start';
      state.lastBuildId = action.payload.buildId;
      state.error = null;
      state.isModalOpen = true;
    },
    addBuildLog: (state, action) => {
      const logEntry = {
        id: Date.now() + Math.random(),
        ...action.payload,
      };
      state.buildLogs.push(logEntry);
      
      // Update build status based on log type
      if (action.payload.type === 'success' || action.payload.type === 'error') {
        state.isBuilding = false;
        state.buildStatus = action.payload.type;
      }
    },
    clearBuildLogs: (state) => {
      state.buildLogs = [];
      state.buildStatus = null;
    },
    setBuildModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    resetBuildState: (state) => {
      state.isBuilding = false;
      state.buildLogs = [];
      state.buildStatus = null;
      state.isModalOpen = false;
      state.lastBuildId = null;
      state.error = null;
    },
    setBuildError: (state, action) => {
      state.error = action.payload;
      state.isBuilding = false;
      state.buildStatus = 'error';
    },
  },
});

export const {
  startBuild,
  addBuildLog,
  clearBuildLogs,
  setBuildModalOpen,
  resetBuildState,
  setBuildError,
} = buildSlice.actions;

export default buildSlice.reducer;

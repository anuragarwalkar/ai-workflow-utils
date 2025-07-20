import { createSlice } from '@reduxjs/toolkit';

// Helper functions for localStorage
const loadConfigFromStorage = () => {
  try {
    const savedConfig = localStorage.getItem('release_build_config');
    return savedConfig ? JSON.parse(savedConfig) : null;
  } catch (error) {
    console.error('Failed to load config from localStorage:', error);
    return null;
  }
};

const saveConfigToStorage = (config) => {
  try {
    const configToSave = {
      repoKey: config.repoKey || '',
      repoSlug: config.repoSlug || '',
      gitRepos: config.gitRepos || ''
    };
    localStorage.setItem('release_build_config', JSON.stringify(configToSave));
  } catch (error) {
    console.error('Failed to save config to localStorage:', error);
  }
};

const initialState = {
  isBuilding: false,
  buildLogs: [],
  buildStatus: null, // 'start', 'success', 'error', null
  isModalOpen: false,
  lastBuildId: null,
  error: null,
  buildConfig: null, // Store build configuration for PR creation
  branchName: null, // Store branch name from WebSocket
  savedRepoConfig: loadConfigFromStorage(), // Load saved repository configuration
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
      state.buildConfig = action.payload.buildConfig;
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
      state.buildConfig = null;
      state.branchName = null;
    },
    setBuildError: (state, action) => {
      state.error = action.payload;
      state.isBuilding = false;
      state.buildStatus = 'error';
    },
    setBranchName: (state, action) => {
      state.branchName = action.payload;
    },
    setBuildConfig: (state, action) => {
      state.buildConfig = action.payload;
    },
    saveRepoConfig: (state, action) => {
      const config = action.payload;
      state.savedRepoConfig = {
        repoKey: config.repoKey || '',
        repoSlug: config.repoSlug || '',
        gitRepos: config.gitRepos || ''
      };
      // Save to localStorage
      saveConfigToStorage(config);
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
  setBranchName,
  setBuildConfig,
  saveRepoConfig,
} = buildSlice.actions;

export default buildSlice.reducer;

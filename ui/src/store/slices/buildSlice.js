import { createSlice } from '@reduxjs/toolkit';

// Helper functions for localStorage
const loadConfigFromStorage = () => {
  try {
    const savedConfig = localStorage.getItem('release_build_config');
    return savedConfig ? JSON.parse(savedConfig) : null;
  } catch {
    return null;
  }
};

const loadScriptFromStorage = () => {
  try {
    const savedScript = localStorage.getItem('release_build_script');
    return savedScript ? JSON.parse(savedScript) : null;
  } catch {
    return null;
  }
};

const saveConfigToStorage = config => {
  try {
    const configToSave = {
      repoKey: config.repoKey || '',
      repoSlug: config.repoSlug || '',
      gitRepos: config.gitRepos || '',
    };
    localStorage.setItem('release_build_config', JSON.stringify(configToSave));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const saveScriptToStorage = script => {
  try {
    if (script) {
      localStorage.setItem('release_build_script', JSON.stringify(script));
    } else {
      localStorage.removeItem('release_build_script');
    }
  } catch {
    // Silently fail if localStorage is not available
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
  uploadedScript: loadScriptFromStorage(), // Load saved script information
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
    clearBuildLogs: state => {
      state.buildLogs = [];
      state.buildStatus = null;
    },
    setBuildModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
    resetBuildState: state => {
      state.isBuilding = false;
      state.buildLogs = [];
      state.buildStatus = null;
      state.isModalOpen = false;
      state.lastBuildId = null;
      state.error = null;
      state.buildConfig = null;
      state.branchName = null;
      state.uploadedScript = null;
      // Clear script from localStorage
      saveScriptToStorage(null);
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
        gitRepos: config.gitRepos || '',
      };
      // Save to localStorage
      saveConfigToStorage(config);
    },
    setUploadedScript: (state, action) => {
      state.uploadedScript = action.payload;
      // Save to localStorage
      saveScriptToStorage(action.payload);
    },
    clearUploadedScript: state => {
      state.uploadedScript = null;
      // Remove from localStorage
      saveScriptToStorage(null);
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
  setUploadedScript,
  clearUploadedScript,
} = buildSlice.actions;

export default buildSlice.reducer;

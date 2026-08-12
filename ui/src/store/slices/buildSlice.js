import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../../config/environment.js';

// Async thunks for API
export const fetchBuildConfigs = createAsyncThunk('build/fetchConfigs', async () => {
  const [configRes, scriptRes] = await Promise.all([
    fetch(`${API_BASE_URL}/api/app-state/release_build_config`),
    fetch(`${API_BASE_URL}/api/app-state/release_build_script`)
  ]);
  
  const configData = configRes.ok ? (await configRes.json()).data : null;
  const scriptData = scriptRes.ok ? (await scriptRes.json()).data : null;
  
  return { savedRepoConfig: configData, uploadedScript: scriptData };
});

export const saveConfigToApi = createAsyncThunk('build/saveConfig', async (config) => {
  const configToSave = {
    repoKey: config.repoKey || '',
    repoSlug: config.repoSlug || '',
    gitRepos: config.gitRepos || '',
  };
  await fetch(`${API_BASE_URL}/api/app-state/release_build_config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configToSave)
  });
  return configToSave;
});

export const saveScriptToApi = createAsyncThunk('build/saveScript', async (script) => {
  if (script) {
    await fetch(`${API_BASE_URL}/api/app-state/release_build_script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(script)
    });
  } else {
    await fetch(`${API_BASE_URL}/api/app-state/release_build_script`, { method: 'DELETE' });
  }
  return script;
});

const initialState = {
  isBuilding: false,
  buildLogs: [],
  buildStatus: null, // 'start', 'success', 'error', null
  isModalOpen: false,
  lastBuildId: null,
  error: null,
  buildConfig: null, // Store build configuration for PR creation
  branchName: null, // Store branch name from WebSocket
  savedRepoConfig: null, // Load via fetchBuildConfigs
  uploadedScript: null, // Load via fetchBuildConfigs
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
      // Clear script from API via another action or handled elsewhere

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
    },
    setUploadedScript: (state, action) => {
      state.uploadedScript = action.payload;
    },
    clearUploadedScript: state => {
      state.uploadedScript = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBuildConfigs.fulfilled, (state, action) => {
      if (action.payload.savedRepoConfig) {
        state.savedRepoConfig = action.payload.savedRepoConfig;
      }
      if (action.payload.uploadedScript) {
        state.uploadedScript = action.payload.uploadedScript;
      }
    });
    builder.addCase(saveConfigToApi.fulfilled, (state, action) => {
      state.savedRepoConfig = action.payload;
    });
    builder.addCase(saveScriptToApi.fulfilled, (state, action) => {
      state.uploadedScript = action.payload;
    });
  }
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

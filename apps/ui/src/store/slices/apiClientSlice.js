import { createSlice } from '@reduxjs/toolkit';

// Helper functions
const createRequestName = (method, url, requestCount) => {
  let name = `${method} Request ${requestCount + 1}`;
  if (url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(part => part && part !== 'api');
      if (pathParts.length > 0) {
        const resource = pathParts[pathParts.length - 1];
        name = `${method} ${resource}`;
      }
    } catch {
      const match = url.match(/https?:\/\/([^/]+)/);
      if (match) {
        name = `${method} ${match[1]}`;
      }
    }
  }
  return name;
};

const createRequestFromGenerated = (generatedRequest, name) => ({
  id: globalThis.crypto.randomUUID(),
  name,
  method: generatedRequest.method || 'GET',
  url: generatedRequest.url || '',
  headers: generatedRequest.headers || {},
  params: generatedRequest.params || {},
  body: generatedRequest.body ? JSON.stringify(generatedRequest.body, null, 2) : '',
  bodyType: generatedRequest.bodyType || 'json',
  auth: generatedRequest.auth || {
    type: 'none',
    token: '',
    username: '',
    password: '',
    apiKey: '',
    apiKeyHeader: 'X-API-Key',
  },
  preScript: '',
  postScript: '',
});

const initialState = {
  // Request management
  requests: [
    {
      id: 1,
      name: 'New Request',
      method: 'GET',
      url: '',
      headers: {},
      params: {},
      body: '',
      bodyType: 'json',
      auth: {
        type: 'none',
        token: '',
        username: '',
        password: '',
        apiKey: '',
        apiKeyHeader: 'X-API-Key',
      },
      preScript: '',
      postScript: '',
    }
  ],
  activeRequestIndex: 0,
  
  // UI state
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  activeTab: 0,
  
  // Response state
  currentResponse: null,
  responseHistory: [],
  
  // Loading states
  isExecutingRequest: false,
  
  // Error states
  error: null,
};

const apiClientSlice = createSlice({
  name: 'apiClient',
  initialState,
  reducers: {
    // Request management
    addRequest: (state, action) => {
      const newRequest = {
        id: Date.now(),
        name: `Request ${state.requests.length + 1}`,
        method: 'GET',
        url: '',
        headers: {},
        params: {},
        body: '',
        bodyType: 'json',
        auth: {
          type: 'none',
          token: '',
          username: '',
          password: '',
          apiKey: '',
          apiKeyHeader: 'X-API-Key',
        },
        preScript: '',
        postScript: '',
        ...action.payload,
      };
      state.requests.push(newRequest);
      state.activeRequestIndex = state.requests.length - 1;
    },
    
    updateRequest: (state, action) => {
      const { index, data } = action.payload;
      if (state.requests[index]) {
        state.requests[index] = { ...state.requests[index], ...data };
      }
    },
    
    removeRequest: (state, action) => {
      const index = action.payload;
      if (state.requests.length <= 1) return;
      
      state.requests.splice(index, 1);
      
      // Adjust active request index
      if (index === state.activeRequestIndex) {
        state.activeRequestIndex = index > 0 ? index - 1 : 0;
      } else if (index < state.activeRequestIndex) {
        state.activeRequestIndex = state.activeRequestIndex - 1;
      }
    },
    
    setActiveRequest: (state, action) => {
      const index = action.payload;
      if (index >= 0 && index < state.requests.length) {
        state.activeRequestIndex = index;
      }
    },
    
    addGeneratedRequest: (state, action) => {
      const generatedRequest = action.payload;
      const method = generatedRequest.method || 'GET';
      const url = generatedRequest.url || '';
      
      // Create a better name from the request data
      const name = createRequestName(method, url, state.requests.length);
      const newRequest = createRequestFromGenerated(generatedRequest, name);
      
      state.requests.push(newRequest);
      state.activeRequestIndex = state.requests.length - 1;
    },
    
    addCollectionRequest: (state, action) => {
      const collectionRequest = action.payload;
      const newRequest = {
        id: Date.now(),
        name: collectionRequest.name || 'Collection Request',
        method: collectionRequest.method || 'GET',
        url: collectionRequest.url || '',
        headers: collectionRequest.headers || {},
        params: collectionRequest.params || {},
        body: collectionRequest.body || '',
        bodyType: collectionRequest.bodyType || 'json',
        auth: collectionRequest.auth || {
          type: 'none',
          token: '',
          username: '',
          password: '',
          apiKey: '',
          apiKeyHeader: 'X-API-Key',
        }
      };
      
      state.requests.push(newRequest);
      state.activeRequestIndex = state.requests.length - 1;
    },
    
    // UI state management
    toggleLeftSidebar: (state) => {
      state.leftSidebarCollapsed = !state.leftSidebarCollapsed;
    },
    
    toggleRightSidebar: (state) => {
      state.rightSidebarCollapsed = !state.rightSidebarCollapsed;
    },
    
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    
    // Response management
    setCurrentResponse: (state, action) => {
      state.currentResponse = action.payload;
      if (action.payload) {
        state.responseHistory.unshift({
          timestamp: Date.now(),
          response: action.payload,
          requestId: state.requests[state.activeRequestIndex]?.id,
        });
        // Keep only last 50 responses
        if (state.responseHistory.length > 50) {
          state.responseHistory = state.responseHistory.slice(0, 50);
        }
      }
    },
    
    clearResponseHistory: (state) => {
      state.responseHistory = [];
    },
    
    // Error management
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset state
    resetApiClient: () => initialState,
  },
});

export const {
  addRequest,
  updateRequest,
  removeRequest,
  setActiveRequest,
  addGeneratedRequest,
  addCollectionRequest,
  toggleLeftSidebar,
  toggleRightSidebar,
  setActiveTab,
  setCurrentResponse,
  clearResponseHistory,
  setError,
  clearError,
  resetApiClient,
} = apiClientSlice.actions;

export default apiClientSlice.reducer;

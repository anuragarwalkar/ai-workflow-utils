import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notificationPermission: 'default',
  commandBarResponse: null,
  selectedModel: typeof window !== 'undefined' ? localStorage.getItem('dashboard_selected_model') || null : null,
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setNotificationPermission: (state, action) => {
      state.notificationPermission = action.payload;
    },
    setCommandBarResponse: (state, action) => {
      state.commandBarResponse = action.payload;
    },
    clearCommandBarResponse: (state) => {
      state.commandBarResponse = null;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
      if (typeof window !== 'undefined') {
        if (action.payload) {
          localStorage.setItem('dashboard_selected_model', action.payload);
        } else {
          localStorage.removeItem('dashboard_selected_model');
        }
      }
    },
  },
});

export const { 
  setNotificationPermission, 
  setCommandBarResponse, 
  clearCommandBarResponse,
  setSelectedModel 
} = dashboardSlice.actions;

export const selectNotificationPermission = state => state.dashboard.notificationPermission;
export const selectCommandBarResponse = state => state.dashboard.commandBarResponse;
export const selectSelectedModel = state => state.dashboard.selectedModel;

export default dashboardSlice.reducer;

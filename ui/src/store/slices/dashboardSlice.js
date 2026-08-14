import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notificationPermission: 'default',
  commandBarResponse: null,
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
  },
});

export const { setNotificationPermission, setCommandBarResponse, clearCommandBarResponse } = dashboardSlice.actions;

export const selectNotificationPermission = state => state.dashboard.notificationPermission;
export const selectCommandBarResponse = state => state.dashboard.commandBarResponse;

export default dashboardSlice.reducer;

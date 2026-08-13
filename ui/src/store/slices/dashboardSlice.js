import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notificationPermission: 'default',
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setNotificationPermission: (state, action) => {
      state.notificationPermission = action.payload;
    },
  },
});

export const { setNotificationPermission } = dashboardSlice.actions;

export const selectNotificationPermission = state => state.dashboard.notificationPermission;

export default dashboardSlice.reducer;

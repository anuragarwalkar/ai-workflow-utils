import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  modals: {
    viewJira: false,
  },
  notifications: {
    message: '',
    severity: 'success', // 'success', 'error', 'warning', 'info'
    open: false,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Notification actions
    showNotification: (state, action) => {
      state.notifications.message = action.payload.message;
      state.notifications.severity = action.payload.severity || 'success';
      state.notifications.open = true;
    },
    hideNotification: state => {
      state.notifications.open = false;
    },
    clearNotification: state => {
      state.notifications = initialState.notifications;
    },
  },
});

export const { showNotification, hideNotification, clearNotification } = uiSlice.actions;

export default uiSlice.reducer;

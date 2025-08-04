import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentView: 'home', // 'home', 'createJira', 'viewJira', 'sendEmail', 'gitStash', 'pr', 'settings'
  isLoading: false,
  error: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
      state.error = null; // Clear errors when navigating
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const { setCurrentView, setLoading, setError, clearError } =
  appSlice.actions;
export default appSlice.reducer;

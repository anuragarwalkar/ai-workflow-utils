import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  emailData: null,
  isLoading: false,
  error: null,
  lastSentVersion: null,
};

const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    setEmailData: (state, action) => {
      state.emailData = action.payload;
    },
    setEmailLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setEmailError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearEmailError: (state) => {
      state.error = null;
    },
    setLastSentVersion: (state, action) => {
      state.lastSentVersion = action.payload;
    },
    clearEmailData: (state) => {
      state.emailData = null;
      state.error = null;
    },
  },
});

export const {
  setEmailData,
  setEmailLoading,
  setEmailError,
  clearEmailError,
  setLastSentVersion,
  clearEmailData,
} = emailSlice.actions;

export default emailSlice.reducer;

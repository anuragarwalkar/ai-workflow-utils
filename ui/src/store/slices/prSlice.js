import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedProject: {
    projectKey: '',
    repoSlug: '',
  },
  selectedPullRequest: null,
  directPRId: null,
  diffData: null,
  reviewData: null,
  isReviewing: false,
  error: null,
};

const prSlice = createSlice({
  name: 'pr',
  initialState,
  reducers: {
    setSelectedProject: (state, action) => {
      state.selectedProject = action.payload;
      state.selectedPullRequest = null;
      state.directPRId = null;
      state.diffData = null;
      state.reviewData = null;
      state.error = null;
    },
    setSelectedPullRequest: (state, action) => {
      state.selectedPullRequest = action.payload;
      state.diffData = null;
      state.reviewData = null;
      state.error = null;
    },
    setDirectPRId: (state, action) => {
      state.directPRId = action.payload;
    },
    setDiffData: (state, action) => {
      state.diffData = action.payload;
    },
    setReviewData: (state, action) => {
      state.reviewData = action.payload;
    },
    setIsReviewing: (state, action) => {
      state.isReviewing = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isReviewing = false;
    },
    clearError: state => {
      state.error = null;
    },
    clearPRData: state => {
      state.selectedPullRequest = null;
      state.directPRId = null;
      state.diffData = null;
      state.reviewData = null;
      state.error = null;
    },
  },
});

export const {
  setSelectedProject,
  setSelectedPullRequest,
  setDirectPRId,
  setDiffData,
  setReviewData,
  setIsReviewing,
  setError,
  clearError,
  clearPRData,
} = prSlice.actions;

export default prSlice.reducer;

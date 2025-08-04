import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  createJira: {
    prompt: '',
    imageFile: null,
    previewData: null,
    summary: '',
    description: '',
    issueType: 'Task',
    priority: 'Medium',
    projectType: '',
    customFields: [],
    isCreating: false,
    isPreviewLoading: false,
    streamingContent: '',
    streamingStatus: '',
    isStreaming: false,
  },
  viewJira: {
    jiraId: '',
    jiraDetails: null,
    isFetching: false,
    attachmentFile: null,
    isUploading: false,
  },
};

const jiraSlice = createSlice({
  name: 'jira',
  initialState,
  reducers: {
    // Create Jira actions
    setPrompt: (state, action) => {
      state.createJira.prompt = action.payload;
    },
    setImageFile: (state, action) => {
      state.createJira.imageFile = action.payload;
    },
    setPreviewData: (state, action) => {
      state.createJira.previewData = action.payload;
      if (action.payload) {
        state.createJira.summary = action.payload.summary || '';
        state.createJira.description = action.payload.description || '';
      }
    },
    setSummary: (state, action) => {
      state.createJira.summary = action.payload;
    },
    setDescription: (state, action) => {
      state.createJira.description = action.payload;
    },
    setIssueType: (state, action) => {
      state.createJira.issueType = action.payload;
    },
    setPriority: (state, action) => {
      state.createJira.priority = action.payload;
    },
    setProjectType: (state, action) => {
      state.createJira.projectType = action.payload;
    },
    setCustomFields: (state, action) => {
      state.createJira.customFields = action.payload;
    },
    addCustomField: state => {
      state.createJira.customFields.push({ key: '', value: '' });
    },
    removeCustomField: (state, action) => {
      state.createJira.customFields.splice(action.payload, 1);
    },
    updateCustomField: (state, action) => {
      const { index, field, value } = action.payload;
      if (state.createJira.customFields[index]) {
        state.createJira.customFields[index][field] = value;
      }
    },
    setPreviewLoading: (state, action) => {
      state.createJira.isPreviewLoading = action.payload;
    },
    setCreating: (state, action) => {
      state.createJira.isCreating = action.payload;
    },
    setStreamingContent: (state, action) => {
      state.createJira.streamingContent = action.payload;
    },
    setStreamingStatus: (state, action) => {
      state.createJira.streamingStatus = action.payload;
    },
    setStreaming: (state, action) => {
      state.createJira.isStreaming = action.payload;
    },
    resetCreateJira: state => {
      state.createJira = initialState.createJira;
    },

    // View Jira actions
    setJiraId: (state, action) => {
      state.viewJira.jiraId = action.payload;
    },
    setJiraDetails: (state, action) => {
      state.viewJira.jiraDetails = action.payload;
    },
    setFetching: (state, action) => {
      state.viewJira.isFetching = action.payload;
    },
    setAttachmentFile: (state, action) => {
      state.viewJira.attachmentFile = action.payload;
    },
    setUploading: (state, action) => {
      state.viewJira.isUploading = action.payload;
    },
    resetViewJira: state => {
      state.viewJira = initialState.viewJira;
    },
  },
});

export const {
  setPrompt,
  setImageFile,
  setPreviewData,
  setSummary,
  setDescription,
  setIssueType,
  setPriority,
  setProjectType,
  setCustomFields,
  addCustomField,
  removeCustomField,
  updateCustomField,
  setPreviewLoading,
  setCreating,
  setStreamingContent,
  setStreamingStatus,
  setStreaming,
  resetCreateJira,
  setJiraId,
  setJiraDetails,
  setFetching,
  setAttachmentFile,
  setUploading,
  resetViewJira,
} = jiraSlice.actions;

export default jiraSlice.reducer;

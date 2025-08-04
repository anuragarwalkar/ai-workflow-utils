import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Template data
  templates: [],
  settings: {
    activeTemplates: {},
    version: '1.0.0',
    lastUpdated: null,
  },

  // UI state
  currentTab: 'templates', // templates, general, api, advanced
  isLoading: false,
  isSaving: false,
  error: null,

  // Form state
  editingTemplate: null,
  isFormOpen: false,
  formMode: 'create', // create, edit, duplicate

  // Filters and search
  searchTerm: '',
  filterType: 'all', // all, Bug, Task, Story, PR, etc.
  showDefaultTemplates: true,

  // Import/Export
  isExporting: false,
  isImporting: false,

  // Preview
  previewTemplate: null,
  previewVariables: {},
};

const templateSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSaving: (state, action) => {
      state.isSaving = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },

    // Template data
    setTemplates: (state, action) => {
      state.templates = action.payload;
    },
    addTemplate: (state, action) => {
      state.templates.push(action.payload);
    },
    updateTemplate: (state, action) => {
      const index = state.templates.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.templates[index] = action.payload;
      }
    },
    removeTemplate: (state, action) => {
      state.templates = state.templates.filter(t => t.id !== action.payload);
    },

    // Settings
    setSettings: (state, action) => {
      state.settings = action.payload;
    },
    updateSettings: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setActiveTemplate: (state, action) => {
      const { issueType, templateId } = action.payload;
      state.settings.activeTemplates[issueType] = templateId;
    },

    // UI state
    setCurrentTab: (state, action) => {
      state.currentTab = action.payload;
    },

    // Form state
    setEditingTemplate: (state, action) => {
      state.editingTemplate = action.payload;
    },
    setFormOpen: (state, action) => {
      state.isFormOpen = action.payload;
    },
    setFormMode: (state, action) => {
      state.formMode = action.payload;
    },
    openCreateForm: state => {
      state.isFormOpen = true;
      state.formMode = 'create';
      state.editingTemplate = null;
    },
    openEditForm: (state, action) => {
      state.isFormOpen = true;
      state.formMode = 'edit';
      state.editingTemplate = action.payload;
    },
    openDuplicateForm: (state, action) => {
      state.isFormOpen = true;
      state.formMode = 'duplicate';
      state.editingTemplate = {
        ...action.payload,
        name: `${action.payload.name} (Copy)`,
      };
    },
    closeForm: state => {
      state.isFormOpen = false;
      state.editingTemplate = null;
      state.formMode = 'create';
    },

    // Filters and search
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    setFilterType: (state, action) => {
      state.templateType = action.payload;
    },
    setShowDefaultTemplates: (state, action) => {
      state.showDefaultTemplates = action.payload;
    },

    // Import/Export
    setExporting: (state, action) => {
      state.isExporting = action.payload;
    },
    setImporting: (state, action) => {
      state.isImporting = action.payload;
    },

    // Preview
    setPreviewTemplate: (state, action) => {
      state.previewTemplate = action.payload;
    },
    setPreviewVariables: (state, action) => {
      state.previewVariables = action.payload;
    },
    updatePreviewVariable: (state, action) => {
      const { variable, value } = action.payload;
      state.previewVariables[variable] = value;
    },
    clearPreview: state => {
      state.previewTemplate = null;
      state.previewVariables = {};
    },

    // Reset state
    resetTemplateState: state => {
      return {
        ...initialState,
        templates: state.templates,
        settings: state.settings,
      };
    },
  },
});

export const {
  // Loading states
  setLoading,
  setSaving,
  setError,
  clearError,

  // Template data
  setTemplates,
  addTemplate,
  updateTemplate,
  removeTemplate,

  // Settings
  setSettings,
  updateSettings,
  setActiveTemplate,

  // UI state
  setCurrentTab,

  // Form state
  setEditingTemplate,
  setFormOpen,
  setFormMode,
  openCreateForm,
  openEditForm,
  openDuplicateForm,
  closeForm,

  // Filters and search
  setSearchTerm,
  setFilterType,
  setShowDefaultTemplates,

  // Import/Export
  setExporting,
  setImporting,

  // Preview
  setPreviewTemplate,
  setPreviewVariables,
  updatePreviewVariable,
  clearPreview,

  // Reset state
  resetTemplateState,
} = templateSlice.actions;

// Selectors
export const selectTemplates = state => state.templates.templates;
export const selectSettings = state => state.templates.settings;
export const selectIsLoading = state => state.templates.isLoading;
export const selectIsSaving = state => state.templates.isSaving;
export const selectError = state => state.templates.error;
export const selectCurrentTab = state => state.templates.currentTab;
export const selectEditingTemplate = state => state.templates.editingTemplate;
export const selectIsFormOpen = state => state.templates.isFormOpen;
export const selectFormMode = state => state.templates.formMode;
export const selectSearchTerm = state => state.templates.searchTerm;
export const selectFilterType = state => state.templates.filterType;
export const selectShowDefaultTemplates = state =>
  state.templates.showDefaultTemplates;
export const selectPreviewTemplate = state => state.templates.previewTemplate;
export const selectPreviewVariables = state => state.templates.previewVariables;

// Filtered templates selector
export const selectFilteredTemplates = state => {
  const { templates, searchTerm, filterType, showDefaultTemplates } =
    state.templates;

  return templates.filter(template => {
    // Search filter
    if (
      searchTerm &&
      !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !template.content.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Type filter
    if (filterType !== 'all' && template.templateType !== filterType) {
      return false;
    }

    // Default templates filter
    if (!showDefaultTemplates && template.isDefault) {
      return false;
    }

    return true;
  });
};

// Templates by type selector
export const selectTemplatesByType = state => issueType => {
  return state.templates.templates.filter(
    template =>
      template.templateType === issueType || template.templateType === 'All'
  );
};

// Active template selector
export const selectActiveTemplate = state => issueType => {
  const activeTemplateId = state.templates.settings.activeTemplates[issueType];
  if (activeTemplateId) {
    return state.templates.templates.find(t => t.id === activeTemplateId);
  }
  // Fallback to first template of that type
  return state.templates.templates.find(
    t => t.issueType === issueType && t.isActive
  );
};

// Available issue types selector
export const selectAvailableIssueTypes = state => {
  const types = new Set(state.templates.templates.map(t => t.templateType));
  return Array.from(types)
    .filter(type => type !== 'All')
    .sort();
};

export default templateSlice.reducer;

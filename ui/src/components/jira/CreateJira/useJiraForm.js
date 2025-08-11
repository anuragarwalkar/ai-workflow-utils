import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addCustomField,
  removeCustomField,
  setCustomFields,
  setImageFile,
  setIssueType,
  setPriority,
  setProjectType,
  setPrompt,
  updateCustomField,
} from '../../../store/slices/jiraSlice';
import { usePreviewJiraStreamingMutation } from '../../../store/api/jiraApi';

const useLocalStorage = () => {
  return useCallback(() => {
    try {
      const saved = localStorage.getItem('jira_form_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Handle localStorage errors silently
      return null;
    }
    return null;
  }, []);
};

const useFormHandlers = dispatch => {
  const handlePromptChange = event => {
    dispatch(setPrompt(event.target.value));
  };

  const handleImageChange = event => {
    const [file] = event.target.files;
    dispatch(setImageFile(file));
  };

  const handleIssueTypeChange = event => {
    dispatch(setIssueType(event.target.value));
  };

  const handlePriorityChange = event => {
    dispatch(setPriority(event.target.value));
  };

  const handleProjectTypeChange = event => {
    dispatch(setProjectType(event.target.value));
  };

  const handleAddCustomField = () => {
    dispatch(addCustomField());
  };

  const handleRemoveCustomField = index => {
    dispatch(removeCustomField(index));
  };

  const handleUpdateCustomField = (index, field, value) => {
    dispatch(updateCustomField({ index, field, value }));
  };

  return {
    handlePromptChange,
    handleImageChange,
    handleIssueTypeChange,
    handlePriorityChange,
    handleProjectTypeChange,
    handleAddCustomField,
    handleRemoveCustomField,
    handleUpdateCustomField,
  };
};

export const useJiraForm = () => {
  const dispatch = useDispatch();
  const formState = useSelector(state => state.jira.createJira);
  const [previewJiraStreaming] = usePreviewJiraStreamingMutation();
  const loadFromLocalStorage = useLocalStorage();
  const handlers = useFormHandlers(dispatch);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');
    if (promptParam) {
      dispatch(setPrompt(decodeURIComponent(promptParam)));
    }

    const savedData = loadFromLocalStorage();
    if (savedData?.projectType) {
      dispatch(setProjectType(savedData.projectType));
    }
    if (savedData?.customFieldsByType?.[formState.issueType]) {
      dispatch(setCustomFields(savedData.customFieldsByType[formState.issueType]));
    } else {
      dispatch(setCustomFields([]));
    }
  }, [dispatch, loadFromLocalStorage, formState.issueType]);

  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData?.customFieldsByType?.[formState.issueType]) {
      dispatch(setCustomFields(savedData.customFieldsByType[formState.issueType]));
    }
  }, [formState.issueType, dispatch, loadFromLocalStorage]);

  return {
    ...formState,
    isLoading: formState.isPreviewLoading || formState.isStreaming,
    previewJiraStreaming,
    dispatch,
    ...handlers,
  };
};

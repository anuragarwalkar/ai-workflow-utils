import React, { useEffect, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
  styled,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { CloudUpload, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  setPrompt,
  setImageFile,
  setIssueType,
  setPriority,
  setProjectType,
  setCustomFields,
  addCustomField,
  removeCustomField,
  updateCustomField,
} from "../../../store/slices/jiraSlice";
import { usePreviewJiraStreamingMutation } from "../../../store/api/jiraApi";
import { showNotification } from "../../../store/slices/uiSlice";
import {
  setPreviewData,
  setStreamingContent,
  setStreamingStatus,
  setStreaming,
} from "../../../store/slices/jiraSlice";
import { saveToLocalStorage } from "./utils";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const JiraForm = () => {
  const dispatch = useDispatch();
  const {
    prompt,
    imageFile,
    issueType,
    priority,
    projectType,
    customFields,
    isPreviewLoading,
    isStreaming,
  } = useSelector((state) => state.jira.createJira);

  const [previewJiraStreaming] = usePreviewJiraStreamingMutation();

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('jira_form_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return null;
  }, []);

  // Check URL params for prompt on component mount and load localStorage data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get("prompt");
    if (promptParam) {
      dispatch(setPrompt(decodeURIComponent(promptParam)));
    }

    // Load saved data from localStorage
    const savedData = loadFromLocalStorage();
    if (savedData) {
      if (savedData.projectType) {
        dispatch(setProjectType(savedData.projectType));
      }
      // Load custom fields for the current issue type
      if (savedData.customFieldsByType && savedData.customFieldsByType[issueType]) {
        dispatch(setCustomFields(savedData.customFieldsByType[issueType]));
      }else{
        dispatch(setCustomFields([]));
      }
    }
  }, [dispatch, loadFromLocalStorage, issueType]);

  // Handle issue type changes - load custom fields for the selected issue type
  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData && savedData.customFieldsByType && savedData.customFieldsByType[issueType]) {
      dispatch(setCustomFields(savedData.customFieldsByType[issueType]));
    }
    // Don't clear custom fields if no saved data - let user keep working with current fields
  }, [issueType, dispatch, loadFromLocalStorage]);

  const handlePromptChange = (event) => {
    dispatch(setPrompt(event.target.value));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    dispatch(setImageFile(file));
  };

  const handleIssueTypeChange = (event) => {
    dispatch(setIssueType(event.target.value));
  };

  const handlePriorityChange = (event) => {
    dispatch(setPriority(event.target.value));
  };

  const handleProjectTypeChange = (event) => {
    dispatch(setProjectType(event.target.value));
  };

  const handleAddCustomField = () => {
    dispatch(addCustomField());
  };

  const handleRemoveCustomField = (index) => {
    dispatch(removeCustomField(index));
  };

  const handleUpdateCustomField = (index, field, value) => {
    dispatch(updateCustomField({ index, field, value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    // save details to storage
     saveToLocalStorage(projectType, issueType, customFields)

    // Update URL with prompt
    const url = new URL(window.location.href);
    url.searchParams.set("prompt", encodeURIComponent(prompt));
    window.history.replaceState({}, "", url);

    // Reset streaming content
    dispatch(setStreamingContent(""));
    dispatch(setStreamingStatus(""));
    dispatch(setStreaming(true));

    const handleStreamingRequest = async (images) => {
      try {
        const result = await previewJiraStreaming({
          prompt,
          images,
          issueType,
          onChunk: (chunk, fullContent) => {
            dispatch(setStreamingContent(fullContent));
          },
          onStatus: (status, provider) => {
            dispatch(setStreamingStatus(`${status} (${provider})`));
          },
        }).unwrap();

        dispatch(setStreaming(false));
        // The streaming result has the data directly, not nested under .data
        dispatch(setPreviewData(result));
        dispatch(
          showNotification({
            message: "Preview generated successfully!",
            severity: "success",
          })
        );
      } catch (error) {
        dispatch(setStreaming(false));
        console.error("Preview error:", error);
        dispatch(
          showNotification({
            message: `Error: ${error.error || error.message}`,
            severity: "error",
          })
        );
      }
    };

    if (imageFile) {
      // Convert file to base64 if image is provided
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result.split(",")[1];
        await handleStreamingRequest([base64Image]);
      };

      reader.onerror = () => {
        dispatch(setStreaming(false));
        dispatch(
          showNotification({
            message: "Failed to read the file. Please try again.",
            severity: "error",
          })
        );
      };

      reader.readAsDataURL(imageFile);
    } else {
      // Generate preview without image
      await handleStreamingRequest([]);
    }
  };

  const isLoading = isPreviewLoading || isStreaming;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Stack spacing={3}>
        <Typography variant="h2" component="h2">
          Create Jira Issue
        </Typography>

        <TextField
          label="Prompt"
          multiline
          rows={4}
          value={prompt}
          onChange={handlePromptChange}
          required
          fullWidth
          variant="outlined"
        />

        <FormControl fullWidth>
          <InputLabel id="issue-type-label">Issue Type</InputLabel>
          <Select
            labelId="issue-type-label"
            id="issue-type-select"
            value={issueType}
            label="Issue Type"
            onChange={handleIssueTypeChange}
          >
            <MenuItem value="Task">Task</MenuItem>
            <MenuItem value="Bug">Bug</MenuItem>
            <MenuItem value="Story">Story</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            id="priority-select"
            value={priority}
            label="Priority"
            onChange={handlePriorityChange}
          >
            <MenuItem value="Critical">Critical</MenuItem>
            <MenuItem value="High">High</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Project Key"
          value={projectType}
          onChange={handleProjectTypeChange}
          required
          fullWidth
          variant="outlined"
          placeholder="e.g., AIWUT, PROJ, etc."
        />

        <Box>
          <Typography variant="h6" gutterBottom>
            Custom Fields ({issueType})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These custom fields are specific to {issueType} issues and will be saved separately for each issue type.
            <br />
            <strong>Value formats:</strong> Simple text: "11222" | Object: {`{"id": "21304"}`} | Array: {`["value1", "value2"]`}
          </Typography>
          {customFields.map((field, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', marginBottom: '16px' }}>
              <TextField 
                label="Field Key" 
                value={field.key} 
                style={{marginBottom: 0}}
                onChange={(e) => handleUpdateCustomField(index, 'key', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                placeholder="e.g., customfield_1234"
              />
              <TextField 
                label="Field Value" 
                style={{marginBottom: 0}}
                value={field.value} 
                onChange={(e) => handleUpdateCustomField(index, 'value', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                placeholder='e.g., 11222 or {"id": "007"}'
              />
              <IconButton 
                onClick={() => handleRemoveCustomField(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
          <Button 
            onClick={handleAddCustomField} 
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
          >
            Add Custom Field
          </Button>
        </Box>

        <Box>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUpload />}
            sx={{ mb: 1 }}
          >
            Upload Image
            <VisuallyHiddenInput
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
          {imageFile && (
            <Typography variant="body2" color="text.secondary" component="div">
              Selected: {imageFile.name}
            </Typography>
          )}
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          sx={{ position: "relative" }}
        >
          {isLoading && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: "-12px",
                marginLeft: "-12px",
              }}
            />
          )}
          {isLoading ? "Generating Preview..." : "Preview"}
        </Button>
      </Stack>
    </Box>
  );
};

export default JiraForm;

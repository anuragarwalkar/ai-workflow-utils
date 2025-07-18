import React, { useEffect } from "react";
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
} from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import {
  setPrompt,
  setImageFile,
  setIssueType,
  setPriority,
} from "../../../store/slices/jiraSlice";
import { usePreviewJiraStreamingMutation } from "../../../store/api/jiraApi";
import { showNotification } from "../../../store/slices/uiSlice";
import {
  setPreviewData,
  setStreamingContent,
  setStreamingStatus,
  setStreaming,
} from "../../../store/slices/jiraSlice";

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
    isPreviewLoading,
    isStreaming,
  } = useSelector((state) => state.jira.createJira);

  const [previewJiraStreaming] = usePreviewJiraStreamingMutation();

  // Check URL params for prompt on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get("prompt");
    if (promptParam) {
      dispatch(setPrompt(decodeURIComponent(promptParam)));
    }
  }, [dispatch]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

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

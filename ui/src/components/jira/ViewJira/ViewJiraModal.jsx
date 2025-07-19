import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  CircularProgress,
  Box,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { closeViewJiraModal } from '../../../store/slices/uiSlice';
import { setJiraId, resetViewJira } from '../../../store/slices/jiraSlice';
import { useLazyFetchJiraQuery } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';
import JiraDetails from './JiraDetails';

const ViewJiraModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state) => state.ui.modals.viewJira);
  const { jiraId, isFetching } = useSelector(
    (state) => state.jira.viewJira
  );

  const [fetchJira, { isLoading: isFetchLoading }] = useLazyFetchJiraQuery();

  const handleClose = () => {
    dispatch(closeViewJiraModal());
    dispatch(resetViewJira());
  };

  const handleJiraIdChange = (event) => {
    dispatch(setJiraId(event.target.value));
  };

  const handleFetchJira = async () => {
    if (!jiraId.trim()) {
      dispatch(showNotification({
        message: 'Please enter a Jira ID.',
        severity: 'error'
      }));
      return;
    }

    // Validate Jira ID format
    const jiraIdPattern = /^[A-Z]{2,}-\d+$/i;
    if (!jiraIdPattern.test(jiraId.trim())) {
      dispatch(showNotification({
        message: 'Please enter a valid Jira ID format (e.g., PROJ-456).',
        severity: 'error'
      }));
      return;
    }

    try {
      await fetchJira(jiraId.trim()).unwrap();
      // The result will be automatically stored in the cache and available via selector
      dispatch(showNotification({
        message: 'Jira issue fetched successfully!',
        severity: 'success'
      }));
    } catch (error) {
      console.error('Fetch Jira error:', error);
      
      // Handle different error types with user-friendly messages
      let errorMessage = 'Error fetching Jira issue';
      if (error.status === 404) {
        errorMessage = `Jira issue "${jiraId.trim()}" not found. Please check the ID and try again.`;
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please check your Jira credentials.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You may not have permission to view this Jira issue.';
      } else if (error.data) {
        errorMessage = `Error: ${error.data.message || error.data}`;
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      dispatch(showNotification({
        message: errorMessage,
        severity: 'error'
      }));
    }
  };

  const isLoading = isFetching || isFetchLoading;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        View Jira Issue
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Enter Jira ID"
            value={jiraId}
            onChange={handleJiraIdChange}
            fullWidth
            variant="outlined"
            placeholder="e.g. PROJ-456"
            helperText="Enter a valid Jira ID format. The issue will be fetched automatically."
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="contained"
              onClick={handleFetchJira}
              disabled={isLoading}
              sx={{ position: 'relative', minWidth: 120 }}
            >
              {isLoading && (
                <CircularProgress
                  size={20}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-10px',
                    marginLeft: '-10px',
                  }}
                />
              )}
              {isLoading ? 'Fetching...' : 'Fetch Jira'}
            </Button>
          </Box>

          <JiraDetails />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewJiraModal;

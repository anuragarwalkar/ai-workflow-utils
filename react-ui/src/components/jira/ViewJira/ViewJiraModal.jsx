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

    try {
      await fetchJira(jiraId.trim()).unwrap();
      // The result will be automatically stored in the cache and available via selector
      dispatch(showNotification({
        message: 'Jira issue fetched successfully!',
        severity: 'success'
      }));
    } catch (error) {
      console.error('Fetch Jira error:', error);
      dispatch(showNotification({
        message: `Error fetching Jira issue: ${error.data || error.message}`,
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

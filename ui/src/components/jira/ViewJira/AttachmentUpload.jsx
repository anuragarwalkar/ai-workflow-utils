import React from 'react';
import {
  Box,
  Button,
  Typography,
  Stack,
  CircularProgress,
  styled,
} from '@mui/material';
import { AttachFile } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { setAttachmentFile } from '../../../store/slices/jiraSlice';
import { useUploadAttachmentMutation } from '../../../store/api/jiraApi';
import { showNotification } from '../../../store/slices/uiSlice';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const AttachmentUpload = () => {
  const dispatch = useDispatch();
  const { jiraId, attachmentFile, isUploading } = useSelector(
    (state) => state.jira.viewJira
  );

  const [uploadAttachment, { isLoading: isUploadLoading }] = useUploadAttachmentMutation();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    dispatch(setAttachmentFile(file));
  };

  const handleUpload = async () => {
    if (!attachmentFile || !jiraId) {
      dispatch(showNotification({
        message: 'Please select a file and ensure a Jira ID is entered.',
        severity: 'error'
      }));
      return;
    }

    const formData = new FormData();
    formData.append('file', attachmentFile);
    formData.append('issueKey', jiraId);
    formData.append('fileName', attachmentFile.name);

    try {
      const result = await uploadAttachment({ formData }).unwrap();
      dispatch(showNotification({
        message: `Attachment added successfully: ${result.fileName || attachmentFile.name}`,
        severity: 'success'
      }));
      // Clear the selected file after successful upload
      dispatch(setAttachmentFile(null));
    } catch (error) {
      console.error('Upload error:', error);
      dispatch(showNotification({
        message: `Error adding attachment: ${error.data || error.message}`,
        severity: 'error'
      }));
    }
  };

  const isLoading = isUploading || isUploadLoading;

  return (
    <Box>
      <Typography variant="h3" component="h3" sx={{ mb: 2 }}>
        Add Attachment:
      </Typography>
      
      <Stack spacing={2}>
        <Box>
          <Button
            component="label"
            variant="outlined"
            startIcon={<AttachFile />}
            sx={{ mb: 1 }}
          >
            Select File
            <VisuallyHiddenInput
              type="file"
              onChange={handleFileChange}
            />
          </Button>
          {attachmentFile && (
            <Typography variant="body2" color="text.secondary">
              File selected: {attachmentFile.name}
            </Typography>
          )}
        </Box>

        <Box>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!attachmentFile || isLoading}
            sx={{ position: 'relative', minWidth: 140 }}
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
            {isLoading ? 'Uploading...' : 'Add Attachment'}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default AttachmentUpload;

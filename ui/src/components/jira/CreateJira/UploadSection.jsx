import { Box, Button, IconButton, Stack, Typography, styled } from '@mui/material';
import { CloudUpload, Delete as DeleteIcon } from '@mui/icons-material';

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

const UploadSection = ({ imageFile, onImageChange, onRemoveImage }) => (
  <Box>
    <Stack alignItems='center' direction='row' mb={2} spacing={2}>
      <Button component='label' startIcon={<CloudUpload />} variant='outlined'>
        Upload Image
        <VisuallyHiddenInput accept='image/*' type='file' onChange={onImageChange} />
      </Button>
      {Boolean(imageFile) && (
        <Stack alignItems='center' direction='row' spacing={1}>
          <Typography variant='body2'>{imageFile.name}</Typography>
          <IconButton aria-label='Remove image' size='small' onClick={onRemoveImage}>
            <DeleteIcon fontSize='small' />
          </IconButton>
        </Stack>
      )}
    </Stack>
  </Box>
);

export default UploadSection;

/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Fullscreen as FullscreenIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

/**
 * Format bytes to readable file size
 * @param {number} bytes
 * @returns {string}
 */
const formatFileSize = bytes => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Screenshot attachment component for Create PR
 * Supports file picking, drag-and-drop, clipboard pasting, and lightbox modal view.
 */
const ScreenshotAttachment = ({
  attachedImages = [],
  onAddImages,
  onRemoveImage,
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  /**
   * Handle file list addition with validation
   */
  const processFiles = useCallback(
    files => {
      if (!files || files.length === 0 || disabled) return;

      const validImageFiles = Array.from(files).filter(file =>
        file.type.startsWith('image/')
      );

      if (validImageFiles.length > 0) {
        onAddImages(validImageFiles);
      }
    },
    [disabled, onAddImages]
  );

  /**
   * File input change handler
   */
  const handleFileInputChange = event => {
    processFiles(event.target.files);
    if (event.target) {
      event.target.value = '';
    }
  };

  /**
   * Drag events
   */
  const handleDragEnter = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  };

  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving drop zone container
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer?.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  /**
   * Clipboard paste handler for screenshots
   */
  useEffect(() => {
    const handlePaste = event => {
      if (disabled) return;

      const items = event.clipboardData?.items;
      if (!items) return;

      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            // Give pasted screenshot a meaningful default name with timestamp
            const extension = file.type.split('/')[1] || 'png';
            const renamedFile = new File(
              [file],
              `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`,
              { type: file.type }
            );
            imageFiles.push(renamedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        processFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [disabled, processFiles]);

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      {/* Hidden file input */}
      <input
        multiple
        accept='image/png,image/jpeg,image/jpg,image/webp,image/gif'
        disabled={disabled}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type='file'
        onChange={handleFileInputChange}
      />

      {/* Header and counter */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Stack alignItems='center' direction='row' spacing={1}>
          <ImageIcon color='primary' fontSize='small' />
          <Typography sx={{ fontWeight: 600 }} variant='subtitle2'>
            Attach Screenshots (Optional)
          </Typography>
          {attachedImages.length > 0 && (
            <Chip
              color='primary'
              label={`${attachedImages.length} attached`}
              size='small'
              sx={{ height: 20, fontSize: '0.75rem' }}
              variant='outlined'
            />
          )}
        </Stack>
        <Typography color='text.secondary' sx={{ fontSize: '0.75rem' }} variant='caption'>
          Supports Paste (Cmd+V / Ctrl+V)
        </Typography>
      </Box>

      {/* Drag & Drop Area */}
      <Box
        ref={dropZoneRef}
        sx={{
          border: '2px dashed',
          borderColor: isDragging
            ? theme.palette.primary.main
            : alpha(theme.palette.divider, 0.7),
          borderRadius: 2,
          p: 2,
          textAlign: 'center',
          backgroundColor: isDragging
            ? alpha(theme.palette.primary.main, 0.08)
            : alpha(theme.palette.background.default, 0.4),
          transition: 'all 0.2s ease-in-out',
          cursor: disabled ? 'not-allowed' : 'pointer',
          '&:hover': {
            borderColor: disabled ? alpha(theme.palette.divider, 0.7) : theme.palette.primary.main,
            backgroundColor: disabled
              ? alpha(theme.palette.background.default, 0.4)
              : alpha(theme.palette.primary.main, 0.04),
          },
        }}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Stack alignItems='center' spacing={1}>
          <CloudUploadIcon
            sx={{
              fontSize: 32,
              color: isDragging ? theme.palette.primary.main : theme.palette.text.secondary,
              transition: 'color 0.2s ease',
            }}
          />
          <Typography color='text.secondary' variant='body2'>
            <Box component='span' sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
              Click to browse
            </Box>{' '}
            or drag & drop screenshots here, or paste from clipboard
          </Typography>
          <Typography color='text.disabled' sx={{ fontSize: '0.725rem' }} variant='caption'>
            PNG, JPG, WEBP, GIF (AI Vision will analyze screenshots to enrich the PR description)
          </Typography>
        </Stack>
      </Box>

      {/* Attached Images Grid */}
      {attachedImages.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Stack direction='row' spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            {attachedImages.map(image => (
              <Box
                key={image.id}
                sx={{
                  position: 'relative',
                  width: 120,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: theme.shadows[1],
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[3],
                    '& .image-overlay': {
                      opacity: 1,
                    },
                  },
                }}
              >
                {/* Thumbnail Image */}
                <Box
                  sx={{
                    width: '100%',
                    height: 80,
                    backgroundColor: alpha(theme.palette.common.black, 0.05),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedPreviewImage(image)}
                >
                  <img
                    alt={image.name}
                    src={image.url}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>

                {/* Hover overlay for quick preview action */}
                <Box
                  className='image-overlay'
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedPreviewImage(image)}
                >
                  <FullscreenIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>

                {/* Remove button */}
                <Tooltip title='Remove screenshot'>
                  <IconButton
                    disabled={disabled}
                    size='small'
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      backgroundColor: alpha(theme.palette.error.main, 0.85),
                      color: 'white',
                      p: 0.5,
                      '&:hover': {
                        backgroundColor: theme.palette.error.main,
                      },
                    }}
                    onClick={e => {
                      e.stopPropagation();
                      onRemoveImage(image.id);
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>

                {/* Image info metadata */}
                <Box sx={{ p: 0.75 }}>
                  <Typography
                    noWrap
                    sx={{ fontSize: '0.725rem', fontWeight: 500 }}
                    title={image.name}
                    variant='body2'
                  >
                    {image.name}
                  </Typography>
                  <Typography color='text.secondary' sx={{ fontSize: '0.675rem' }} variant='caption'>
                    {formatFileSize(image.size || image.file?.size)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Lightbox Preview Modal */}
      <Dialog
        fullWidth
        maxWidth='md'
        open={Boolean(selectedPreviewImage)}
        onClose={() => setSelectedPreviewImage(null)}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography noWrap sx={{ maxWidth: '80%', fontWeight: 600 }} variant='h6'>
            {selectedPreviewImage?.name}
          </Typography>
          <IconButton
            aria-label='close'
            sx={{ color: theme.palette.grey[500] }}
            onClick={() => setSelectedPreviewImage(null)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, textAlign: 'center', backgroundColor: alpha(theme.palette.common.black, 0.05) }}>
          {Boolean(selectedPreviewImage) && (
            <Box
              alt={selectedPreviewImage.name}
              component='img'
              src={selectedPreviewImage.url}
              sx={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                borderRadius: 1,
                boxShadow: theme.shadows[2],
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ScreenshotAttachment;

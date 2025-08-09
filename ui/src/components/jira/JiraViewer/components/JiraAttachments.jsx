import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Archive,
  Attachment,
  Close,
  Description,
  Download,
  Image,
  OpenInNew,
  PictureAsPdf,
  VideoFile,
  Visibility,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';

const MotionPaper = motion(Paper);
const MotionCard = motion(Card);

const JiraAttachments = ({ jiraData }) => {
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const attachments = jiraData?.fields?.attachment || [];

  const getFileIcon = (filename, mimeType) => {
    const extension = filename?.split('.').pop()?.toLowerCase();

    if (mimeType?.startsWith('image/')) {
      return <Image color='success' />;
    } else if (mimeType?.includes('pdf')) {
      return <PictureAsPdf color='error' />;
    } else if (mimeType?.startsWith('video/')) {
      return <VideoFile color='info' />;
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive color='warning' />;
    } else {
      return <Description color='action' />;
    }
  };

  const formatFileSize = bytes => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const isImageFile = mimeType => {
    return mimeType?.startsWith('image/');
  };

  const isVideoFile = mimeType => {
    return mimeType?.startsWith('video/');
  };

  const handlePreview = attachment => {
    setSelectedAttachment(attachment);
    setPreviewOpen(true);
  };

  const handleDownload = attachment => {
    // In a real implementation, you'd download from the Jira API
    window.open(attachment.content, '_blank');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (!attachments || attachments.length === 0) {
    return (
      <MotionPaper
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        initial={{ opacity: 0, y: 20 }}
        sx={{
          p: 4,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          textAlign: 'center',
        }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Attachment sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography color='text.secondary' variant='h6'>
          No Attachments
        </Typography>
        <Typography color='text.secondary' variant='body2'>
          This issue doesn't have any attachments yet.
        </Typography>
      </MotionPaper>
    );
  }

  return (
    <>
      <MotionPaper
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        initial={{ opacity: 0, y: 20 }}
        sx={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Header */}
        <Box
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            px: 3,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Attachment color='primary' />
          <Typography sx={{ fontWeight: 600 }} variant='h6'>
            Attachments ({attachments.length})
          </Typography>
        </Box>

        {/* Attachments Grid */}
        <Box sx={{ p: 3 }}>
          <motion.div
            animate='visible'
            initial='hidden'
            variants={containerVariants}
          >
            <Grid container spacing={2}>
              {attachments.map((attachment, index) => (
                <Grid item key={attachment.id || index} md={4}
sm={6} xs={12}>
                  <MotionCard
                    sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                      },
                    }}
                    variants={itemVariants}
                  >
                    {/* Preview Area */}
                    {isImageFile(attachment.mimeType) &&
                    attachment.thumbnail ? (
                      <CardMedia
                        alt={attachment.filename}
                        component='img'
                        height='120'
                        image={attachment.thumbnail}
                        sx={{
                          objectFit: 'cover',
                          cursor: 'pointer',
                        }}
                        onClick={() => handlePreview(attachment)}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 120,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background:
                            'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          cursor: 'pointer',
                        }}
                        onClick={() => handlePreview(attachment)}
                      >
                        <Box sx={{ fontSize: 48 }}>
                          {getFileIcon(
                            attachment.filename,
                            attachment.mimeType
                          )}
                        </Box>
                      </Box>
                    )}

                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={attachment.filename}
                        variant='subtitle2'
                      >
                        {attachment.filename}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={formatFileSize(attachment.size)}
                          size='small'
                          sx={{ fontSize: '0.75rem' }}
                          variant='outlined'
                        />
                        <Typography color='text.secondary' variant='caption'>
                          {new Date(attachment.created).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title='Preview'>
                          <IconButton
                            size='small'
                            sx={{
                              color: 'primary.main',
                              '&:hover': {
                                background: 'rgba(102, 126, 234, 0.1)',
                              },
                            }}
                            onClick={() => handlePreview(attachment)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Download'>
                          <IconButton
                            size='small'
                            sx={{
                              color: 'success.main',
                              '&:hover': {
                                background: 'rgba(76, 175, 80, 0.1)',
                              },
                            }}
                            onClick={() => handleDownload(attachment)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title='Open in new tab'>
                          <IconButton
                            size='small'
                            sx={{
                              color: 'info.main',
                              '&:hover': {
                                background: 'rgba(33, 150, 243, 0.1)',
                              },
                            }}
                            onClick={() =>
                              window.open(attachment.content, '_blank')
                            }
                          >
                            <OpenInNew />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        </Box>
      </MotionPaper>

      {/* Preview Dialog */}
      <Dialog
        fullWidth
        maxWidth='md'
        open={previewOpen}
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
        onClose={() => setPreviewOpen(false)}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAttachment
              ? getFileIcon(
                  selectedAttachment.filename,
                  selectedAttachment.mimeType
                )
              : null}
            <Typography variant='h6'>{selectedAttachment?.filename}</Typography>
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedAttachment ? (
            <Box sx={{ textAlign: 'center' }}>
              {isImageFile(selectedAttachment.mimeType) ? (
                <img
                  src={selectedAttachment.content}
                  alt={selectedAttachment.filename}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              ) : isVideoFile(selectedAttachment.mimeType) ? (
                <video
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                  }}
                >
                  <source
                    src={selectedAttachment.content}
                    type={selectedAttachment.mimeType}
                  />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Box sx={{ fontSize: 64, mb: 2 }}>
                    {getFileIcon(
                      selectedAttachment.filename,
                      selectedAttachment.mimeType
                    )}
                  </Box>
                  <Typography variant='h6' sx={{ mb: 2 }}>
                    {selectedAttachment.filename}
                  </Typography>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 3 }}
                  >
                    {formatFileSize(selectedAttachment.size)} •{' '}
                    {selectedAttachment.mimeType}
                  </Typography>
                  <Button
                    variant='contained'
                    startIcon={<Download />}
                    onClick={() => handleDownload(selectedAttachment)}
                    sx={{
                      background:
                        'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    }}
                  >
                    Download File
                  </Button>
                </Box>
              )}
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            startIcon={<Download />}
            variant='outlined'
            onClick={() => handleDownload(selectedAttachment)}
          >
            Download
          </Button>
          <Button
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            }}
            variant='contained'
            onClick={() => setPreviewOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JiraAttachments;

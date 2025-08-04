import { useState } from 'react';
import { useAppTheme } from '../../../../theme/useAppTheme';
import {
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Description,
  Edit,
  AutoAwesome,
  Code,
  Visibility,
  Save,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';
import { useEnhanceDescriptionMutation } from '../../../../store/api/jiraApi';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../../../store/slices/uiSlice';

const MotionPaper = motion(Paper);
const MotionBox = motion(Box);

const JiraDescription = ({ jiraData, activeTab, setActiveTab }) => {
  const dispatch = useDispatch();
  const { isDark } = useAppTheme();
  const [enhanceDescription] = useEnhanceDescriptionMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');
  const [showEnhanceDialog, setShowEnhanceDialog] = useState(false);
  const [enhancedText, setEnhancedText] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const description =
    jiraData?.fields?.description || 'No description provided.';
  const issueType = jiraData?.fields?.issuetype?.name || 'Task';

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEdit = () => {
    setEditedDescription(description);
    setIsEditing(true);
  };

  const handleSave = () => {
    // In a real implementation, you'd save to the server here
    setIsEditing(false);
    dispatch(
      showNotification({
        message: 'Description saved successfully',
        severity: 'success',
      })
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedDescription('');
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const result = await enhanceDescription({
        description,
        issueType,
      }).unwrap();

      setEnhancedText(result.data.enhanced);
      setShowEnhanceDialog(true);
    } catch {
      dispatch(
        showNotification({
          message: 'Failed to enhance description',
          severity: 'error',
        })
      );
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleAcceptEnhancement = () => {
    setEditedDescription(enhancedText);
    setIsEditing(true);
    setShowEnhanceDialog(false);
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag='div'
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <Typography variant='h4' sx={{ mt: 3, mb: 2, fontWeight: 600 }}>
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography variant='h5' sx={{ mt: 2, mb: 1.5, fontWeight: 600 }}>
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography variant='h6' sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
        {children}
      </Typography>
    ),
    p: ({ children }) => (
      <Typography variant='body1' sx={{ mb: 2, lineHeight: 1.7 }}>
        {children}
      </Typography>
    ),
    blockquote: ({ children }) => (
      <Box
        sx={{
          borderLeft: '4px solid #667eea',
          pl: 2,
          py: 1,
          my: 2,
          backgroundColor: 'rgba(102, 126, 234, 0.05)',
          borderRadius: '0 4px 4px 0',
        }}
      >
        {children}
      </Box>
    ),
    ul: ({ children }) => (
      <Box component='ul' sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box component='ol' sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography component='li' variant='body1' sx={{ mb: 0.5 }}>
        {children}
      </Typography>
    ),
  };

  const tabContent = {
    description: (
      <MotionBox
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isEditing ? (
          <Box sx={{ position: 'relative', height: 400 }}>
            <Editor
              height='400px'
              defaultLanguage='markdown'
              value={editedDescription}
              onChange={setEditedDescription}
              theme='vs-dark'
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: false,
                fontSize: 14,
                padding: { top: 16, bottom: 16 },
              }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant='contained'
                startIcon={<Save />}
                onClick={handleSave}
                sx={{
                  background:
                    'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                }}
              >
                Save
              </Button>
              <Button
                variant='outlined'
                startIcon={<Close />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ minHeight: 200 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {description}
            </ReactMarkdown>
          </Box>
        )}
      </MotionBox>
    ),
  };

  return (
    <>
      <MotionPaper
        elevation={0}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        sx={{
          background: isDark
            ? 'rgba(45, 55, 72, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: isDark
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header with Tabs and Actions */}
        <Box
          sx={{
            borderBottom: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 600,
                color: isDark
                  ? 'rgba(255, 255, 255, 0.7)'
                  : 'rgba(0, 0, 0, 0.7)',
                '&.Mui-selected': {
                  color: isDark ? '#ffffff' : '#1976d2',
                },
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<Description />}
              label='Description'
              value='description'
              iconPosition='start'
            />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title='Enhance with AI'>
              <IconButton
                onClick={handleEnhance}
                disabled={isEnhancing}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)',
                  },
                }}
              >
                {isEnhancing ? <CircularProgress size={20} /> : <AutoAwesome />}
              </IconButton>
            </Tooltip>

            <Tooltip title={isEditing ? 'Preview' : 'Edit'}>
              <IconButton
                onClick={isEditing ? () => setIsEditing(false) : handleEdit}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    background: 'rgba(102, 126, 234, 0.1)',
                  },
                }}
              >
                {isEditing ? <Visibility /> : <Edit />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          <AnimatePresence mode='wait'>{tabContent[activeTab]}</AnimatePresence>
        </Box>
      </MotionPaper>

      {/* Enhancement Dialog */}
      <Dialog
        open={showEnhanceDialog}
        onClose={() => setShowEnhanceDialog(false)}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            background: isDark
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <AutoAwesome />
          AI Enhanced Description
        </DialogTitle>

        <DialogContent sx={{ mt: 2 }}>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
            Original:
          </Typography>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.05)',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Typography variant='body2' color='text.secondary'>
              {description.substring(0, 200)}...
            </Typography>
          </Paper>

          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 2 }}>
            Enhanced:
          </Typography>
          <Paper
            sx={{
              p: 2,
              backgroundColor: isDark
                ? 'rgba(102, 126, 234, 0.1)'
                : 'rgba(102, 126, 234, 0.05)',
              border: isDark
                ? '1px solid rgba(102, 126, 234, 0.5)'
                : '1px solid rgba(102, 126, 234, 0.3)',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {enhancedText}
            </ReactMarkdown>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setShowEnhanceDialog(false)}
            variant='outlined'
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptEnhancement}
            variant='contained'
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            }}
          >
            Use Enhanced Version
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JiraDescription;

import { useState } from 'react';
import { useAppTheme } from '../../../../theme/useAppTheme';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { AutoAwesome, Close, Code, Description, Edit, Save, Visibility } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
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

  const description = jiraData?.fields?.description || 'No description provided.';
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
          customStyle={{
            margin: '1rem 0',
            borderRadius: '8px',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
          language={match[1]}
          PreTag='div'
          style={vscDarkPlus}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Monaco, Consolas, monospace',
            color: '#4ecdc4',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children }) => (
      <Typography
        sx={{
          mt: 3,
          mb: 2,
          fontWeight: 700,
          color: isDark ? 'white' : 'black',
        }}
        variant='h4'
      >
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography
        sx={{
          mt: 2,
          mb: 1.5,
          fontWeight: 600,
          color: isDark ? 'white' : 'black',
        }}
        variant='h5'
      >
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography
        sx={{
          mt: 2,
          mb: 1,
          fontWeight: 600,
          color: isDark ? 'white' : 'black',
        }}
        variant='h6'
      >
        {children}
      </Typography>
    ),
    p: ({ children }) => (
      <Typography
        sx={{
          mb: 2,
          lineHeight: 1.7,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
        variant='body1'
      >
        {children}
      </Typography>
    ),
    strong: ({ children }) => (
      <Box component='strong' sx={{ color: isDark ? 'white' : 'black', fontWeight: 700 }}>
        {children}
      </Box>
    ),
    em: ({ children }) => (
      <Box component='em' sx={{ color: '#4ecdc4', fontStyle: 'italic' }}>
        {children}
      </Box>
    ),
    blockquote: ({ children }) => (
      <Box
        sx={{
          borderLeft: '4px solid #667eea',
          pl: 2,
          py: 1,
          my: 2,
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderRadius: '0 8px 8px 0',
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {children}
      </Box>
    ),
    ul: ({ children }) => (
      <Box
        component='ul'
        sx={{
          pl: 3,
          mb: 2,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {children}
      </Box>
    ),
    ol: ({ children }) => (
      <Box
        component='ol'
        sx={{
          pl: 3,
          mb: 2,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {children}
      </Box>
    ),
    li: ({ children }) => (
      <Typography
        component='li'
        sx={{
          mb: 0.5,
          color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        }}
        variant='body1'
      >
        {children}
      </Typography>
    ),
  };

  const tabContent = {
    description: (
      <MotionBox
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 10 }}
        sx={{
          p: 3, // Add padding around content
          minHeight: '400px',
          maxHeight: '70vh',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(255, 255, 255, 0.5)',
            },
          },
        }}
        transition={{ duration: 0.3 }}
      >
        {isEditing ? (
          <Box sx={{ position: 'relative', height: 400 }}>
            <Editor
              defaultLanguage='markdown'
              height='400px'
              options={{
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: false,
                fontSize: 14,
                padding: { top: 16, bottom: 16 },
              }}
              theme='vs-dark'
              value={editedDescription}
              onChange={setEditedDescription}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                startIcon={<Save />}
                sx={{
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                }}
                variant='contained'
                onClick={handleSave}
              >
                Save
              </Button>
              <Button startIcon={<Close />} variant='outlined' onClick={handleCancel}>
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ minHeight: 200 }}>
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
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
        animate={{ opacity: 1, y: 0 }}
        elevation={0}
        initial={{ opacity: 0, y: 20 }}
        sx={{
          background: isDark ? 'rgba(25, 25, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: isDark ? '0 20px 60px rgba(0, 0, 0, 0.3)' : '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}
        transition={{ duration: 0.5, delay: 0.1 }}
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
            background: isDark ? 'rgba(15, 15, 35, 0.8)' : 'rgba(240, 240, 240, 0.8)',
          }}
        >
          <Tabs
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                textTransform: 'none',
                fontWeight: 600,
                color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&.Mui-selected': {
                  color: isDark ? 'white' : 'black',
                },
              },
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
            value={activeTab}
            onChange={handleTabChange}
          >
            <Tab
              icon={<Description sx={{ color: '#4ecdc4' }} />}
              iconPosition='start'
              label='Description'
              value='description'
            />
          </Tabs>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title='Enhance with AI'>
              <IconButton
                disabled={isEnhancing}
                sx={{
                  color: 'white',
                  background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                    transform: 'scale(1.1)',
                  },
                  '&:disabled': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={handleEnhance}
              >
                {isEnhancing ? (
                  <CircularProgress size={20} sx={{ color: 'white' }} />
                ) : (
                  <AutoAwesome />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title={isEditing ? 'Preview' : 'Edit'}>
              <IconButton
                sx={{
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.2)',
                    transform: 'scale(1.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
                onClick={isEditing ? () => setIsEditing(false) : handleEdit}
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
        fullWidth
        maxWidth='md'
        open={showEnhanceDialog}
        PaperProps={{
          sx: {
            background: 'rgba(25, 25, 55, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
        onClose={() => setShowEnhanceDialog(false)}
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
          <Typography sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }} variant='subtitle2'>
            Original:
          </Typography>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }} variant='body2'>
              {description.substring(0, 200)}...
            </Typography>
          </Paper>

          <Typography sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }} variant='subtitle2'>
            Enhanced:
          </Typography>
          <Paper
            sx={{
              p: 2,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.5)',
              borderRadius: 2,
            }}
          >
            <ReactMarkdown
              components={{
                ...markdownComponents,
                p: ({ children }) => (
                  <Typography
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: 1.7,
                      mb: 1.5,
                    }}
                    variant='body1'
                  >
                    {children}
                  </Typography>
                ),
                h1: ({ children }) => (
                  <Typography sx={{ color: 'white', fontWeight: 700, my: 2 }} variant='h4'>
                    {children}
                  </Typography>
                ),
                h2: ({ children }) => (
                  <Typography sx={{ color: 'white', fontWeight: 600, my: 2 }} variant='h5'>
                    {children}
                  </Typography>
                ),
                h3: ({ children }) => (
                  <Typography sx={{ color: 'white', fontWeight: 600, my: 1.5 }} variant='h6'>
                    {children}
                  </Typography>
                ),
                strong: ({ children }) => (
                  <Box component='strong' sx={{ color: 'white', fontWeight: 700 }}>
                    {children}
                  </Box>
                ),
                em: ({ children }) => (
                  <Box component='em' sx={{ color: '#4ecdc4', fontStyle: 'italic' }}>
                    {children}
                  </Box>
                ),
              }}
              remarkPlugins={[remarkGfm]}
            >
              {enhancedText}
            </ReactMarkdown>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            sx={{
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                background: 'rgba(255, 255, 255, 0.1)',
              },
            }}
            variant='outlined'
            onClick={() => setShowEnhanceDialog(false)}
          >
            Cancel
          </Button>
          <Button
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
              },
            }}
            variant='contained'
            onClick={handleAcceptEnhancement}
          >
            Use Enhanced Version
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default JiraDescription;

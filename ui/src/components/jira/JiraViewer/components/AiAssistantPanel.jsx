import React, { useState } from 'react';
import {
  Drawer,
  Typography,
  Box,
  IconButton,
  Divider,
  Button,
  TextField,
  Paper,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Close,
  AutoAwesome,
  Send,
  Lightbulb,
  TrendingUp,
  Psychology,
  Speed,
  ExpandMore,
  SmartToy,
  Code,
  Transform,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useEnhanceDescriptionMutation,
  useGenerateCommentReplyMutation,
} from '../../../../store/api/jiraApi';

const MotionPaper = motion(Paper);

const AiAssistantPanel = ({ jiraData, onClose }) => {
  const [enhanceDescription] = useEnhanceDescriptionMutation();
  const [generateCommentReply] = useGenerateCommentReplyMutation();

  const [activeFeature, setActiveFeature] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const aiFeatures = [
    {
      id: 'enhance-description',
      title: 'Enhance Description',
      description: 'Use AI to improve and restructure the issue description',
      icon: <Transform color='primary' />,
      category: 'Content',
    },
    {
      id: 'suggest-solutions',
      title: 'Suggest Solutions',
      description: 'Get AI-powered solution suggestions based on the issue',
      icon: <Lightbulb color='warning' />,
      category: 'Analysis',
    },
    {
      id: 'analyze-priority',
      title: 'Analyze Priority',
      description: 'AI assessment of issue priority and impact',
      icon: <TrendingUp color='error' />,
      category: 'Analysis',
    },
    {
      id: 'smart-comments',
      title: 'Smart Comments',
      description: 'Generate professional responses and replies',
      icon: <Psychology color='info' />,
      category: 'Communication',
    },
    {
      id: 'code-analysis',
      title: 'Code Analysis',
      description: 'Analyze code snippets and provide insights',
      icon: <Code color='success' />,
      category: 'Development',
    },
    {
      id: 'performance-tips',
      title: 'Performance Tips',
      description: 'Get performance optimization recommendations',
      icon: <Speed color='secondary' />,
      category: 'Development',
    },
  ];

  const handleFeatureSelect = async feature => {
    setActiveFeature(feature);
    setIsProcessing(true);
    setAiResponse('');

    try {
      const context = {
        summary: jiraData?.fields?.summary,
        description: jiraData?.fields?.description,
        issueType: jiraData?.fields?.issuetype?.name,
        priority: jiraData?.fields?.priority?.name,
        status: jiraData?.fields?.status?.name,
      };

      let response;

      switch (feature.id) {
        case 'enhance-description':
          response = await enhanceDescription({
            description: context.description || 'No description provided',
            issueType: context.issueType || 'Task',
          }).unwrap();
          setAiResponse(response.data.enhanced);
          break;

        case 'suggest-solutions':
          // Mock AI analysis for solution suggestions
          setAiResponse(`Based on the ${context.issueType?.toLowerCase()} "${context.summary}", here are some solution approaches:

## Immediate Actions
1. **Reproduce the Issue**: First, verify the issue can be consistently reproduced
2. **Check Logs**: Review application and server logs for error patterns
3. **Environment Check**: Ensure the issue exists across different environments

## Technical Solutions
- Implement proper error handling for edge cases
- Add input validation to prevent invalid data states
- Consider implementing retry logic for transient failures
- Review database queries for performance bottlenecks

## Long-term Improvements
- Add comprehensive unit tests to prevent regression
- Implement monitoring and alerting for early detection
- Document the solution for future reference
- Consider architectural improvements if this is a recurring pattern

## Next Steps
1. Assign to appropriate team member based on component ownership
2. Set realistic timeline based on priority: ${context.priority}
3. Schedule code review after implementation
4. Plan for thorough testing before deployment`);
          break;

        case 'analyze-priority':
          setAiResponse(`## Priority Analysis for "${context.summary}"

**Current Priority**: ${context.priority || 'Medium'}
**Current Status**: ${context.status || 'Unknown'}

### AI Assessment:
Based on the issue details, this appears to be a **${context.priority || 'Medium'}** priority item with the following considerations:

**Impact Factors:**
- Issue affects core functionality: **Medium Impact**
- User experience degradation: **Moderate**
- Business critical operations: **Low-Medium Risk**

**Urgency Factors:**
- Blocking other work: **Unlikely**
- Customer-facing issue: **Possible**
- Security implications: **Low Risk**

### Recommendations:
1. **Timeline**: Target resolution within 1-2 sprints
2. **Resources**: Can be handled by single developer
3. **Testing**: Requires standard QA cycle
4. **Communication**: Regular stakeholder updates sufficient

**Suggested Actions:**
- Maintain current priority unless business impact increases
- Consider batching with similar issues for efficiency
- Document any workarounds for immediate relief`);
          break;

        case 'smart-comments':
          response = await generateCommentReply({
            comment: 'Please provide an update on this issue',
            context: `Issue: ${context.summary}`,
            tone: 'professional',
          }).unwrap();
          setAiResponse(`## Smart Comment Suggestions

**Professional Update:**
"${response.data.suggestedReply}"

**Technical Response:**
"Currently investigating the root cause. Preliminary analysis suggests this may be related to [specific component/system]. Will provide detailed findings within 24 hours along with proposed solution timeline."

**Stakeholder Communication:**
"This issue is actively being worked on. Based on initial assessment, the impact is limited to [specific area]. We're prioritizing a fix and will communicate any interim workarounds if needed."`);
          break;

        default:
          setAiResponse(
            'This AI feature is currently being developed. More capabilities coming soon!'
          );
      }
    } catch {
      setAiResponse('Failed to generate AI response. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!userInput.trim()) return;

    const userMessage = userInput;
    setUserInput('');
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }]);
    setIsProcessing(true);

    // Simulate AI chat response
    setTimeout(() => {
      const aiMessage = `I understand you're asking about "${userMessage}". Based on the current issue context, here's my analysis:

This ${jiraData?.fields?.issuetype?.name?.toLowerCase()} appears to require attention in the following areas:
- Technical investigation of the reported behavior
- Impact assessment on related systems
- Coordination with the ${jiraData?.fields?.assignee?.displayName || 'assigned team member'}

Would you like me to provide more specific guidance on any of these aspects?`;

      setChatHistory(prev => [...prev, { type: 'ai', message: aiMessage }]);
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <Drawer
      anchor='right'
      open={true}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 450,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <motion.div
        initial={{ x: 450 }}
        animate={{ x: 0 }}
        exit={{ x: 450 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        style={{ height: '100%' }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy />
            <Typography variant='h6' sx={{ fontWeight: 600 }}>
              AI Assistant
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, height: 'calc(100% - 80px)', overflow: 'auto' }}>
          {/* Issue Context */}
          <MotionPaper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              p: 2,
              mb: 3,
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
            }}
          >
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Current Issue Context
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {jiraData?.key} - {jiraData?.fields?.summary}
            </Typography>
          </MotionPaper>

          {/* AI Features */}
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
            AI-Powered Features
          </Typography>

          <Box sx={{ mb: 3 }}>
            {['Content', 'Analysis', 'Communication', 'Development'].map(
              category => (
                <Accordion
                  key={category}
                  sx={{
                    mb: 1,
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                    '&:before': { display: 'none' },
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                      {category}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <List>
                      {aiFeatures
                        .filter(feature => feature.category === category)
                        .map(feature => (
                          <ListItem
                            key={feature.id}
                            button
                            onClick={() => handleFeatureSelect(feature)}
                            sx={{
                              borderRadius: 1,
                              mb: 0.5,
                              '&:hover': {
                                background: 'rgba(102, 126, 234, 0.1)',
                              },
                            }}
                          >
                            <ListItemIcon>{feature.icon}</ListItemIcon>
                            <ListItemText
                              primary={feature.title}
                              secondary={feature.description}
                              primaryTypographyProps={{
                                variant: 'body2',
                                fontWeight: 500,
                              }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              )
            )}
          </Box>

          {/* AI Response Area */}
          <AnimatePresence>
            {(activeFeature || isProcessing) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                >
                  <AutoAwesome color='primary' />
                  <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>
                    {activeFeature?.title || 'AI Analysis'}
                  </Typography>
                </Box>

                <MotionPaper
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  sx={{
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 2,
                    maxHeight: 300,
                    overflow: 'auto',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {isProcessing ? (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        py: 2,
                      }}
                    >
                      <CircularProgress size={20} />
                      <Typography variant='body2'>
                        AI is analyzing...
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant='body2'
                      sx={{
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6,
                      }}
                    >
                      {aiResponse}
                    </Typography>
                  )}
                </MotionPaper>
              </motion.div>
            )}
          </AnimatePresence>

          <Divider sx={{ my: 3 }} />

          {/* AI Chat */}
          <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
            Ask AI Anything
          </Typography>

          <Box sx={{ mb: 2, maxHeight: 200, overflow: 'auto' }}>
            {chatHistory.map((chat, index) => (
              <Box
                key={index}
                sx={{
                  mb: 1,
                  p: 1.5,
                  borderRadius: 2,
                  background:
                    chat.type === 'user'
                      ? 'rgba(102, 126, 234, 0.2)'
                      : 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  ml: chat.type === 'user' ? 2 : 0,
                  mr: chat.type === 'ai' ? 2 : 0,
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap' }}>
                  {chat.message}
                </Typography>
              </Box>
            ))}
            {isProcessing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <CircularProgress size={16} />
                <Typography variant='body2' color='text.secondary'>
                  AI is typing...
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size='small'
              placeholder='Ask me anything about this issue...'
              value={userInput}
              onChange={e => setUserInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleChatSubmit()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.9)',
                  '& fieldset': {
                    borderColor: 'rgba(0, 0, 0, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(102, 126, 234, 0.8)',
                  },
                },
              }}
            />
            <IconButton
              onClick={handleChatSubmit}
              disabled={!userInput.trim() || isProcessing}
              sx={{
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                color: 'white',
                '&:hover': {
                  background:
                    'linear-gradient(45deg, #764ba2 30%, #667eea 90%)',
                },
              }}
            >
              <Send />
            </IconButton>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ mt: 3 }}>
            <Typography variant='subtitle2' sx={{ mb: 1 }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label='Analyze Impact'
                size='small'
                onClick={() =>
                  setUserInput('What is the potential impact of this issue?')
                }
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label='Suggest Testing'
                size='small'
                onClick={() =>
                  setUserInput('What testing approach would you recommend?')
                }
                sx={{ cursor: 'pointer' }}
              />
              <Chip
                label='Timeline Estimate'
                size='small'
                onClick={() =>
                  setUserInput('How long might this take to resolve?')
                }
                sx={{ cursor: 'pointer' }}
              />
            </Box>
          </Box>
        </Box>
      </motion.div>
    </Drawer>
  );
};

export default AiAssistantPanel;

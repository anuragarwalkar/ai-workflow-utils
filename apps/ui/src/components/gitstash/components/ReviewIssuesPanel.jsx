import React, { useState, useEffect, useMemo } from 'react';
import {
  AccordionDetails,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { parseReviewIssues, getSeverityColor } from '../utils/reviewIssueParser';
import IssueCommentButton from './IssueCommentButton';
import RichTextViewer from '../../common/RichTextViewer';
import {
  PanelContainer,
  HeaderCard,
  StatsContainer,
  ActionsContainer,
  StyledAccordion,
  StyledAccordionSummary,
  IssueTitle
} from './ReviewIssuesPanel.style';
import { useAddPRCommentMutation } from '../../../store/api/prApi';

const ReviewIssuesPanel = ({ reviewContent, projectKey, repoSlug, pullRequestId }) => {
  const [issues, setIssues] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [isPostingAll, setIsPostingAll] = useState(false);
  
  const [addPRComment] = useAddPRCommentMutation();

  // Parse review content when it changes
  useEffect(() => {
    if (reviewContent) {
      const parsedIssues = parseReviewIssues(reviewContent);
      setIssues(parsedIssues);
      
      // Auto-expand first issue if there's only a few
      if (parsedIssues.length > 0 && parsedIssues.length <= 3) {
        setExpanded(parsedIssues[0].id);
      }
    }
  }, [reviewContent]);

  const stats = useMemo(() => {
    const total = issues.length;
    const posted = issues.filter(i => i.posted).length;
    
    const bySeverity = issues.reduce((acc, issue) => {
      const sev = issue.severity || 'Info';
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {});
    
    return { total, posted, bySeverity };
  }, [issues]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleIssuePosted = (issueId) => {
    setIssues(prev => prev.map(issue => 
      issue.id === issueId ? { ...issue, posted: true } : issue
    ));
  };

  const formatComment = (issue) => {
    return `**[${issue.severity}] ${issue.title}**\n📁 File: \`${issue.file}\`\n\n${issue.description}`;
  };

  const handlePostAll = async () => {
    if (isPostingAll || stats.posted === stats.total) return;
    
    setIsPostingAll(true);
    
    const unpostedIssues = issues.filter(i => !i.posted);
    
    for (const issue of unpostedIssues) {
      try {
        await addPRComment({
          projectKey,
          repoSlug,
          pullRequestId,
          commentText: formatComment(issue),
        }).unwrap();
        
        handleIssuePosted(issue.id);
      } catch (err) {
        console.error(`Failed to post comment for issue ${issue.id}:`, err);
        // Continue trying to post remaining issues even if one fails
      }
    }
    
    setIsPostingAll(false);
  };

  if (!reviewContent) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">No review content available to parse.</Typography>
      </Box>
    );
  }

  return (
    <PanelContainer>
      <HeaderCard elevation={0}>
        <StatsContainer>
          <Typography variant="subtitle2" sx={{ mr: 1 }}>
            Issues Found: {stats.total}
          </Typography>
          
          {Object.entries(stats.bySeverity).map(([severity, count]) => (
            <Chip 
              key={severity}
              label={`${severity}: ${count}`}
              size="small"
              color={getSeverityColor(severity)}
              variant="outlined"
            />
          ))}
        </StatsContainer>
        
        <ActionsContainer>
          {stats.posted > 0 && (
            <Typography variant="caption" color="text.secondary">
              {stats.posted} of {stats.total} posted
            </Typography>
          )}
          
          <Button
            variant="contained"
            size="small"
            startIcon={isPostingAll ? <CircularProgress size={16} color="inherit" /> : 
                      (stats.posted === stats.total ? <DoneAllIcon /> : <SendIcon />)}
            onClick={handlePostAll}
            disabled={isPostingAll || stats.posted === stats.total || issues.length === 0}
            color={stats.posted === stats.total ? "success" : "primary"}
          >
            {isPostingAll ? 'Posting...' : 
             stats.posted === stats.total ? 'All Posted' : 'Post All Comments'}
          </Button>
        </ActionsContainer>
      </HeaderCard>

      <Box>
        {issues.map((issue) => (
          <StyledAccordion 
            key={issue.id} 
            expanded={expanded === issue.id}
            onChange={handleAccordionChange(issue.id)}
          >
            <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Chip 
                label={issue.severity} 
                size="small" 
                color={getSeverityColor(issue.severity)}
                sx={{ minWidth: 80 }}
              />
              <Chip 
                label={issue.file} 
                size="small" 
                variant="outlined" 
                sx={{ maxWidth: 200 }}
              />
              <IssueTitle variant="body2">
                {issue.title}
              </IssueTitle>
              {issue.posted && (
                <Chip icon={<DoneAllIcon />} label="Posted" size="small" color="success" variant="outlined" />
              )}
            </StyledAccordionSummary>
            <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <RichTextViewer 
                content={issue.description}
                variant="inline"
                sx={{ 
                  backgroundColor: 'transparent',
                  p: 0,
                  fontSize: '0.875rem'
                }}
              />
              <IssueCommentButton 
                issue={issue}
                projectKey={projectKey}
                repoSlug={repoSlug}
                pullRequestId={pullRequestId}
                onPosted={handleIssuePosted}
              />
            </AccordionDetails>
          </StyledAccordion>
        ))}
      </Box>
    </PanelContainer>
  );
};

export default ReviewIssuesPanel;

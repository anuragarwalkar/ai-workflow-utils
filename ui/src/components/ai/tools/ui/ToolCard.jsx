/**
 * Tool Card Component - Displays tool execution status and results
 */

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { ToolCardContainer, ToolIcon, ToolStatus } from './ToolCard.style';

const ToolCard = ({ tool, status, result, error, expanded = false }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <ScheduleIcon color="warning" />;
      case 'running':
        return <CircularProgress size={20} />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <BuildIcon />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'running':
        return 'info';
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <ToolCardContainer>
      <Card variant="outlined">
        <CardContent>
          <Box alignItems="center" display="flex" gap={1} mb={1}>
            <ToolIcon>{getStatusIcon()}</ToolIcon>
            <Typography component="h3" variant="h6">
              {tool.name}
            </Typography>
            <ToolStatus>
              <Chip
                color={getStatusColor()}
                label={status}
                size="small"
                variant="outlined"
              />
            </ToolStatus>
          </Box>

          <Typography color="text.secondary" mb={2} variant="body2">
            {tool.description}
          </Typography>

          {Boolean(tool.parameters && Object.keys(tool.parameters).length > 0) && (
            <Accordion defaultExpanded={expanded}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Parameters</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
                  {JSON.stringify(tool.parameters, null, 2)}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {Boolean(result) && (
            <Accordion defaultExpanded={expanded}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Result</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre" sx={{ fontSize: '0.875rem', overflow: 'auto' }}>
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {Boolean(error) && (
            <Alert severity="error" sx={{ mt: 1 }}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    </ToolCardContainer>
  );
};

export default ToolCard;

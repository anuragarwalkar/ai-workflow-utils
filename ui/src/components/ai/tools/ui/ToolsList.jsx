/**
 * Tools List Component - Displays a list of tools being executed
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import ToolCard from './ToolCard';
import { ToolsListContainer } from './ToolsList.style';

const ToolsList = ({ tools = [], title = 'Tools' }) => {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <ToolsListContainer>
      <Typography color="text.secondary" mb={2} variant="subtitle2">
        {title}
      </Typography>
      <Box>
        {tools.map((toolExecution) => (
          <ToolCard
            key={toolExecution.id}
            error={toolExecution.error}
            result={toolExecution.result}
            status={toolExecution.status}
            tool={toolExecution.tool}
          />
        ))}
      </Box>
    </ToolsListContainer>
  );
};

export default ToolsList;

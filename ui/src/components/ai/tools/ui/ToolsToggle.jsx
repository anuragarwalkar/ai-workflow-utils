/**
 * Tools Toggle Component - Switch to enable/disable tools
 */

import React from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { Build as ToolsIcon } from '@mui/icons-material';

const ToolsToggle = ({ enabled, onToggle, disabled = false }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ToolsIcon color={enabled ? 'primary' : 'disabled'} fontSize="small" />
      <Tooltip 
        title={
          disabled 
            ? 'Tools are not available' 
            : enabled 
              ? 'Disable AI tools and function calling' 
              : 'Enable AI tools and function calling'
        }
      >
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              disabled={disabled}
              size="small"
              onChange={(e) => onToggle(e.target.checked)}
            />
          }
          label={
            <Typography color={enabled ? 'primary' : 'text.secondary'} variant="body2">
              Tools
            </Typography>
          }
        />
      </Tooltip>
    </Box>
  );
};

export default ToolsToggle;

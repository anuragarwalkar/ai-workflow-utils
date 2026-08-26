import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

/**
 * Pure component for tab navigation
 */
const TabNavigation = ({ tabValue, onTabChange }) => (
  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
    <Tabs
      aria-label="repository selection tabs"
      value={tabValue}
      onChange={onTabChange}
    >
      <Tab
        icon={<StorageIcon />}
        iconPosition="start"
        label="Manual Entry"
        sx={{ minHeight: 48 }}
      />
      <Tab
        icon={<AutoAwesomeIcon />}
        iconPosition="start"
        label="From URL"
        sx={{ minHeight: 48 }}
      />
    </Tabs>
  </Box>
);

export default TabNavigation;

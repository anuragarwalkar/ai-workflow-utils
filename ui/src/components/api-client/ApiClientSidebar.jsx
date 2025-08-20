import React from 'react';
import {
  Box,
  Collapse,
  IconButton,
  Paper,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../theme/useAppTheme';
import CollectionsSidebar from './CollectionsSidebar';
import EnvironmentManager from './EnvironmentManager';

const ApiClientSidebar = ({ 
  activeEnvironment,
  activeTab,
  collections,
  environments,
  glassMorphismStyle,
  isCollapsed,
  setActiveTab,
  onEnvironmentChange,
  onEnvironmentSave,
  onEnvironmentDelete,
  onEnvironmentExport,
  onEnvironmentImport,
  onRequestSelect,
  onToggleCollapse
}) => {
  const theme = useTheme();
  const { isDark } = useAppTheme();

  if (isCollapsed) {
    return (
      <Paper
        elevation={0}
        sx={{
          ...glassMorphismStyle,
          ...(isDark && {
            background: '#1E1E1E',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }),
          width: 60,
          borderRadius: 0,
          borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          transition: 'width 0.3s ease',
        }}
      >
        <Tooltip placement="right" title="Collections">
          <IconButton
            color={activeTab === 0 ? 'primary' : 'default'}
            size="small"
            sx={{ mb: 1 }}
            onClick={() => setActiveTab(0)}
          >
            <FolderIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip placement="right" title="Environment">
          <IconButton
            color={activeTab === 1 ? 'primary' : 'default'}
            size="small"
            sx={{ mb: 2 }}
            onClick={() => setActiveTab(1)}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip placement="right" title="Expand Sidebar">
          <IconButton
            size="small"
            sx={{ 
              mt: 'auto',
              background: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                background: alpha(theme.palette.primary.main, 0.2),
              },
            }}
            onClick={onToggleCollapse}
          >
            <ChevronRightIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        ...glassMorphismStyle,
        ...(isDark && {
          background: '#1E1E1E',
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }),
        width: 300,
        borderRadius: 0,
        borderRight: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        position: 'relative',
        transition: 'width 0.3s ease',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          pr: 1,
        }}
      >
        <Tabs
          sx={{
            flex: 1,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
            },
          }}
          value={activeTab}
          variant="fullWidth"
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          <Tab label="Collections" />
          <Tab label="Environment" />
        </Tabs>
        
        <Tooltip title="Collapse Sidebar">
          <IconButton
            size="small"
            sx={{
              background: alpha(theme.palette.action.hover, 0.1),
              '&:hover': {
                background: alpha(theme.palette.action.hover, 0.2),
              },
            }}
            onClick={onToggleCollapse}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}>
        {activeTab === 0 ? (
          <Box>
            {/* Show active environment in Collections tab */}
            {Boolean(activeEnvironment) && (
              <Box sx={{ 
                p: 2, 
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }}>
                <Typography color="text.secondary" sx={{ display: 'block', mb: 0.5 }} variant="caption">
                  Active Environment:
                </Typography>
                <Typography sx={{ fontWeight: 500 }} variant="body2">
                  {activeEnvironment.name}
                </Typography>
              </Box>
            )}
            <CollectionsSidebar
              collections={collections}
              onRequestSelect={onRequestSelect}
            />
          </Box>
        ) : (
          <EnvironmentManager
            activeEnvironment={activeEnvironment}
            environments={environments}
            onEnvironmentChange={onEnvironmentChange}
            onEnvironmentDelete={onEnvironmentDelete}
            onEnvironmentExport={onEnvironmentExport}
            onEnvironmentImport={onEnvironmentImport}
            onEnvironmentSave={onEnvironmentSave}
          />
        )}
      </Box>
    </Paper>
  );
};

export default ApiClientSidebar;

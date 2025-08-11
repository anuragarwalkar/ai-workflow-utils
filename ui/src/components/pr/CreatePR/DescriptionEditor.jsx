import React from 'react';
import {
  Box,
  CircularProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Code as CodeIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import RichTextViewer from '../../common/RichTextViewer';
import Editor from '@monaco-editor/react';
import { useAppTheme } from '../../../theme/useAppTheme';

// Mode Toggle Component
const ModeToggle = ({ mode, onModeChange }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Typography sx={{ flexGrow: 1 }} variant='h6'>
      Description
    </Typography>
    <ToggleButtonGroup
      exclusive
      size='small'
      value={mode}
      onChange={(event, newMode) => {
        if (newMode !== null) {
          onModeChange(newMode);
        }
      }}
    >
      <ToggleButton value='view'>
        <VisibilityIcon fontSize='small' />
      </ToggleButton>
      <ToggleButton value='edit'>
        <CodeIcon fontSize='small' />
      </ToggleButton>
      <ToggleButton value='source'>
        <EditIcon fontSize='small' />
      </ToggleButton>
    </ToggleButtonGroup>
  </Box>
);

// View Mode Component
const ViewMode = ({ description }) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      backgroundColor: 'background.paper',
      minHeight: '240px',
      p: 2,
    }}
  >
    <RichTextViewer
      content={description || 'No description available'}
      sx={{ minHeight: '200px' }}
      variant='inline'
    />
  </Box>
);

// Edit Mode Component
const EditMode = ({ description, onChange }) => {
  const { isDark } = useAppTheme();
  
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Editor
        defaultLanguage='markdown'
        height='300px'
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          lineNumbers: 'on',
          folding: false,
          fontSize: 14,
          padding: { top: 16, bottom: 16 },
          scrollBeyondLastLine: false,
        }}
        theme={isDark ? 'vs-dark' : 'light'}
        value={description}
        onChange={value => onChange(value || '')}
      />
    </Box>
  );
};

// Source Mode Component
const SourceMode = ({ description, onChange }) => (
  <TextField
    fullWidth
    multiline
    InputProps={{
      endAdornment: !description && (
        <CircularProgress size={16} sx={{ mr: 1 }} />
      ),
    }}
    placeholder={!description ? 'Generating description...' : ''}
    rows={8}
    size='small'
    sx={{
      mb: 2,
      '& .MuiInputBase-input': {
        fontFamily: 'monospace',
        fontSize: '0.875rem',
      },
    }}
    value={description}
    variant='outlined'
    onChange={e => onChange(e.target.value)}
  />
);

const DescriptionEditor = ({ description, onChange, mode, onModeChange }) => {
  const renderContent = () => {
    switch (mode) {
      case 'view':
        return <ViewMode description={description} />;
      case 'edit':
        return <EditMode description={description} onChange={onChange} />;
      case 'source':
        return <SourceMode description={description} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <ModeToggle mode={mode} onModeChange={onModeChange} />
      {renderContent()}
    </Box>
  );
};

export default DescriptionEditor;

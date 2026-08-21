import React, { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddPhotoAlternate as AddPhotoIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import RichTextViewer from '../../common/RichTextViewer';
import Editor from '@monaco-editor/react';
import { useAppTheme } from '../../../theme/useAppTheme';

// Mode Toggle Component with optional Screenshot insertion action
const ModeToggle = ({ mode, onModeChange, attachedImages = [], onInsertScreenshots }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleMenuClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleInsertAll = () => {
    onInsertScreenshots(attachedImages);
    handleMenuClose();
  };

  const handleInsertSingle = image => {
    onInsertScreenshots([image]);
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <Typography sx={{ fontWeight: 600 }} variant='h6'>
        Description
      </Typography>

      <Stack alignItems='center' direction='row' spacing={1}>
        {Boolean(attachedImages.length > 0 && onInsertScreenshots) && (
          <>
            <Tooltip arrow title='Embed screenshot image(s) into markdown description'>
              <Button
                color='primary'
                size='small'
                startIcon={<AddPhotoIcon fontSize='small' />}
                sx={{ textTransform: 'none', fontSize: '0.8rem', py: 0.5 }}
                variant='outlined'
                onClick={handleMenuClick}
              >
                Insert Screenshot
              </Button>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={handleMenuClose}>
              <MenuItem onClick={handleInsertAll}>
                <ImageIcon fontSize='small' sx={{ mr: 1 }} /> Insert All ({attachedImages.length} Screenshots)
              </MenuItem>
              {attachedImages.map(img => (
                <MenuItem key={img.id} onClick={() => handleInsertSingle(img)}>
                  <AddPhotoIcon fontSize='small' sx={{ mr: 1 }} /> {img.name}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

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
          <Tooltip title='Rendered Markdown View'>
            <ToggleButton value='view'>
              <VisibilityIcon fontSize='small' />
            </ToggleButton>
          </Tooltip>
          <Tooltip title='Monaco Code Editor'>
            <ToggleButton value='edit'>
              <CodeIcon fontSize='small' />
            </ToggleButton>
          </Tooltip>
          <Tooltip title='Raw Markdown Text'>
            <ToggleButton value='source'>
              <EditIcon fontSize='small' />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Stack>
    </Box>
  );
};

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
      endAdornment: !description && <CircularProgress size={16} sx={{ mr: 1 }} />,
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

const DescriptionEditor = ({
  description,
  onChange,
  mode,
  onModeChange,
  attachedImages = [],
}) => {
  /**
   * Insert screenshots into markdown description
   */
  const handleInsertScreenshots = async imagesToInsert => {
    if (!imagesToInsert || imagesToInsert.length === 0) return;

    const markdownBlocks = await Promise.all(
      imagesToInsert.map(async img => {
        let dataUrl = img.url;
        if (img.file) {
          dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(img.file);
          });
        }
        return `\n### ${img.name}\n![${img.name}](${dataUrl})\n`;
      })
    );

    const screenshotSection = `\n\n## Screenshots\n${markdownBlocks.join('\n')}`;
    const newDescription = (description || '').trim() + screenshotSection;
    onChange(newDescription);
  };

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
      <ModeToggle
        attachedImages={attachedImages}
        mode={mode}
        onInsertScreenshots={handleInsertScreenshots}
        onModeChange={onModeChange}
      />
      {renderContent()}
    </Box>
  );
};

export default DescriptionEditor;


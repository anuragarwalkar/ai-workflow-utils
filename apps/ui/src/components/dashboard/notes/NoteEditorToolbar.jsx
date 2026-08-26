import React from 'react';
import { Box, IconButton, Tooltip, Divider, Menu, MenuItem, Typography } from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatStrikethrough as StrikeIcon,
  Code as CodeIcon,
  IntegrationInstructions as CodeBlockIcon,
  FormatListBulleted as BulletListIcon,
  FormatListNumbered as OrderedListIcon,
  CheckBoxOutlined as TaskListIcon,
  FormatQuote as QuoteIcon,
  HorizontalRule as HrIcon,
  Highlight as HighlightIcon,
  FormatClear as ClearFormatIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Title as HeadingIcon,
  FormatColorText as ColorIcon,
} from '@mui/icons-material';
import { useAppTheme } from '../../../theme/useAppTheme';

const NoteEditorToolbar = ({ editor }) => {
  const { isDark } = useAppTheme();
  const [headingAnchorEl, setHeadingAnchorEl] = React.useState(null);
  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);

  if (!editor) return null;

  const btnStyle = (isActive) => ({
    p: '6px',
    borderRadius: '6px',
    color: isActive ? '#7C3AED' : isDark ? '#94a3b8' : '#64748b',
    bgcolor: isActive ? (isDark ? 'rgba(124, 58, 237, 0.25)' : 'rgba(124, 58, 237, 0.12)') : 'transparent',
    '&:hover': {
      bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
      color: isDark ? '#f8fafc' : '#0f172a',
    },
    transition: 'all 0.15s ease',
  });

  const colors = [
    { label: 'Default', value: 'inherit' },
    { label: 'Purple', value: '#7C3AED' },
    { label: 'Blue', value: '#3B82F6' },
    { label: 'Emerald', value: '#10B981' },
    { label: 'Amber', value: '#F59E0B' },
    { label: 'Rose', value: '#EF4444' },
    { label: 'Cyan', value: '#06B6D4' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 0.5,
        p: '6px 12px',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(248, 250, 252, 0.95)',
        borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        borderRadius: '12px 12px 0 0',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Headings Menu */}
      <Tooltip title="Headings">
        <IconButton
          size="small"
          onClick={(e) => setHeadingAnchorEl(e.currentTarget)}
          sx={btnStyle(
            editor.isActive('heading', { level: 1 }) ||
            editor.isActive('heading', { level: 2 }) ||
            editor.isActive('heading', { level: 3 })
          )}
        >
          <HeadingIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={headingAnchorEl}
        open={Boolean(headingAnchorEl)}
        onClose={() => setHeadingAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#1e293b' : '#fff',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
          },
        }}
      >
        <MenuItem
          selected={editor.isActive('paragraph')}
          onClick={() => {
            editor.chain().focus().setParagraph().run();
            setHeadingAnchorEl(null);
          }}
        >
          <Typography variant="body2">Paragraph</Typography>
        </MenuItem>
        <MenuItem
          selected={editor.isActive('heading', { level: 1 })}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
            setHeadingAnchorEl(null);
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Heading 1</Typography>
        </MenuItem>
        <MenuItem
          selected={editor.isActive('heading', { level: 2 })}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
            setHeadingAnchorEl(null);
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600 }}>Heading 2</Typography>
        </MenuItem>
        <MenuItem
          selected={editor.isActive('heading', { level: 3 })}
          onClick={() => {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
            setHeadingAnchorEl(null);
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Heading 3</Typography>
        </MenuItem>
      </Menu>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

      {/* Basic text formatting */}
      <Tooltip title="Bold (Ctrl+B)">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBold().run()}
          sx={btnStyle(editor.isActive('bold'))}
        >
          <BoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Italic (Ctrl+I)">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          sx={btnStyle(editor.isActive('italic'))}
        >
          <ItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Underline (Ctrl+U)">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          sx={btnStyle(editor.isActive('underline'))}
        >
          <UnderlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Strikethrough">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          sx={btnStyle(editor.isActive('strike'))}
        >
          <StrikeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Inline Code">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleCode().run()}
          sx={btnStyle(editor.isActive('code'))}
        >
          <CodeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Highlight">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
          sx={btnStyle(editor.isActive('highlight'))}
        >
          <HighlightIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Text Color Menu */}
      <Tooltip title="Text Color">
        <IconButton
          size="small"
          onClick={(e) => setColorAnchorEl(e.currentTarget)}
          sx={btnStyle(false)}
        >
          <ColorIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={colorAnchorEl}
        open={Boolean(colorAnchorEl)}
        onClose={() => setColorAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: isDark ? '#1e293b' : '#fff',
            p: 1,
            display: 'flex',
            gap: 0.5,
          },
        }}
      >
        {colors.map((c) => (
          <Box
            key={c.value}
            onClick={() => {
              if (c.value === 'inherit') {
                editor.chain().focus().unsetColor().run();
              } else {
                editor.chain().focus().setColor(c.value).run();
              }
              setColorAnchorEl(null);
            }}
            sx={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: c.value === 'inherit' ? (isDark ? '#e2e8f0' : '#1e293b') : c.value,
              cursor: 'pointer',
              border: '2px solid transparent',
              '&:hover': { transform: 'scale(1.2)' },
              transition: 'transform 0.15s ease',
              title: c.label,
            }}
          />
        ))}
      </Menu>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

      {/* Lists and Blocks */}
      <Tooltip title="Bullet List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          sx={btnStyle(editor.isActive('bulletList'))}
        >
          <BulletListIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Numbered List">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          sx={btnStyle(editor.isActive('orderedList'))}
        >
          <OrderedListIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Task Checklist">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          sx={btnStyle(editor.isActive('taskList'))}
        >
          <TaskListIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Code Block">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          sx={btnStyle(editor.isActive('codeBlock'))}
        >
          <CodeBlockIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Blockquote">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          sx={btnStyle(editor.isActive('blockquote'))}
        >
          <QuoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Horizontal Line">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          sx={btnStyle(false)}
        >
          <HrIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

      {/* Clear, Undo, Redo */}
      <Tooltip title="Clear Formatting">
        <IconButton
          size="small"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          sx={btnStyle(false)}
        >
          <ClearFormatIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Undo (Ctrl+Z)">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            sx={btnStyle(false)}
          >
            <UndoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo (Ctrl+Y)">
        <span>
          <IconButton
            size="small"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            sx={btnStyle(false)}
          >
            <RedoIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default NoteEditorToolbar;

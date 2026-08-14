import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Box } from '@mui/material';
import NoteEditorToolbar from './NoteEditorToolbar';
import { useAppTheme } from '../../../theme/useAppTheme';

const RichTextEditor = ({
  content = '',
  onChange,
  placeholder = "Write your thoughts, technical notes, or press '/' for commands...",
  readOnly = false,
  minHeight = '360px',
  hideToolbar = false,
}) => {
  const { isDark } = useAppTheme();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'tiptap-code-block',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextStyle,
      Color,
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      if (onChange) {
        onChange(ed.getHTML());
      }
    },
  });

  // Sync content when prop changes externally (e.g. user selected different note)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml) {
        editor.commands.setContent(content || '', false);
      }
    }
  }, [content, editor]);

  // Update editable mode if readOnly changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        borderRadius: '12px',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        '&:focus-within': {
          borderColor: '#7C3AED',
          boxShadow: isDark
            ? '0 0 0 1px rgba(124, 58, 237, 0.4), 0 4px 12px rgba(0,0,0,0.3)'
            : '0 0 0 1px rgba(124, 58, 237, 0.3), 0 4px 12px rgba(124, 58, 237, 0.08)',
        },
      }}
    >
      {!hideToolbar && !readOnly && <NoteEditorToolbar editor={editor} />}

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2.5,
          cursor: 'text',
          minHeight,
          // TipTap Styling
          '& .tiptap': {
            outline: 'none',
            minHeight: '100%',
            color: isDark ? '#e2e8f0' : '#1e293b',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '0.95rem',
            lineHeight: 1.65,

            '& p': {
              margin: '0 0 0.8em 0',
            },
            '& p.is-editor-empty:first-child::before': {
              color: isDark ? '#64748b' : '#94a3b8',
              content: 'attr(data-placeholder)',
              float: 'left',
              height: 0,
              pointerEvents: 'none',
            },
            '& h1': {
              fontSize: '1.75rem',
              fontWeight: 700,
              lineHeight: 1.25,
              margin: '1.2em 0 0.5em 0',
              color: isDark ? '#f8fafc' : '#0f172a',
            },
            '& h2': {
              fontSize: '1.35rem',
              fontWeight: 600,
              lineHeight: 1.3,
              margin: '1.1em 0 0.4em 0',
              color: isDark ? '#f1f5f9' : '#1e293b',
            },
            '& h3': {
              fontSize: '1.15rem',
              fontWeight: 600,
              lineHeight: 1.35,
              margin: '1em 0 0.3em 0',
              color: isDark ? '#e2e8f0' : '#334155',
            },
            '& ul, & ol': {
              paddingLeft: '1.5rem',
              margin: '0 0 0.8em 0',
            },
            '& li': {
              margin: '0.25em 0',
            },
            '& ul[data-type="taskList"]': {
              listStyle: 'none',
              padding: 0,
              margin: '0 0 0.8em 0',
              '& li': {
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '0.3em 0',
                '& > label': {
                  flex: '0 0 auto',
                  marginRight: '0.5rem',
                  userSelect: 'none',
                  marginTop: '3px',
                },
                '& > div': {
                  flex: '1 1 auto',
                },
                '& input[type="checkbox"]': {
                  cursor: 'pointer',
                  accentColor: '#7C3AED',
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                },
              },
            },
            '& blockquote': {
              borderLeft: '4px solid #7C3AED',
              paddingLeft: '1rem',
              margin: '1em 0',
              color: isDark ? '#94a3b8' : '#64748b',
              fontStyle: 'italic',
              background: isDark ? 'rgba(124, 58, 237, 0.05)' : 'rgba(124, 58, 237, 0.03)',
              paddingTop: '4px',
              paddingBottom: '4px',
              borderRadius: '0 8px 8px 0',
            },
            '& pre.tiptap-code-block': {
              background: isDark ? '#090d16' : '#1e293b',
              color: '#f8fafc',
              fontFamily: '"Fira Code", "JetBrains Mono", Menlo, monospace',
              padding: '0.85rem 1.1rem',
              borderRadius: '8px',
              overflowX: 'auto',
              margin: '1em 0',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              border: isDark ? '1px solid rgba(255,255,255,0.08)' : 'none',
            },
            '& code:not(pre code)': {
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
              color: isDark ? '#f472b6' : '#db2777',
              padding: '0.2em 0.4em',
              borderRadius: '4px',
              fontSize: '0.875em',
              fontFamily: '"Fira Code", "JetBrains Mono", Menlo, monospace',
            },
            '& hr': {
              border: 'none',
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              margin: '1.5em 0',
            },
            '& a': {
              color: '#7C3AED',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 500,
            },
            '& mark': {
              backgroundColor: '#fef08a',
              color: '#1e293b',
              padding: '0.1em 0.3em',
              borderRadius: '3px',
            },
          },
        }}
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.chain().focus().run();
          }
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default RichTextEditor;

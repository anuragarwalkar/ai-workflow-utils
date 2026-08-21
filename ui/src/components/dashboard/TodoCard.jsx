import { useState, useEffect } from 'react';
import { AppDateTimePicker } from '../common';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteIcon,
  DragIndicator as DragIcon,
  CheckCircleOutline as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Notes as NotesIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  useGetTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
  useReorderTodosMutation,
} from '../../store/api/dashboardApi';
import { AnimatePresence, Reorder, motion, useDragControls } from 'framer-motion';
import { useAppTheme } from '../../theme/useAppTheme';
import { playTickSound } from '../../utils/soundUtils';

const getLocalIsoString = isoString => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

const getPriorityStyle = priority => {
  switch (priority?.toLowerCase()) {
    case 'high':
      return {
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.3)',
        label: 'High',
      };
    case 'medium':
    case 'med':
      return {
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.12)',
        border: 'rgba(245, 158, 11, 0.3)',
        label: 'Med',
      };
    default:
      return {
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.3)',
        label: 'Low',
      };
  }
};

const PRIORITY_ORDER = {
  high: 1,
  medium: 2,
  med: 2,
  low: 3,
};

const getPriorityRank = priority => {
  const p = (priority || '').toLowerCase();
  return PRIORITY_ORDER[p] || 2;
};

const TodoItem = ({
  todo,
  toggleTodo,
  deleteTodo,
  updateTodo,
  isDark,
  isExpanded,
  onToggleExpand,
}) => {
  const controls = useDragControls();

  const [editTitle, setEditTitle] = useState(todo.title || '');
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editPriority, setEditPriority] = useState(todo.priority || 'Medium');
  const [editDueAt, setEditDueAt] = useState(getLocalIsoString(todo.dueAt));

  useEffect(() => {
    setEditTitle(todo.title || '');
    setEditDescription(todo.description || '');
    setEditPriority(todo.priority || 'Medium');
    setEditDueAt(getLocalIsoString(todo.dueAt));
  }, [todo]);

  const handleSaveDetails = () => {
    const payload = {
      id: todo.id,
      title: editTitle.trim() || todo.title,
      description: editDescription.trim(),
      priority: editPriority,
      dueAt: editDueAt ? new Date(editDueAt).toISOString() : null,
    };
    updateTodo(payload);
    onToggleExpand();
  };

  const handlePriorityChange = newPriority => {
    setEditPriority(newPriority);
    updateTodo({ id: todo.id, priority: newPriority });
  };

  const priorityInfo = getPriorityStyle(todo.priority);

  return (
    <Reorder.Item
      value={todo}
      id={todo.id}
      dragListener={false}
      dragControls={controls}
      style={{
        listStyle: 'none',
        position: 'relative',
        userSelect: 'none',
      }}
      whileDrag={{
        scale: 1.02,
        zIndex: 999,
        boxShadow: isDark ? '0 12px 30px rgba(0, 0, 0, 0.55)' : '0 8px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          py: 1.25,
          px: 1.5,
          borderRadius: '10px',
          bgcolor: Boolean(todo.done)
            ? isDark
              ? 'rgba(255, 255, 255, 0.02)'
              : 'rgba(248, 250, 252, 0.8)'
            : isDark
              ? 'rgba(255, 255, 255, 0.04)'
              : '#ffffff',
          border: '1px solid',
          borderColor: isExpanded
            ? '#00BFA5'
            : Boolean(todo.done)
              ? isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(0, 0, 0, 0.04)'
              : isDark
                ? 'rgba(255, 255, 255, 0.07)'
                : 'rgba(0, 0, 0, 0.06)',
          boxShadow: isExpanded
            ? '0 0 0 1px rgba(0, 191, 165, 0.3)'
            : Boolean(todo.done)
              ? 'none'
              : isDark
                ? '0 1px 3px rgba(0,0,0,0.2)'
                : '0 1px 3px rgba(0,0,0,0.03)',
          opacity: Boolean(todo.done) ? 0.6 : 1,
          transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: isExpanded
              ? '#00BFA5'
              : isDark
                ? 'rgba(0, 191, 165, 0.35)'
                : 'rgba(0, 191, 165, 0.3)',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
            boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 3px 10px rgba(0, 0, 0, 0.06)',
            '& .task-drag-handle': {
              opacity: 0.9,
              color: '#00BFA5',
            },
            '& .row-actions': {
              opacity: 1,
            },
          },
        }}
      >
        {/* Main Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {/* Drag Handle */}
          <Box
            component='span'
            className='task-drag-handle'
            onPointerDown={e => {
              e.stopPropagation();
              controls.start(e);
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'grab',
              touchAction: 'none',
              color: isDark ? '#64748b' : '#94a3b8',
              mr: 0.75,
              opacity: 0.35,
              transition: 'opacity 0.2s, color 0.2s',
              p: 0.25,
              borderRadius: '4px',
              '&:hover': {
                bgcolor: isDark ? 'rgba(0, 191, 165, 0.15)' : 'rgba(0, 191, 165, 0.1)',
              },
              '&:active': {
                cursor: 'grabbing',
              },
            }}
          >
            <DragIcon sx={{ fontSize: 18 }} />
          </Box>

          {/* Checkbox */}
          <Checkbox
            checked={Boolean(todo.done)}
            onChange={() => toggleTodo(todo.id, todo.done)}
            icon={<UncheckedIcon sx={{ fontSize: 20, color: isDark ? '#64748b' : '#cbd5e1' }} />}
            checkedIcon={<CheckCircleIcon sx={{ fontSize: 20, color: '#00BFA5' }} />}
            sx={{
              p: 0.5,
              mr: 1,
              transition: 'transform 0.15s',
              '&:hover': { transform: 'scale(1.1)' },
            }}
          />

          {/* Title & metadata */}
          <Box
            onClick={onToggleExpand}
            sx={{
              flexGrow: 1,
              minWidth: 0,
              mr: 1,
              cursor: 'pointer',
            }}
          >
            <Typography
              sx={{
                color: Boolean(todo.done)
                  ? isDark
                    ? '#64748b'
                    : '#94a3b8'
                  : isDark
                    ? '#E8EDF5'
                    : '#1e293b',
                textDecoration: Boolean(todo.done) ? 'line-through' : 'none',
                fontSize: '0.92rem',
                fontWeight: Boolean(todo.done) ? 400 : 500,
                lineHeight: 1.4,
                wordBreak: 'break-word',
                transition: 'color 0.2s',
              }}
            >
              {todo.title}
            </Typography>

            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}
            >
              {/* Priority badge - always displayed */}
              <Chip
                label={priorityInfo.label}
                size='small'
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  bgcolor: priorityInfo.bg,
                  color: priorityInfo.color,
                  borderRadius: '4px',
                  px: 0.25,
                }}
              />

              {/* Due Date badge */}
              {todo.dueAt && !todo.done && (
                <Chip
                  label={`Due ${new Date(todo.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  size='small'
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    color: isDark ? '#94a3b8' : '#64748b',
                    borderRadius: '4px',
                  }}
                />
              )}

              {/* Has Notes / Description Indicator */}
              {todo.description && (
                <Tooltip title='Has additional notes' arrow placement='top'>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: isDark ? '#8899BB' : '#64748b',
                    }}
                  >
                    <NotesIcon sx={{ fontSize: 14 }} />
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Row Actions */}
          <Box
            className='row-actions'
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.25,
              opacity: { xs: 1, md: isExpanded ? 1 : 0 },
              transition: 'opacity 0.2s',
            }}
          >
            <Tooltip title={isExpanded ? 'Collapse' : 'Add details / Edit'} arrow placement='top'>
              <IconButton
                onClick={onToggleExpand}
                size='small'
                sx={{
                  color: isDark ? '#94a3b8' : '#64748b',
                  p: 0.5,
                  '&:hover': {
                    color: '#00BFA5',
                    bgcolor: isDark ? 'rgba(0,191,165,0.1)' : 'rgba(0,191,165,0.08)',
                  },
                }}
              >
                {isExpanded ? (
                  <ExpandLessIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title='Delete task' arrow placement='top'>
              <IconButton
                onClick={() => deleteTodo(todo.id)}
                size='small'
                sx={{
                  color: isDark ? '#94a3b8' : '#94a3b8',
                  p: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: '#EF4444',
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                  },
                }}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Expandable Details Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <Box
                sx={{
                  pt: 1.5,
                  mt: 1.25,
                  borderTop: isDark
                    ? '1px solid rgba(255, 255, 255, 0.06)'
                    : '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {/* Title Edit */}
                <TextField
                  fullWidth
                  size='small'
                  label='Task Title'
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      fontSize: '0.88rem',
                    },
                  }}
                />

                {/* Notes / Description */}
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={5}
                  size='small'
                  label='Notes & Context (Indexed in LanceDB)'
                  placeholder='Add details, checklists, or context for future AI queries...'
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                    },
                  }}
                />

                {/* Priority & Due Date Row */}
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Priority selector */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography
                      variant='caption'
                      sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                    >
                      Priority:
                    </Typography>
                    {['Low', 'Medium', 'High'].map(p => {
                      const pStyle = getPriorityStyle(p);
                      const isSelected = editPriority?.toLowerCase() === p.toLowerCase();
                      return (
                        <Chip
                          key={p}
                          label={p}
                          size='small'
                          onClick={() => handlePriorityChange(p)}
                          sx={{
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            height: 24,
                            bgcolor: isSelected
                              ? pStyle.bg
                              : isDark
                                ? 'rgba(255, 255, 255, 0.04)'
                                : 'rgba(0, 0, 0, 0.03)',
                            color: isSelected ? pStyle.color : isDark ? '#94a3b8' : '#64748b',
                            border: '1px solid',
                            borderColor: isSelected ? pStyle.border : 'transparent',
                            transition: 'all 0.15s',
                            '&:hover': {
                              bgcolor: pStyle.bg,
                              color: pStyle.color,
                            },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Due date picker */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography
                      variant='caption'
                      sx={{ color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                    >
                      Due:
                    </Typography>
                    <AppDateTimePicker
                      value={editDueAt}
                      onChange={val => setEditDueAt(val)}
                      slotProps={{
                        textField: {
                          size: 'small',
                          sx: {
                            width: 220,
                            '& .MuiOutlinedInput-root': {
                              bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                              borderRadius: '8px',
                              fontSize: '0.78rem',
                              height: 34,
                            },
                            '& input': {
                              p: '4px 8px',
                            },
                          },
                        },
                        field: { clearable: true, onClear: () => setEditDueAt('') },
                      }}
                    />
                  </Box>
                </Box>

                {/* Save / Close Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0.5 }}>
                  <Button
                    size='small'
                    onClick={onToggleExpand}
                    sx={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontSize: '0.78rem',
                      textTransform: 'none',
                      borderRadius: '6px',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    size='small'
                    onClick={handleSaveDetails}
                    sx={{
                      bgcolor: '#00BFA5',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '6px',
                      px: 2,
                      '&:hover': { bgcolor: '#00a38c' },
                    }}
                  >
                    Save Details
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Reorder.Item>
  );
};

const TodoCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const { data: todosData, isLoading } = useGetTodosQuery();
  const [createTodo] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const [reorderTodos] = useReorderTodosMutation();

  const todos = todosData?.data || [];
  const [items, setItems] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const sortTodos = todoList => {
    if (!Array.isArray(todoList)) return [];
    const pending = todoList.filter(t => !t.done);
    const completed = todoList.filter(t => Boolean(t.done));

    pending.sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));
    completed.sort((a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority));

    return [...pending, ...completed];
  };

  useEffect(() => {
    setItems(sortTodos(todos));
  }, [todos]);

  const handleAddTodo = async e => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    try {
      await createTodo({ title: text, isAiPrompt: false }).unwrap();
    } catch {
      // Handled by error boundary / RTK Query
    }
  };

  const handleReorder = newItems => {
    setItems(newItems);
    reorderTodos(newItems.map(item => item.id));
  };

  const toggleTodo = (id, done) => {
    const nextDone = !done;
    playTickSound(nextDone);
    const updated = items.map(t => (t.id === id ? { ...t, done: nextDone } : t));
    const sorted = sortTodos(updated);
    setItems(sorted);
    updateTodo({ id, done: nextDone });
  };

  const handleToggleExpand = id => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const pendingCount = items.filter(t => !t.done).length;

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
            pr: 4,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Typography
              variant='h6'
              sx={{ color: isDark ? '#E8EDF5' : '#0f172a', fontWeight: 700, fontSize: '1.1rem' }}
            >
              Tasks
            </Typography>
            {items.length > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                size='small'
                sx={{
                  height: 22,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(0, 191, 165, 0.15)' : 'rgba(0, 191, 165, 0.1)',
                  color: '#00BFA5',
                  border: '1px solid rgba(0, 191, 165, 0.25)',
                }}
              />
            )}
          </Box>
        </Box>

        {/* Input Form */}
        <Box component='form' onSubmit={handleAddTodo} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant='outlined'
            size='small'
            placeholder='Add a new task...'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton
                    type='submit'
                    disabled={!inputValue.trim()}
                    size='small'
                    sx={{
                      color: '#ffffff',
                      bgcolor: inputValue.trim() ? '#00BFA5' : 'transparent',
                      '&:hover': { bgcolor: '#00a38c' },
                      '&.Mui-disabled': {
                        color: isDark ? '#475569' : '#cbd5e1',
                        bgcolor: 'transparent',
                      },
                      transition: 'all 0.2s',
                      width: 28,
                      height: 28,
                    }}
                  >
                    <AddIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: isDark ? '#E8EDF5' : '#1e293b',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                borderRadius: '10px',
                fontSize: '0.9rem',
                transition: 'all 0.2s',
                '& fieldset': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(0, 191, 165, 0.4)',
                },
                '&.Mui-focused': {
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                  boxShadow: '0 0 0 3px rgba(0, 191, 165, 0.15)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#00BFA5',
                },
              },
            }}
          />
        </Box>

        {/* Task List */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            pr: 0.5,
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              borderRadius: '4px',
            },
          }}
        >
          {isLoading && (
            <CircularProgress
              size={24}
              sx={{ display: 'block', mx: 'auto', mt: 4, color: '#00BFA5' }}
            />
          )}

          <Reorder.Group
            as='div'
            axis='y'
            values={items}
            onReorder={handleReorder}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '2px',
              margin: 0,
              listStyle: 'none',
            }}
          >
            {items.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                toggleTodo={toggleTodo}
                deleteTodo={deleteTodo}
                updateTodo={updateTodo}
                isDark={isDark}
                isExpanded={expandedId === todo.id}
                onToggleExpand={() => handleToggleExpand(todo.id)}
              />
            ))}
          </Reorder.Group>

          {!isLoading && items.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
              <Typography
                variant='body2'
                sx={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }}
              >
                No tasks yet. Type above to add one!
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TodoCard;

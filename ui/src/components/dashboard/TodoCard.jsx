import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, IconButton, Checkbox, Chip, CircularProgress, InputAdornment } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { useGetTodosQuery, useCreateTodoMutation, useUpdateTodoMutation, useDeleteTodoMutation, useReorderTodosMutation } from '../../store/api/dashboardApi';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { useAppTheme } from '../../theme/useAppTheme';

const TodoItem = ({ todo, toggleTodo, deleteTodo, getPriorityColor, isDark }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={todo}
      id={todo.id}
      dragListener={false}
      dragControls={controls}
      style={{ listStyle: 'none', marginBottom: '10px', position: 'relative' }}
      whileDrag={{ scale: 1.02, zIndex: 10 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          p: 1.5,
          borderRadius: '12px',
          background: todo.done
            ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)')
            : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
          borderLeft: `4px solid ${getPriorityColor(todo.priority)}`,
          opacity: todo.done ? 0.6 : 1,
          transition: 'all 0.3s',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
        }}
      >
        <Box
          component="span"
          onPointerDown={(e) => controls.start(e)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            touchAction: 'none',
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)',
            mr: 0.5,
            mt: 0.25,
            userSelect: 'none',
            '&:hover': {
              color: '#00BFA5',
            },
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          <DragIcon sx={{ fontSize: 20 }} />
        </Box>
        <Checkbox
          checked={todo.done}
          onChange={() => toggleTodo(todo.id, todo.done)}
          sx={{
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            '&.Mui-checked': { color: '#00BFA5' },
            py: 0,
            mr: 0.5,
          }}
        />
        <Box sx={{ flexGrow: 1, ml: 0.5 }}>
          <Typography
            sx={{
              color: isDark ? '#E8EDF5' : '#334155',
              textDecoration: todo.done ? 'line-through' : 'none',
              fontSize: '0.95rem',
              wordBreak: 'break-word',
            }}
          >
            {todo.title}
          </Typography>
          {(todo.dueAt || todo.notifyAt) && (
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              {todo.dueAt && (
                <Chip
                  label={`Due: ${new Date(todo.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: isDark ? '#8899BB' : '#64748b',
                  }}
                />
              )}
            </Box>
          )}
        </Box>
        <IconButton
          onClick={() => deleteTodo(todo.id)}
          size="small"
          sx={{ color: 'rgba(239, 68, 68, 0.6)', '&:hover': { color: '#EF4444' } }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
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

  useEffect(() => {
    setItems(todos);
  }, [todos]);

  const handleAddTodo = async (e) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    setInputValue('');
    try {
      await createTodo({ title: text, isAiPrompt: false }).unwrap();
    } catch {
      // Ignored or handled by error boundary / RTK Query
    }
  };

  const handleReorder = (newItems) => {
    setItems(newItems);
    reorderTodos(newItems.map((item) => item.id));
  };

  const toggleTodo = (id, done) => {
    updateTodo({ id, done: !done });
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#10B981';
    }
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, pr: 4 }}>
          <Typography variant="h6" sx={{ color: isDark ? '#E8EDF5' : '#0f172a', fontWeight: 600 }}>
            Tasks
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleAddTodo} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Add a new task..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    type="submit"
                    disabled={!inputValue.trim()}
                    sx={{ color: '#00BFA5' }}
                    edge="end"
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: isDark ? '#E8EDF5' : '#334155',
                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                '& fieldset': { borderColor: isDark ? 'rgba(0,191,165,0.2)' : 'rgba(0,0,0,0.1)' },
                '&:hover fieldset': { borderColor: 'rgba(0,191,165,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#00BFA5' },
              }
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,191,165,0.2)', borderRadius: '4px' } }}>
          {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 4 }} />}
          
          <Reorder.Group
            as="div"
            axis="y"
            values={items}
            onReorder={handleReorder}
            style={{ listStyle: 'none', padding: 0, margin: 0 }}
          >
            <AnimatePresence initial={false}>
              {items.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  toggleTodo={toggleTodo}
                  deleteTodo={deleteTodo}
                  getPriorityColor={getPriorityColor}
                  isDark={isDark}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
          
          {!isLoading && items.length === 0 && (
            <Typography variant="body2" sx={{ color: isDark ? '#8899BB' : '#64748b', textAlign: 'center', mt: 4 }}>
              No tasks pending. Add one above!
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TodoCard;

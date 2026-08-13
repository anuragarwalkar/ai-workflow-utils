import { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, IconButton, Checkbox, Chip, CircularProgress } from '@mui/material';
import { Send as SendIcon, AutoAwesome as AiIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useGetTodosQuery, useCreateTodoMutation, useUpdateTodoMutation, useDeleteTodoMutation } from '../../store/api/dashboardApi';
import useNotifications from '../../hooks/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';

const TodoCard = ({ cardStyle }) => {
  const { data: todosData, isLoading } = useGetTodosQuery();
  const [createTodo, { isLoading: isCreating }] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  
  const todos = todosData?.data || [];
  const { permission, requestPermission } = useNotifications(todos);
  const [inputValue, setInputValue] = useState('');

  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (permission === 'default') {
      await requestPermission();
    }

    // Determine if it's an AI prompt (e.g. starts with "AI: " or similar, or just treat all as AI prompts if it's longer than a few words, or give a dedicated AI button)
    // For simplicity, we just send it as text and let the user flag it if it's AI
    // Let's send the raw text as AI prompt
    await createTodo({ text: inputValue, isAiPrompt: true }).unwrap();
    setInputValue('');
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#E8EDF5', fontWeight: 600 }}>
            Smart Tasks
          </Typography>
          <AiIcon sx={{ color: '#00BFA5', fontSize: 20 }} />
        </Box>

        <Box component="form" onSubmit={handleAddTodo} sx={{ mb: 3, position: 'relative' }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="E.g. remind me to review PR at 3pm..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isCreating}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#E8EDF5',
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                '& fieldset': { borderColor: 'rgba(0,191,165,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(0,191,165,0.4)' },
                '&.Mui-focused fieldset': { borderColor: '#00BFA5' },
              }
            }}
          />
          <IconButton 
            type="submit"
            disabled={isCreating || !inputValue.trim()}
            sx={{ position: 'absolute', right: 8, top: 8, color: '#00BFA5' }}
          >
            {isCreating ? <CircularProgress size={24} color="inherit" /> : <SendIcon fontSize="small" />}
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(0,191,165,0.2)', borderRadius: '4px' } }}>
          {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 4 }} />}
          
          <AnimatePresence>
            {todos.map(todo => (
              <motion.div
                key={todo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  p: 1.5, 
                  mb: 1.5,
                  borderRadius: '12px',
                  background: todo.done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  borderLeft: `4px solid ${getPriorityColor(todo.priority)}`,
                  opacity: todo.done ? 0.6 : 1,
                  transition: 'all 0.3s'
                }}>
                  <Checkbox 
                    checked={todo.done}
                    onChange={() => toggleTodo(todo.id, todo.done)}
                    sx={{ color: 'rgba(255,255,255,0.3)', '&.Mui-checked': { color: '#00BFA5' }, py: 0 }}
                  />
                  <Box sx={{ flexGrow: 1, ml: 1 }}>
                    <Typography sx={{ 
                      color: '#E8EDF5', 
                      textDecoration: todo.done ? 'line-through' : 'none',
                      fontSize: '0.95rem'
                    }}>
                      {todo.title}
                    </Typography>
                    {(todo.dueAt || todo.notifyAt) && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {todo.dueAt && (
                          <Chip label={`Due: ${new Date(todo.dueAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: 'rgba(255,255,255,0.1)', color: '#8899BB' }} />
                        )}
                      </Box>
                    )}
                  </Box>
                  <IconButton onClick={() => deleteTodo(todo.id)} size="small" sx={{ color: 'rgba(239, 68, 68, 0.6)', '&:hover': { color: '#EF4444' } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {!isLoading && todos.length === 0 && (
            <Typography variant="body2" sx={{ color: '#8899BB', textAlign: 'center', mt: 4 }}>
              No tasks pending. Add one above!
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TodoCard;

import { Box, Card, CardContent, Typography, IconButton, CircularProgress, Chip, Menu, MenuItem } from '@mui/material';
import { AccessTime as TimeIcon, MoreVert as MoreVertIcon, Check as CheckIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useGetRemindersQuery, useUpdateReminderMutation, useDeleteReminderMutation, useCreateReminderMutation } from '../../store/api/dashboardApi';
import { useAppTheme } from '../../theme/useAppTheme';
import { useState } from 'react';
import useNotifications from '../../hooks/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';

const ReminderCard = ({ cardStyle }) => {
  const { isDark } = useAppTheme();
  const { data: remindersData, isLoading } = useGetRemindersQuery();
  const [updateReminder] = useUpdateReminderMutation();
  const [deleteReminder] = useDeleteReminderMutation();
  const [createReminder, { isLoading: isCreating }] = useCreateReminderMutation();
  
  const reminders = (remindersData?.data || []).filter(r => r.status !== 'done');
  
  // Reuse the notifications hook to ensure browser notifications trigger
  const { permission, requestPermission } = useNotifications(reminders);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const handleMenuClick = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleMarkDone = (id) => {
    updateReminder({ id, status: 'done' });
    handleMenuClose();
  };

  const handleSnooze = (id, minutes) => {
    const newTime = new Date(Date.now() + minutes * 60000).toISOString();
    updateReminder({ id, remindAt: newTime });
    handleMenuClose();
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimeIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7C3AED' }}>
              Reminders
            </Typography>
          </Box>
          <IconButton size="small" sx={{ color: '#7C3AED', bgcolor: 'rgba(124, 58, 237, 0.1)' }}>
            <AddIcon fontSize="small" />
            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 600 }}>Add Reminder</Typography>
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 4 }} />}
          
          <AnimatePresence>
            {reminders.map(reminder => {
              const remindDate = reminder.remindAt ? new Date(reminder.remindAt) : null;
              const isPast = remindDate && remindDate < new Date();
              
              return (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Box sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <Box sx={{ 
                          width: 24, height: 24, borderRadius: '50%', 
                          bgcolor: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <TimeIcon sx={{ fontSize: 14 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 500, lineHeight: 1.3 }}>
                            {reminder.title}
                          </Typography>
                          {reminder.description && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                              {reminder.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {remindDate && (
                          <Chip 
                            icon={<TimeIcon sx={{ fontSize: 12 }} />} 
                            label={remindDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })} 
                            size="small" 
                            sx={{ 
                              height: 20, fontSize: '0.65rem', 
                              bgcolor: isPast ? 'rgba(239, 68, 68, 0.1)' : 'transparent', 
                              color: isPast ? '#ef4444' : '#64748b',
                              border: isPast ? 'none' : '1px solid rgba(100,116,139,0.2)'
                            }} 
                          />
                        )}
                        <IconButton size="small" onClick={(e) => handleMenuClick(e, reminder.id)}>
                          <MoreVertIcon fontSize="small" sx={{ color: '#64748b' }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, pl: 4 }}>
                      <Chip 
                        label="Snooze" 
                        size="small" 
                        onClick={() => handleSnooze(reminder.id, 60)} 
                        sx={{ bgcolor: 'transparent', border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', fontSize: '0.7rem' }} 
                      />
                      <Chip 
                        icon={<EditIcon sx={{ fontSize: 12 }} />} 
                        label="Edit" 
                        size="small" 
                        sx={{ bgcolor: 'transparent', border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', fontSize: '0.7rem' }} 
                      />
                      <Chip 
                        icon={<CheckIcon sx={{ fontSize: 12 }} />} 
                        label="Mark Done" 
                        size="small" 
                        onClick={() => handleMarkDone(reminder.id)}
                        sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: 'none', fontWeight: 600, fontSize: '0.7rem' }} 
                      />
                    </Box>
                  </Box>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!isLoading && reminders.length === 0 && (
            <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', mt: 4 }}>
              No active reminders.
            </Typography>
          )}
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleSnooze(selectedId, 15)}>Snooze 15m</MenuItem>
          <MenuItem onClick={() => handleSnooze(selectedId, 60)}>Snooze 1h</MenuItem>
          <MenuItem onClick={() => handleSnooze(selectedId, 1440)}>Snooze 1d</MenuItem>
          <MenuItem onClick={() => { deleteReminder(selectedId); handleMenuClose(); }} sx={{ color: '#ef4444' }}>Delete</MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
};

export default ReminderCard;

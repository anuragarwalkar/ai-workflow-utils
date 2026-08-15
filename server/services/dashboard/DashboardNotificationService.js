import reminderDbService from './ReminderDbService.js';
import todoDbService from './TodoDbService.js';
import notificationDbService from './NotificationDbService.js';
import systemNotifier from '../../utils/systemNotifier.js';
import logger from '../../logger.js';

class DashboardNotificationService {
  constructor() {
    this.io = null;
    this.checkInterval = null;
    this.isRunning = false;
    this.intervalMs = 5000; // Check every 5 seconds
  }

  init(ioInstance) {
    this.io = ioInstance;
    this.start();
    logger.info('🔔 DashboardNotificationService initialized with background scheduler');
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Run immediate check then start interval
    this.checkPendingNotifications().catch(err => {
      logger.error('Error during initial notification check:', err);
    });

    this.checkInterval = setInterval(() => {
      this.checkPendingNotifications().catch(err => {
        logger.error('Error in notification scheduler loop:', err);
      });
    }, this.intervalMs);
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    logger.info('DashboardNotificationService stopped');
  }

  async checkPendingNotifications() {
    const now = Date.now();

    try {
      // 1. Check Reminders
      const reminders = await reminderDbService.getReminders();
      for (const reminder of reminders) {
        // Skip done reminders or reminders without a scheduled time
        if (reminder.status === 'done' || !reminder.remindAt) continue;

        const targetTime = new Date(reminder.remindAt).getTime();
        if (isNaN(targetTime)) continue;

        // If time is due (targetTime <= now)
        if (targetTime <= now) {
          const alreadyNotified = await notificationDbService.hasNotificationForSource(
            reminder.id,
            reminder.remindAt
          );

          if (!alreadyNotified) {
            const notificationTitle = `⏰ Reminder: ${reminder.title}`;
            const notificationMsg =
              reminder.description || 'It is time for your scheduled reminder!';

            const notification = await notificationDbService.addNotification({
              title: notificationTitle,
              message: notificationMsg,
              type: 'reminder',
              severity: 'info',
              sourceId: reminder.id,
              sourceType: 'reminder',
              scheduledTime: reminder.remindAt,
              metadata: {
                reminderId: reminder.id,
                title: reminder.title,
                description: reminder.description,
              },
            });

            // Trigger OS System Desktop Notification (works when browser tab is closed)
            systemNotifier.notify({
              title: notificationTitle,
              message: notificationMsg,
              subtitle: 'AI Workflow Reminder',
            });

            // Emit live event to connected tabs via Socket.IO
            if (this.io) {
              this.io.emit('dashboard:notification', notification);
            }

            // Update reminder status to indicate notification has been triggered
            if (reminder.status === 'pending' || reminder.status === 'snoozed') {
              await reminderDbService.updateReminder(reminder.id, {
                status: 'triggered',
                lastNotifiedAt: new Date().toISOString(),
              });
            }
          }
        }
      }

      // 2. Check Todos (with notifyAt or dueAt)
      const todos = await todoDbService.getTodos();
      for (const todo of todos) {
        if (todo.done) continue;

        const timeStr = todo.notifyAt || todo.dueAt;
        if (!timeStr) continue;

        const targetTime = new Date(timeStr).getTime();
        if (isNaN(targetTime)) continue;

        if (targetTime <= now) {
          const alreadyNotified = await notificationDbService.hasNotificationForSource(
            todo.id,
            timeStr
          );

          if (!alreadyNotified) {
            const notificationTitle = `📋 Task Alert: ${todo.title}`;
            const notificationMsg = `Priority: ${todo.priority || 'Medium'}${
              todo.dueAt ? ` (Due: ${new Date(todo.dueAt).toLocaleTimeString()})` : ''
            }`;

            const notification = await notificationDbService.addNotification({
              title: notificationTitle,
              message: notificationMsg,
              type: 'todo',
              severity: todo.priority?.toLowerCase() === 'high' ? 'warning' : 'info',
              sourceId: todo.id,
              sourceType: 'todo',
              scheduledTime: timeStr,
              metadata: {
                todoId: todo.id,
                title: todo.title,
                priority: todo.priority,
              },
            });

            // Trigger OS System Desktop Notification
            systemNotifier.notify({
              title: notificationTitle,
              message: notificationMsg,
              subtitle: 'AI Workflow Task',
            });

            // Emit live event to connected tabs via Socket.IO
            if (this.io) {
              this.io.emit('dashboard:notification', notification);
            }

            await todoDbService.updateTodo(todo.id, {
              lastNotifiedAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch (err) {
      logger.error('Error checking pending notifications:', err);
    }
  }

  async triggerManualNotification({
    title = 'AI Workflow Notification',
    message = 'Test notification from server',
    type = 'system',
    severity = 'info',
    metadata = {},
  }) {
    const notification = await notificationDbService.addNotification({
      title,
      message,
      type,
      severity,
      metadata,
    });

    // Native desktop notification
    systemNotifier.notify({
      title,
      message,
      subtitle: 'AI Workflow Dashboard',
    });

    // Real-time WebSocket emission
    if (this.io) {
      this.io.emit('dashboard:notification', notification);
    }

    return notification;
  }
}

export default new DashboardNotificationService();

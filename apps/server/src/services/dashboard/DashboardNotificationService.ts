import { Server as SocketIOServer } from 'socket.io';
import reminderDbService from './ReminderDbService.ts';
import todoDbService from './TodoDbService.ts';
import notificationDbService, { NotificationRecord } from './NotificationDbService.ts';
import systemNotifier from '../../utils/systemNotifier.ts';
import logger from '../../logger.ts';

class DashboardNotificationService {
  io: SocketIOServer | null;
  checkInterval: NodeJS.Timeout | null;
  isRunning: boolean;
  intervalMs: number;

  constructor() {
    this.io = null;
    this.checkInterval = null;
    this.isRunning = false;
    this.intervalMs = 5000; // Check every 5 seconds
  }

  init(ioInstance: SocketIOServer): void {
    this.io = ioInstance;
    this.start();
    logger.info('🔔 DashboardNotificationService initialized with background scheduler');
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.checkPendingNotifications().catch(err => {
      logger.error('Error during initial notification check:', err);
    });

    this.checkInterval = setInterval(() => {
      this.checkPendingNotifications().catch(err => {
        logger.error('Error in notification scheduler loop:', err);
      });
    }, this.intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    logger.info('DashboardNotificationService stopped');
  }

  async checkPendingNotifications(): Promise<void> {
    const now = Date.now();

    try {
      // 1. Check Reminders
      const reminders = await reminderDbService.getReminders();
      for (const reminder of reminders) {
        if (reminder.status === 'done' || !reminder.remindAt) continue;

        const targetTime = new Date(reminder.remindAt).getTime();
        if (isNaN(targetTime)) continue;

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

            systemNotifier.notify({
              title: notificationTitle,
              message: notificationMsg,
              subtitle: 'AI Workflow Reminder',
            });

            if (this.io) {
              this.io.emit('dashboard:notification', notification);
            }

            if (reminder.status === 'pending' || reminder.status === 'snoozed') {
              await reminderDbService.updateReminder(reminder.id, {
                status: 'pending',
                ...{ lastNotifiedAt: new Date().toISOString() },
              });
            }
          }
        }
      }

      // 2. Check Todos
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

            systemNotifier.notify({
              title: notificationTitle,
              message: notificationMsg,
              subtitle: 'AI Workflow Task',
            });

            if (this.io) {
              this.io.emit('dashboard:notification', notification);
            }

            await todoDbService.updateTodo(todo.id, {
              ...{ lastNotifiedAt: new Date().toISOString() },
            });
          }
        }
      }
    } catch (err: any) {
      logger.error('Error checking pending notifications:', err);
    }
  }

  async triggerManualNotification({
    title = 'AI Workflow Notification',
    message = 'Test notification from server',
    type = 'system',
    severity = 'info',
    metadata = {},
  }: {
    title?: string;
    message?: string;
    type?: string;
    severity?: 'info' | 'success' | 'warning' | 'error';
    metadata?: Record<string, any>;
  }): Promise<NotificationRecord> {
    const notification = await notificationDbService.addNotification({
      title,
      message,
      type,
      severity,
      metadata,
    });

    systemNotifier.notify({
      title,
      message,
      subtitle: 'AI Workflow Dashboard',
    });

    if (this.io) {
      this.io.emit('dashboard:notification', notification);
    }

    return notification;
  }
}

export default new DashboardNotificationService();

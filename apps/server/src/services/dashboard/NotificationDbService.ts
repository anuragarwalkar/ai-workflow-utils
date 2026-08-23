import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../logger.ts';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  status: 'unread' | 'read' | 'dismissed';
  sourceId?: string | null;
  sourceType?: string | null;
  scheduledTime?: string;
  createdAt: string;
  readAt?: string | null;
  deliveredAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationDbSchema {
  notifications: NotificationRecord[];
}

class NotificationDbService {
  adapter: JSONFile<NotificationDbSchema>;
  db: Low<NotificationDbSchema>;

  constructor() {
    const homeDir = os.homedir();
    const configDir = path.join(homeDir, '.ai-workflow-utils');
    const dbPath = path.join(configDir, 'notifications.json');

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    this.adapter = new JSONFile<NotificationDbSchema>(dbPath);
    this.db = new Low<NotificationDbSchema>(this.adapter, { notifications: [] });
  }

  async init(): Promise<void> {
    await this.db.read();
    if (!this.db.data) {
      this.db.data = { notifications: [] };
      await this.db.write();
    }
  }

  async getNotifications(options: { status?: string; type?: string; limit?: number } = {}): Promise<NotificationRecord[]> {
    await this.init();
    let list = this.db.data.notifications || [];

    if (options.status) {
      list = list.filter(n => n.status === options.status);
    }
    if (options.type) {
      list = list.filter(n => n.type === options.type);
    }

    list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options.limit && typeof options.limit === 'number') {
      list = list.slice(0, options.limit);
    }

    return list;
  }

  async getUnreadCount(): Promise<number> {
    await this.init();
    const list = this.db.data.notifications || [];
    return list.filter(n => n.status === 'unread').length;
  }

  async addNotification(data: Partial<NotificationRecord>): Promise<NotificationRecord> {
    await this.init();
    const now = new Date().toISOString();
    const newNotification: NotificationRecord = {
      id: uuidv4(),
      title: data.title || 'Notification',
      message: data.message || '',
      type: data.type || 'system',
      severity: data.severity || 'info',
      status: 'unread',
      sourceId: data.sourceId || null,
      sourceType: data.sourceType || null,
      scheduledTime: data.scheduledTime || now,
      createdAt: now,
      readAt: null,
      deliveredAt: now,
      metadata: data.metadata || {},
    };

    this.db.data.notifications.unshift(newNotification);

    if (this.db.data.notifications.length > 200) {
      this.db.data.notifications = this.db.data.notifications.slice(0, 200);
    }

    await this.db.write();
    logger.info(`Recorded notification [${newNotification.id}]: ${newNotification.title}`);
    return newNotification;
  }

  async markAsRead(id: string): Promise<NotificationRecord> {
    await this.init();
    const item = (this.db.data.notifications || []).find(n => n.id === id);
    if (!item) {
      throw new Error(`Notification with id ${id} not found`);
    }

    item.status = 'read';
    item.readAt = new Date().toISOString();
    await this.db.write();
    return item;
  }

  async markAllAsRead(): Promise<boolean> {
    await this.init();
    const now = new Date().toISOString();
    (this.db.data.notifications || []).forEach(n => {
      if (n.status === 'unread') {
        n.status = 'read';
        n.readAt = now;
      }
    });
    await this.db.write();
    return true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    await this.init();
    const initialLength = (this.db.data.notifications || []).length;
    this.db.data.notifications = this.db.data.notifications.filter(n => n.id !== id);

    if (this.db.data.notifications.length !== initialLength) {
      await this.db.write();
      return true;
    }
    return false;
  }

  async clearAllNotifications(): Promise<boolean> {
    await this.init();
    this.db.data.notifications = [];
    await this.db.write();
    return true;
  }

  async hasNotificationForSource(sourceId: string, scheduledTime?: string | null): Promise<boolean> {
    await this.init();
    return (this.db.data.notifications || []).some(n => {
      if (n.sourceId !== sourceId) return false;
      if (!scheduledTime || !n.scheduledTime) return true;
      return new Date(n.scheduledTime).getTime() === new Date(scheduledTime).getTime();
    });
  }
}

export default new NotificationDbService();

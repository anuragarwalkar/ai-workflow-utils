class NotificationService {
  constructor() {
    this.permission = 'default';
    this.init();
  }

  async init() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission;
    }
    return 'denied';
  }

  isSupported() {
    return 'Notification' in window;
  }

  canShow() {
    return this.isSupported() && this.permission === 'granted';
  }

  show(title, options = {}) {
    if (!this.canShow()) {
      return null;
    }

    const defaultOptions = {
      icon: '/ai-favicon.svg',
      badge: '/ai-favicon.svg',
      requireInteraction: true,
      tag: 'ai-workflow-utils',
      ...options,
    };

    const notification = new Notification(title, defaultOptions);
    
    // Auto-close after 5 seconds unless requireInteraction is true
    if (!defaultOptions.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 5000);
    }

    return notification;
  }

  showCronJobSuccess(jobName) {
    return this.show(`Build Job Completed`, {
      body: `The scheduled build "${jobName}" has completed successfully.`,
      icon: '/icons/icon-192x192.png',
      tag: 'cron-job-success',
      requireInteraction: false,
    });
  }

  showCronJobFailure(jobName, error) {
    return this.show(`Build Job Failed`, {
      body: `The scheduled build "${jobName}" has failed: ${error}`,
      icon: '/icons/icon-192x192.png',
      tag: 'cron-job-failure',
      requireInteraction: true,
    });
  }

  showCronJobStarted(jobName) {
    return this.show(`Build Job Started`, {
      body: `The scheduled build "${jobName}" has started.`,
      icon: '/icons/icon-192x192.png',
      tag: 'cron-job-started',
      requireInteraction: false,
    });
  }
}

export default new NotificationService();
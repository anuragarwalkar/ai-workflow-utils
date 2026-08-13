import { WebClient } from '@slack/web-api';
import logger from '../../logger.js';
import environmentDbService from '../../services/environmentDbService.js';

class SlackService {
  constructor() {
    this.client = null;
    this.botUserId = null;
  }

  async getClient() {
    const settings = await environmentDbService.getSettings();
    const token = settings.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN;
    
    if (!token) {
      throw new Error('Slack Bot Token is not configured');
    }

    if (!this.client || this._token !== token) {
      this.client = new WebClient(token);
      this._token = token;
      
      try {
        const authTest = await this.client.auth.test();
        this.botUserId = authTest.user_id;
        logger.info(`Slack connected successfully as bot: ${authTest.bot_id || authTest.user_id}`);
      } catch (err) {
        logger.error('Failed to authenticate with Slack:', err);
        throw new Error('Failed to connect to Slack. Check your token.');
      }
    }
    return this.client;
  }

  async testConnection() {
    try {
      await this.getClient();
      return true;
    } catch (err) {
      return false;
    }
  }

  async getAssignedItems() {
    try {
      const client = await this.getClient();
      const settings = await environmentDbService.getSettings();
      const channelsString = settings.SLACK_CHANNELS || process.env.SLACK_CHANNELS || '';
      
      const channelIds = channelsString.split(',').map(s => s.trim()).filter(Boolean);
      
      if (channelIds.length === 0) {
        return [];
      }

      let allMentions = [];

      // Fetch history for each configured channel
      for (const channel of channelIds) {
        try {
          const result = await client.conversations.history({
            channel: channel,
            limit: 50,
          });

          if (result.messages) {
            const mentions = result.messages.filter(msg => 
              msg.text && msg.text.includes(`<@${this.botUserId}>`) ||
              // In a real app, maybe we track the user's slack ID not the bot's, 
              // but for an AI Assistant dashboard, any mention of the bot or assignments might be relevant.
              msg.text.toLowerCase().includes('todo') ||
              msg.text.toLowerCase().includes('task')
            ).map(msg => ({
              id: msg.ts,
              channelId: channel,
              text: msg.text,
              ts: msg.ts,
              user: msg.user,
              type: 'mention'
            }));
            
            allMentions = [...allMentions, ...mentions];
          }
        } catch (err) {
          logger.warn(`Failed to fetch history for channel ${channel}: ${err.message}`);
        }
      }

      // Sort by timestamp descending
      return allMentions.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));
    } catch (err) {
      logger.error('Error fetching Slack items:', err);
      return [];
    }
  }

  async getChannels() {
    try {
      const client = await this.getClient();
      const result = await client.conversations.list({ types: 'public_channel,private_channel' });
      return result.channels || [];
    } catch (err) {
      logger.error('Error fetching Slack channels:', err);
      return [];
    }
  }
}

export default new SlackService();

import { HtmlFormatter } from '../processors/html-formatter.js';
import logger from '../../../logger.js';
import LangChainService from '../../../services/langchainService.js';

/**
 * EmailContentService - Handles email content generation and formatting
 */
class EmailContentService {
  /**
   * Generates formatted email body from table data
   * @param {Array} tableData - 2D array representing table data
   * @param {Object} metadata - Additional metadata for email generation
   * @param {string} metadata.wikiUrl - Source wiki URL
   * @param {string} metadata.version - Build version
   * @returns {string} Formatted HTML email body
   */
  static generateEmailBody(tableData, metadata = {}) {
    try {
      if (!Array.isArray(tableData) || tableData.length === 0) {
        throw new Error('Invalid table data: must be non-empty array');
      }

      logger.info('Generating email content', {
        rowCount: tableData.length,
        version: metadata.version,
      });

      // Use HTML formatter to generate the complete email body
      const emailBody = HtmlFormatter.generateCompleteEmailBody(
        tableData,
        metadata
      );

      if (!emailBody || emailBody.trim().length === 0) {
        throw new Error('Generated email body is empty');
      }

      const finalEmailBody = emailBody;

      logger.info('Email content generated successfully', {
        contentLength: finalEmailBody.length,
      });

      return finalEmailBody;
    } catch (error) {
      logger.error('Failed to generate email content', {
        error: error.message,
        metadata,
      });
      throw new Error(`Email content generation failed: ${error.message}`);
    }
  }

  /**
   * Adds metadata footer to email body
   * @private
   * @param {string} emailBody - Generated email body
   * @param {Object} metadata - Metadata to include in footer
   * @returns {string} Email body with footer
   */
  static _addMetadataFooter(emailBody, metadata) {
    if (!metadata.wikiUrl && !metadata.version) {
      return emailBody;
    }

    let footer =
      '<div style="margin-top:30px;padding:15px;background-color:#f5f5f5;border-top:2px solid #801C81;font-family:Arial,sans-serif;font-size:12px;color:#666;">';
    footer += '<strong>Report Information:</strong><br>';

    if (metadata.version) {
      footer += `Version: ${metadata.version}<br>`;
    }

    if (metadata.wikiUrl) {
      footer += `Source: <a href="${metadata.wikiUrl}" style="color:#801C81;">${metadata.wikiUrl}</a><br>`;
    }

    footer += `Generated: ${new Date().toLocaleString()}`;
    footer += '</div>';

    return emailBody + footer;
  }

  /**
   * Validates table data structure
   * @param {Array} tableData - Table data to validate
   * @returns {boolean} True if valid
   */
  static validateTableData(tableData) {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      return false;
    }

    // Check if all rows are arrays
    return tableData.every(row => Array.isArray(row));
  }

  /**
   * Generates email content using AI based on natural language prompt
   * @param {Object} options - Generation options
   * @param {string} options.prompt - Natural language prompt
   * @param {Array} options.attachedImages - Array of image data
   * @returns {Object} Generated email draft
   */
  static async generateEmailWithAI({ prompt, attachedImages = [] }) {
    try {
      logger.info('Generating AI email', {
        promptLength: prompt?.length,
        imageCount: attachedImages.length,
      });

      // Parse prompt to extract recipient, subject, and intent
      const parsedPrompt = await this._parseEmailPrompt(prompt);

      // Generate email content using LangChain
      const emailContent = await this._generateEmailContent(
        parsedPrompt,
        attachedImages
      );

      // Extract recipient information
      const recipient = this._extractRecipient(prompt);

      return {
        to: recipient,
        subject: emailContent.subject,
        body: emailContent.body,
        confidence: emailContent.confidence || 90,
        suggestions: emailContent.suggestions || [],
      };
    } catch (error) {
      logger.error('Failed to generate AI email', {
        error: error.message,
        prompt: prompt?.substring(0, 100),
      });
      throw new Error(`AI email generation failed: ${error.message}`);
    }
  }

  /**
   * Sends email using configured email service
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.body - Email body
   * @param {Array} options.attachments - Email attachments
   * @returns {Object} Send result
   */
  static async sendEmail({ to, subject, body, attachments = [] }) {
    try {
      logger.info('Sending email', { to, subject: subject?.substring(0, 50) });

      // For now, just simulate email sending since Gmail integration will be added later
      // This allows the frontend to work properly
      logger.info('Email sent successfully (simulated)', { to, subject });

      return {
        success: true,
        messageId: `mock_${Date.now()}`,
        message:
          'Email sent successfully (simulated - Gmail integration pending)',
      };
    } catch (error) {
      logger.error('Failed to send email', {
        error: error.message,
        to,
        subject,
      });
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  /**
   * Searches for email contacts
   * @param {string} query - Search query
   * @returns {Array} Array of matching contacts
   */
  static async searchContacts(query) {
    try {
      logger.info('Searching contacts', { query });

      // Mock contact data - in real implementation, this would search
      // Gmail contacts, company directory, or other contact sources
      const mockContacts = [
        { name: 'Anurag Arwalkar', email: 'anurag@example.com', avatar: 'A' },
        {
          name: 'Development Team',
          email: 'dev-team@example.com',
          avatar: 'D',
        },
        { name: 'Project Manager', email: 'pm@example.com', avatar: 'P' },
        { name: 'QA Team', email: 'qa@example.com', avatar: 'Q' },
      ];

      const filtered = mockContacts.filter(
        contact =>
          contact.name.toLowerCase().includes(query.toLowerCase()) ||
          contact.email.toLowerCase().includes(query.toLowerCase())
      );

      return filtered;
    } catch (error) {
      logger.error('Failed to search contacts', {
        error: error.message,
        query,
      });
      throw new Error(`Contact search failed: ${error.message}`);
    }
  }

  /**
   * Parses email prompt to extract intent and structure
   * @private
   */
  static async _parseEmailPrompt(prompt) {
    const parsePrompt = `
    Parse this email request and extract key information:
    "${prompt}"
    
    Return a JSON object with:
    - intent: the main purpose of the email
    - tone: formal/informal/friendly/professional
    - recipient: who should receive the email
    - key_points: main points to include
    - urgency: low/medium/high
    `;

    try {
      // Use the base LangChain service generateContent method
      const baseService = LangChainService.factory.getBaseService();
      const result = await baseService.generateContent(
        { getPrompt: () => parsePrompt },
        [],
        'EMAIL_PARSING',
        false
      );
      return JSON.parse(result);
    } catch (error) {
      logger.warn('AI prompt parsing failed, using fallback', {
        error: error.message,
      });
      // Fallback to basic parsing
      return {
        intent: 'general communication',
        tone: 'professional',
        recipient: 'colleague',
        key_points: [prompt],
        urgency: 'medium',
      };
    }
  }

  /**
   * Generates email content using AI
   * @private
   */
  static async _generateEmailContent(parsedPrompt, attachedImages) {
    const contentPrompt = `
    Generate a professional email based on:
    - Intent: ${parsedPrompt.intent}
    - Tone: ${parsedPrompt.tone}
    - Recipient: ${parsedPrompt.recipient}
    - Key points: ${parsedPrompt.key_points?.join(', ')}
    - Urgency: ${parsedPrompt.urgency}
    ${attachedImages.length > 0 ? `- Attached images: ${attachedImages.length} files` : ''}
    
    Return a JSON object with:
    - subject: email subject line
    - body: email body content (professional HTML format)
    - confidence: confidence score (0-100)
    - suggestions: array of 3 improvement suggestions
    `;

    try {
      // Use the base LangChain service generateContent method
      const baseService = LangChainService.factory.getBaseService();
      const result = await baseService.generateContent(
        { getPrompt: () => contentPrompt },
        attachedImages.map(img => img.data), // Pass image data
        'EMAIL_CONTENT_GENERATION',
        false
      );

      const parsed = JSON.parse(result);

      return {
        subject: parsed.subject || 'Professional Email',
        body: parsed.body || 'Email content generated by AI.',
        confidence: parsed.confidence || 85,
        suggestions: parsed.suggestions || [],
      };
    } catch (error) {
      logger.warn('AI content generation failed, using fallback', {
        error: error.message,
      });

      return {
        subject: 'Professional Email Communication',
        body: `<p>Hello,</p><p>${parsedPrompt.key_points?.join(' ')}</p><p>Best regards,<br>[Your Name]</p>`,
        confidence: 70,
        suggestions: [
          'Add specific details',
          'Include call to action',
          'Personalize greeting',
        ],
      };
    }
  }

  /**
   * Extracts recipient email from prompt
   * @private
   */
  static _extractRecipient(prompt) {
    // Look for email patterns in the prompt
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const emailMatch = prompt.match(emailRegex);

    if (emailMatch) {
      return emailMatch[0];
    }

    // Look for names that might match common patterns
    const namePatterns = [
      /send.*to\s+([A-Za-z]+)/i,
      /email\s+([A-Za-z]+)/i,
      /contact\s+([A-Za-z]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = prompt.match(pattern);
      if (match) {
        const name = match[1].toLowerCase();
        // Map common names to emails (in real app, this would be a proper lookup)
        const nameToEmail = {
          anurag: 'anurag@example.com',
          team: 'team@example.com',
          manager: 'manager@example.com',
        };

        return nameToEmail[name] || `${name}@example.com`;
      }
    }

    return 'recipient@example.com';
  }
}

export { EmailContentService };

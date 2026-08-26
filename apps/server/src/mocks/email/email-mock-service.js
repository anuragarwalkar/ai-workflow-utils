/**
 * Email Mock Service
 * Example implementation of email service mocking using nock
 */

import {
  createMockService,
  createScope,
  createSuccessResponse,
  delay,
} from '../core/nock-mock-service.js';
import logger from '../../logger.js';

// Mock email state
let emailState = {
  sentEmails: [],
  emailCounter: 1,
};

// Pure functions for email state management
const getEmailState = () => ({ ...emailState });

const updateEmailState = updates => {
  emailState = { ...emailState, ...updates };
  return getEmailState();
};

// Helper functions
const createMockEmail = emailData => {
  const currentState = getEmailState();
  const emailId = `EMAIL-${currentState.emailCounter}`;

  updateEmailState({ emailCounter: currentState.emailCounter + 1 });

  const email = {
    id: emailId,
    to: emailData.to,
    from: emailData.from || 'noreply@mock-service.com',
    subject: emailData.subject,
    body: emailData.body,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  const newSentEmails = [...currentState.sentEmails, email];
  updateEmailState({ sentEmails: newSentEmails });

  return email;
};

// Setup email interceptors
const setupEmailInterceptors = (baseURL, _config = {}) => {
  logger.info(`Setting up Email mock interceptors for ${baseURL}`);

  const interceptors = [];

  // Send email
  const sendEmailInterceptor = createScope(baseURL)
    .post('/api/email/send')
    .reply(async (_uri, requestBody) => {
      await delay(200); // Simulate email sending delay

      const email = createMockEmail(requestBody);
      logger.info(`Mock Email: Sent email ${email.id} to ${email.to}`);

      return [200, createSuccessResponse(email)];
    })
    .persist();
  interceptors.push(sendEmailInterceptor);

  // Get sent emails
  const getSentEmailsInterceptor = createScope(baseURL)
    .get('/api/email/sent')
    .reply(200, () => {
      const currentState = getEmailState();
      return createSuccessResponse(currentState.sentEmails);
    })
    .persist();
  interceptors.push(getSentEmailsInterceptor);

  logger.info(`Email mock service: ${interceptors.length} interceptors active`);
  return interceptors;
};

// Export the Email mock service
export const emailMockService = createMockService(
  'email',
  'https://mock-email.service.com',
  setupEmailInterceptors
);

// Export utilities
export { createMockEmail, getEmailState, updateEmailState };

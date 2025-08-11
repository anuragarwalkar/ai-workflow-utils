/**
 * Integration Example: Using Nock Mock System in Application Code
 * Shows practical usage patterns for different scenarios
 */

import { enableMockingForFeature, testUtils } from './server/mocks/index.js';
import { createScope, enableService } from './server/mocks/core/nock-mock-service.js';

// ========== DEVELOPMENT USAGE ==========

// In your main application startup (e.g., server.js)
// import './server/mocks/index.js'; // Auto-initializes based on environment

// The system will automatically enable mocking based on:
// MOCK_MODE=true (enables all services)
// MOCK_SERVICES=jira,email (enables specific services)

// ========== FEATURE DEVELOPMENT ==========

// When developing a new feature that needs Jira integration
export const developNewFeature = async () => {
  // Enable mocking just for this feature development
  const mockContext = enableMockingForFeature(['jira']);
  
  try {
    // Your feature code - API calls will be automatically mocked
    const response = await fetch('https://your-jira-instance.atlassian.net/rest/api/2/issue', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: { key: 'MOCK' },
          summary: 'Test issue from feature',
          issuetype: { id: '10001' },
        },
      }),
    });
    
    const issue = await response.json();
    console.log('Created issue:', issue.key);
    
    return issue;
  } finally {
    // Clean up mocking when done
    mockContext.disable();
  }
};

// ========== TESTING HELPER FUNCTIONS ==========

// Setup for test files (use in your test setup)
export const setupTestMocks = (services) => {
  return testUtils.setupMocks(services);
};

export const teardownTestMocks = () => {
  testUtils.teardownMocks();
};

export const verifyTestMockState = (expectedServices) => {
  return testUtils.verifyMockState(expectedServices);
};

// ========== CONDITIONAL MOCKING ==========

// Sometimes you want to mock only certain services in production for testing
export const enableTestingMode = (services = []) => {
  if (process.env.NODE_ENV === 'production' && process.env.TESTING_MODE === 'true') {
    services.forEach(service => {
      enableService(service);
      console.log(`Enabled ${service} mocking for production testing`);
    });
  }
};

// ========== CUSTOM INTERCEPTORS ==========

// Add custom behavior to existing services
export const addCustomJiraInterceptor = () => {
  const customInterceptor = createScope('https://your-jira-instance.atlassian.net')
    .get('/rest/api/2/issue/SPECIAL-123')
    .reply(200, {
      id: 'special-123',
      key: 'SPECIAL-123',
      fields: {
        summary: 'Special custom response',
        status: { name: 'Custom Status' },
      },
    })
    .persist();

  return customInterceptor;
};

// ========== APPLICATION SERVICE FUNCTIONS ==========

// Your existing Jira service functions work unchanged
export const createJiraIssue = async (issueData) => {
  const response = await fetch('https://your-jira-instance.atlassian.net/rest/api/2/issue', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.JIRA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(issueData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create issue: ${response.status}`);
  }

  return response.json();
};

export const addJiraComment = async (issueKey, commentData) => {
  const response = await fetch(
    `https://your-jira-instance.atlassian.net/rest/api/2/issue/${issueKey}/comment`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.JIRA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    },
  );

  return response.json();
};

export const searchJiraIssues = async (jql) => {
  const url = new URL('https://your-jira-instance.atlassian.net/rest/api/2/search');
  url.searchParams.set('jql', jql);

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${process.env.JIRA_TOKEN}`,
    },
  });

  return response.json();
};

export const sendNotificationEmail = async (emailData) => {
  const response = await fetch('https://your-email-service.com/api/email/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EMAIL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData),
  });

  return response.json();
};

// ========== DEBUGGING HELPERS ==========

export const debugMockState = () => {
  // Dynamic import to avoid circular dependencies
  const { getCurrentState, getActiveServices } = require('./server/mocks/core/nock-mock-service.js');
  
  const state = getCurrentState();
  console.log('=== Mock State Debug ===');
  console.log('Global Mock Mode:', state.globalMockMode);
  console.log('Active Services:', getActiveServices());
  console.log('Total Services:', state.services.size);
  console.log('Active Interceptors:', state.interceptors.size);
  console.log('=======================');
};

// ========== WORKFLOW EXAMPLES ==========

export const exampleWorkflow = async () => {
  // Example: Complete feature workflow with mocking
  const mockContext = enableMockingForFeature(['jira', 'email']);

  try {
    // Step 1: Create Jira issue
    const issue = await createJiraIssue({
      fields: {
        project: { key: 'MOCK' },
        summary: 'Workflow test issue',
        issuetype: { id: '10001' },
      },
    });

    // Step 2: Add comment
    await addJiraComment(issue.key, {
      body: 'Workflow initiated successfully',
    });

    // Step 3: Send notification
    await sendNotificationEmail({
      to: 'team@example.com',
      subject: `Issue ${issue.key} created`,
      body: `Issue ${issue.key} has been created and is ready for review.`,
    });

    console.log('Workflow completed successfully');
    return { success: true, issueKey: issue.key };
  } catch (error) {
    console.error('Workflow failed:', error);
    return { success: false, error: error.message };
  } finally {
    mockContext.disable();
  }
};

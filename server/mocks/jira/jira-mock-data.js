/**
 * Jira Mock Data
 * Immutable mock data structures for Jira API responses
 */

// Mock data - immutable state
export const mockData = {
  projects: new Map([
    ['MOCK', {
      id: '10000',
      key: 'MOCK',
      name: 'Mock Project',
      description: 'A mock project for testing',
      projectTypeKey: 'software',
      lead: {
        accountId: 'mock-lead-id',
        displayName: 'Mock Lead',
        emailAddress: 'lead@example.com',
      },
    }],
  ]),
  issueTypes: [
    { 
      id: '10001', 
      name: 'Bug', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/issuetypes/bug.png',
    },
    { 
      id: '10002', 
      name: 'Task', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/issuetypes/task.png',
    },
    { 
      id: '10003', 
      name: 'Story', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/issuetypes/story.png',
    },
  ],
  priorities: [
    { 
      id: '1', 
      name: 'Highest', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/highest.svg',
    },
    { 
      id: '2', 
      name: 'High', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/high.svg',
    },
    { 
      id: '3', 
      name: 'Medium', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/medium.svg',
    },
    { 
      id: '4', 
      name: 'Low', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/low.svg',
    },
    { 
      id: '5', 
      name: 'Lowest', 
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/lowest.svg',
    },
  ],
  statuses: [
    { 
      id: '1', 
      name: 'Open', 
      statusCategory: { id: 2, name: 'To Do', colorName: 'blue-gray' },
    },
    { 
      id: '2', 
      name: 'In Progress', 
      statusCategory: { id: 4, name: 'In Progress', colorName: 'yellow' },
    },
    { 
      id: '3', 
      name: 'Done', 
      statusCategory: { id: 3, name: 'Done', colorName: 'green' },
    },
  ],
  users: new Map([
    ['mock-user-1', {
      accountId: 'mock-user-1',
      displayName: 'Mock User One',
      emailAddress: 'user1@example.com',
    }],
    ['mock-user-2', {
      accountId: 'mock-user-2',
      displayName: 'Mock User Two',
      emailAddress: 'user2@example.com',
    }],
  ]),
  issues: new Map(),
  comments: new Map(),
  attachments: new Map(),
};

// State management
let jiraState = {
  issueCounter: 1000,
  commentCounter: 100,
  attachmentCounter: 10,
};

// Pure functions for state management
export const getJiraState = () => ({ ...jiraState });

export const updateJiraState = (updates) => {
  jiraState = { ...jiraState, ...updates };
  return getJiraState();
};

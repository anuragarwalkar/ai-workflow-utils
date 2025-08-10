/**
 * Mock data for Jira API responses
 */

/**
 * Mock Jira issue creation response
 */
export const mockCreateIssueResponse = {
  id: '10001',
  key: 'MOCK-123',
  self: 'https://mock-jira.atlassian.net/rest/api/2/issue/10001',
  expand: 'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations',
  fields: {
    summary: 'Mock Issue Created',
    description: 'This is a mock issue created for testing purposes',
    issuetype: {
      id: '10001',
      name: 'Bug',
      iconUrl: 'https://mock-jira.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10303&avatarType=issuetype',
    },
    status: {
      id: '1',
      name: 'Open',
      statusCategory: {
        id: 2,
        name: 'To Do',
        colorName: 'blue-gray',
      },
    },
    priority: {
      id: '3',
      name: 'Medium',
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/medium.svg',
    },
    assignee: null,
    reporter: {
      accountId: 'mock-account-id',
      displayName: 'Mock Reporter',
      emailAddress: 'mock@example.com',
    },
    project: {
      id: '10000',
      key: 'MOCK',
      name: 'Mock Project',
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
};

/**
 * Mock Jira issue details response
 */
export const mockIssueDetailsResponse = {
  id: '10001',
  key: 'MOCK-123',
  self: 'https://mock-jira.atlassian.net/rest/api/2/issue/10001',
  expand: 'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations',
  fields: {
    summary: 'Mock Issue for Testing',
    description: {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'This is a detailed mock issue used for testing the Jira integration without making actual API calls.',
            },
          ],
        },
      ],
    },
    issuetype: {
      id: '10001',
      name: 'Bug',
      subtask: false,
      iconUrl: 'https://mock-jira.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10303&avatarType=issuetype',
    },
    status: {
      id: '1',
      name: 'Open',
      statusCategory: {
        id: 2,
        name: 'To Do',
        colorName: 'blue-gray',
      },
    },
    priority: {
      id: '3',
      name: 'Medium',
      iconUrl: 'https://mock-jira.atlassian.net/images/icons/priorities/medium.svg',
    },
    assignee: {
      accountId: 'mock-assignee-id',
      displayName: 'Mock Assignee',
      emailAddress: 'assignee@example.com',
    },
    reporter: {
      accountId: 'mock-reporter-id',
      displayName: 'Mock Reporter',
      emailAddress: 'reporter@example.com',
    },
    project: {
      id: '10000',
      key: 'MOCK',
      name: 'Mock Project',
      projectTypeKey: 'software',
    },
    fixVersions: [],
    components: [],
    labels: ['mock', 'testing'],
    environment: 'Mock Environment',
    duedate: null,
    created: '2025-01-01T00:00:00.000+0000',
    updated: new Date().toISOString(),
    resolutiondate: null,
    watches: {
      self: 'https://mock-jira.atlassian.net/rest/api/2/issue/MOCK-123/watchers',
      watchCount: 1,
      isWatching: false,
    },
    worklog: {
      startAt: 0,
      maxResults: 20,
      total: 0,
      worklogs: [],
    },
    attachments: [],
    comment: {
      comments: [],
      maxResults: 50,
      total: 0,
      startAt: 0,
    },
  },
};

/**
 * Mock Jira summaries response for multiple issues
 */
export const mockJiraSummariesResponse = {
  'MOCK-123': {
    key: 'MOCK-123',
    summary: 'Mock Issue for Testing',
    status: 'Open',
    assignee: 'Mock Assignee',
    priority: 'Medium',
    issuetype: 'Bug',
  },
  'MOCK-124': {
    key: 'MOCK-124',
    summary: 'Another Mock Issue',
    status: 'In Progress',
    assignee: 'Another Assignee',
    priority: 'High',
    issuetype: 'Story',
  },
  'MOCK-125': {
    key: 'MOCK-125',
    summary: 'Third Mock Issue',
    status: 'Done',
    assignee: 'Third Assignee',
    priority: 'Low',
    issuetype: 'Task',
  },
};

/**
 * Mock attachment upload response
 */
export const mockAttachmentResponse = [
  {
    id: 'mock-attachment-id-1',
    filename: 'mock-screenshot.png',
    author: {
      accountId: 'mock-account-id',
      displayName: 'Mock User',
      emailAddress: 'mock@example.com',
    },
    created: new Date().toISOString(),
    size: 12345,
    mimeType: 'image/png',
    content: 'https://mock-jira.atlassian.net/secure/attachment/mock-attachment-id-1/mock-screenshot.png',
    thumbnail: 'https://mock-jira.atlassian.net/secure/thumbnail/mock-attachment-id-1/mock-screenshot.png',
  },
];

/**
 * Mock search results response
 */
export const mockSearchResponse = {
  expand: 'names,schema',
  startAt: 0,
  maxResults: 50,
  total: 3,
  issues: [
    {
      expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
      id: '10001',
      self: 'https://mock-jira.atlassian.net/rest/api/2/issue/10001',
      key: 'MOCK-123',
      fields: {
        summary: 'Mock Issue for Testing',
        status: {
          name: 'Open',
          statusCategory: { name: 'To Do' },
        },
        assignee: {
          displayName: 'Mock Assignee',
        },
        priority: {
          name: 'Medium',
        },
        issuetype: {
          name: 'Bug',
        },
      },
    },
    {
      expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
      id: '10002',
      self: 'https://mock-jira.atlassian.net/rest/api/2/issue/10002',
      key: 'MOCK-124',
      fields: {
        summary: 'Another Mock Issue',
        status: {
          name: 'In Progress',
          statusCategory: { name: 'In Progress' },
        },
        assignee: {
          displayName: 'Another Assignee',
        },
        priority: {
          name: 'High',
        },
        issuetype: {
          name: 'Story',
        },
      },
    },
  ],
};



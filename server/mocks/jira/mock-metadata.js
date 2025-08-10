/**
 * Mock error responses and metadata for Jira API
 */

/**
 * Mock error responses for different scenarios
 */
export const mockErrorResponses = {
  unauthorized: {
    status: 401,
    data: {
      errorMessages: ['The user is not authenticated.'],
      errors: {},
    },
  },
  forbidden: {
    status: 403,
    data: {
      errorMessages: ['The user does not have permission to perform this operation.'],
      errors: {},
    },
  },
  notFound: {
    status: 404,
    data: {
      errorMessages: ['Issue does not exist or you do not have permission to see it.'],
      errors: {},
    },
  },
  badRequest: {
    status: 400,
    data: {
      errorMessages: ['Field \'summary\' is required.'],
      errors: {
        summary: 'Summary is required',
      },
    },
  },
  serverError: {
    status: 500,
    data: {
      errorMessages: ['Internal server error occurred.'],
      errors: {},
    },
  },
};

/**
 * Mock project metadata
 */
export const mockProjectMetadata = {
  id: '10000',
  key: 'MOCK',
  name: 'Mock Project',
  projectTypeKey: 'software',
  issuetypes: [
    {
      id: '10001',
      name: 'Bug',
      subtask: false,
      iconUrl: 'https://mock-jira.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10303&avatarType=issuetype',
    },
    {
      id: '10002',
      name: 'Story',
      subtask: false,
      iconUrl: 'https://mock-jira.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10315&avatarType=issuetype',
    },
    {
      id: '10003',
      name: 'Task',
      subtask: false,
      iconUrl: 'https://mock-jira.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10318&avatarType=issuetype',
    },
  ],
  components: [
    {
      id: '10000',
      name: 'Frontend',
      description: 'Frontend components',
    },
    {
      id: '10001',
      name: 'Backend',
      description: 'Backend services',
    },
  ],
  versions: [
    {
      id: '10000',
      name: '1.0.0',
      released: true,
      releaseDate: '2025-01-01',
    },
    {
      id: '10001',
      name: '1.1.0',
      released: false,
    },
  ],
};

/**
 * Mock user data
 */
export const mockUsers = {
  'mock-reporter-id': {
    accountId: 'mock-reporter-id',
    displayName: 'Mock Reporter',
    emailAddress: 'reporter@example.com',
    avatarUrls: {
      '48x48': 'https://mock-jira.atlassian.net/secure/useravatar?size=large&ownerId=mock-reporter-id',
    },
  },
  'mock-assignee-id': {
    accountId: 'mock-assignee-id',
    displayName: 'Mock Assignee',
    emailAddress: 'assignee@example.com',
    avatarUrls: {
      '48x48': 'https://mock-jira.atlassian.net/secure/useravatar?size=large&ownerId=mock-assignee-id',
    },
  },
};

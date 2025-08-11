/**
 * Transition and Metadata Interceptors
 * Extended Jira API endpoints for transitions and metadata
 */

import { 
  createErrorResponse,
  createScope, 
  delay,
} from '../core/nock-mock-service.js';
import { mockData } from './jira-mock-data.js';
import { extractIssueKeyFromUri } from './jira-mock-helpers.js';
import logger from '../../logger.js';

// Helper function to get status by transition ID
const getStatusByTransitionId = (transitionId) => {
  const [openStatus, inProgressStatus, doneStatus] = mockData.statuses;
  
  switch (transitionId) {
  case '11':
    return openStatus;
  case '21':
    return inProgressStatus;
  case '31':
    return doneStatus;
  default:
    return null;
  }
};

// Get transitions interceptor
const setupGetTransitionsInterceptor = (baseURL) => {
  return createScope(baseURL)
    .get(/\/rest\/api\/2\/issue\/([A-Z]+-\d+)\/transitions/)
    .reply(200, {
      expand: 'transitions',
      transitions: [
        {
          id: '11',
          name: 'To Do',
          to: {
            id: '1',
            name: 'Open',
            statusCategory: { id: 2, name: 'To Do', colorName: 'blue-gray' },
          },
        },
        {
          id: '21',
          name: 'In Progress',
          to: {
            id: '2',
            name: 'In Progress',
            statusCategory: { id: 4, name: 'In Progress', colorName: 'yellow' },
          },
        },
        {
          id: '31',
          name: 'Done',
          to: {
            id: '3',
            name: 'Done',
            statusCategory: { id: 3, name: 'Done', colorName: 'green' },
          },
        },
      ],
    })
    .persist();
};

// Execute transition interceptor
const setupExecuteTransitionInterceptor = (baseURL) => {
  return createScope(baseURL)
    .post(/\/rest\/api\/2\/issue\/([A-Z]+-\d+)\/transitions/)
    .reply(async (uri, requestBody) => {
      await delay(100);
      
      const issueKey = extractIssueKeyFromUri(uri);
      const issue = mockData.issues.get(issueKey);
      
      if (!issue) {
        return [404, createErrorResponse(404, `Issue ${issueKey} not found`)];
      }

      const transitionId = requestBody.transition?.id;
      const newStatus = getStatusByTransitionId(transitionId);
      
      if (newStatus) {
        issue.fields.status = newStatus;
        issue.fields.updated = new Date().toISOString();
        logger.info(`Mock Jira: Transitioned issue ${issueKey} to ${newStatus.name}`);
      }
      
      return [204, {}];
    })
    .persist();
};

// Transition interceptors
export const setupTransitionInterceptors = (baseURL) => {
  const interceptors = [];

  interceptors.push(setupGetTransitionsInterceptor(baseURL));
  interceptors.push(setupExecuteTransitionInterceptor(baseURL));

  return interceptors;
};

// Create metadata interceptors
export const setupCreateMetaInterceptors = (baseURL) => {
  const interceptors = [];

  // Get create metadata
  const createMetaInterceptor = createScope(baseURL)
    .get('/rest/api/2/issue/createmeta')
    .query(true)
    .reply(200, {
      expand: 'projects',
      projects: [
        {
          id: '10000',
          key: 'MOCK',
          name: 'Mock Project',
          issuetypes: [
            {
              id: '10001',
              name: 'Bug',
              fields: {
                summary: {
                  required: true,
                  name: 'Summary',
                  operations: ['set'],
                  schema: { type: 'string', system: 'summary' },
                },
                description: {
                  required: false,
                  name: 'Description',
                  operations: ['set'],
                  schema: { type: 'string', system: 'description' },
                },
                priority: {
                  required: false,
                  name: 'Priority',
                  operations: ['set'],
                  allowedValues: mockData.priorities,
                  schema: { type: 'priority', system: 'priority' },
                },
              },
            },
          ],
        },
      ],
    })
    .persist();
  interceptors.push(createMetaInterceptor);

  return interceptors;
};

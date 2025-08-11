/**
 * Jira Mock Interceptors
 * Nock interceptor setup functions for different Jira API endpoints
 */

import { 
  createErrorResponse,
  createScope, 
  delay,
  validateRequiredFields, 
} from '../core/nock-mock-service.js';
import { mockData } from './jira-mock-data.js';
import { 
  createMockComment, 
  createMockIssue, 
  extractIssueKeyFromUri, 
  getIssueFromKey, 
  searchIssues,
} from './jira-mock-helpers.js';
import logger from '../../logger.js';

// Project interceptors
export const setupProjectInterceptors = (baseURL) => {
  const interceptors = [];

  // Get all projects
  const projectsInterceptor = createScope(baseURL)
    .get('/rest/api/2/project')
    .reply(200, Array.from(mockData.projects.values()))
    .persist();
  interceptors.push(projectsInterceptor);

  // Get specific project
  const projectInterceptor = createScope(baseURL)
    .get(/\/rest\/api\/2\/project\/([A-Z]+)/)
    .reply((uri) => {
      const projectKey = uri.split('/').pop();
      const project = mockData.projects.get(projectKey);
      
      if (project) {
        return [200, project];
      }
      return [404, createErrorResponse(404, `Project ${projectKey} not found`)];
    })
    .persist();
  interceptors.push(projectInterceptor);

  return interceptors;
};

// Issue creation interceptor
const setupCreateIssueInterceptor = (baseURL) => {
  return createScope(baseURL)
    .post('/rest/api/2/issue')
    .reply(async (_uri, requestBody) => {
      await delay(100); // Simulate API delay
      
      const validation = validateRequiredFields(
        requestBody.fields, 
        ['summary', 'project', 'issuetype'],
      );
      if (!validation.isValid) {
        return [400, createErrorResponse(400, validation.message)];
      }

      const issue = createMockIssue(requestBody.fields);
      logger.info(`Mock Jira: Created issue ${issue.key}`);
      
      return [201, {
        id: issue.id,
        key: issue.key,
        self: issue.self,
      }];
    })
    .persist();
};

// Issue retrieval interceptor
const setupGetIssueInterceptor = (baseURL) => {
  return createScope(baseURL)
    .get(/\/rest\/api\/2\/issue\/([A-Z]+-\d+)/)
    .reply((uri) => {
      const issueKey = uri.split('/').pop();
      const issue = mockData.issues.get(issueKey);
      
      if (issue) {
        return [200, issue];
      }
      return [404, createErrorResponse(404, `Issue ${issueKey} not found`)];
    })
    .persist();
};

// Issue update interceptor
const setupUpdateIssueInterceptor = (baseURL) => {
  return createScope(baseURL)
    .put(/\/rest\/api\/2\/issue\/([A-Z]+-\d+)/)
    .reply(async (uri, requestBody) => {
      await delay(100);
      
      const issueKey = uri.split('/').pop();
      const issue = mockData.issues.get(issueKey);
      
      if (!issue) {
        return [404, createErrorResponse(404, `Issue ${issueKey} not found`)];
      }

      // Update fields
      if (requestBody.fields) {
        Object.assign(issue.fields, requestBody.fields);
        issue.fields.updated = new Date().toISOString();
      }

      logger.info(`Mock Jira: Updated issue ${issueKey}`);
      return [204, {}];
    })
    .persist();
};

// Search interceptor
const setupSearchInterceptor = (baseURL) => {
  return createScope(baseURL)
    .get('/rest/api/2/search')
    .query(true)
    .reply((uri) => {
      const url = new URL(uri, baseURL);
      const jql = url.searchParams.get('jql') || '';
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const result = searchIssues(jql, startAt, maxResults);
      return [200, result];
    })
    .persist();
};

// Main issue interceptors setup
export const setupIssueInterceptors = (baseURL) => {
  const interceptors = [];

  interceptors.push(setupCreateIssueInterceptor(baseURL));
  interceptors.push(setupGetIssueInterceptor(baseURL));
  interceptors.push(setupUpdateIssueInterceptor(baseURL));
  interceptors.push(setupSearchInterceptor(baseURL));

  return interceptors;
};

// Comment interceptors
export const setupCommentInterceptors = (baseURL) => {
  const interceptors = [];

  // Add comment
  const addCommentInterceptor = createScope(baseURL)
    .post(/\/rest\/api\/2\/issue\/([A-Z]+-\d+)\/comment/)
    .reply(async (uri, requestBody) => {
      await delay(50);
      
      const issueKey = extractIssueKeyFromUri(uri);
      
      try {
        getIssueFromKey(issueKey); // Verify issue exists
      } catch (error) {
        return [404, error];
      }

      const validation = validateRequiredFields(requestBody, ['body']);
      if (!validation.isValid) {
        return [400, createErrorResponse(400, validation.message)];
      }

      const comment = createMockComment(issueKey, requestBody);
      logger.info(`Mock Jira: Added comment to issue ${issueKey}`);
      
      return [201, comment];
    })
    .persist();
  interceptors.push(addCommentInterceptor);

  // Get comments
  const getCommentsInterceptor = createScope(baseURL)
    .get(/\/rest\/api\/2\/issue\/([A-Z]+-\d+)\/comment/)
    .reply((uri) => {
      const issueKey = extractIssueKeyFromUri(uri);
      const comments = mockData.comments.get(issueKey) || [];
      
      return [200, {
        startAt: 0,
        maxResults: comments.length,
        total: comments.length,
        comments,
      }];
    })
    .persist();
  interceptors.push(getCommentsInterceptor);

  return interceptors;
};

// Metadata interceptors
export const setupMetadataInterceptors = (baseURL) => {
  const interceptors = [];

  // Get issue types
  const issueTypesInterceptor = createScope(baseURL)
    .get('/rest/api/2/issuetype')
    .reply(200, mockData.issueTypes)
    .persist();
  interceptors.push(issueTypesInterceptor);

  // Get priorities
  const prioritiesInterceptor = createScope(baseURL)
    .get('/rest/api/2/priority')
    .reply(200, mockData.priorities)
    .persist();
  interceptors.push(prioritiesInterceptor);

  // Get statuses
  const statusesInterceptor = createScope(baseURL)
    .get('/rest/api/2/status')
    .reply(200, mockData.statuses)
    .persist();
  interceptors.push(statusesInterceptor);

  // Get users (assignable search)
  const usersInterceptor = createScope(baseURL)
    .get('/rest/api/2/user/assignable/search')
    .query(true)
    .reply(200, Array.from(mockData.users.values()))
    .persist();
  interceptors.push(usersInterceptor);

  return interceptors;
};

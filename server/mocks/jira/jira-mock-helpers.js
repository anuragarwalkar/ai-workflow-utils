/**
 * Jira Mock Helpers
 * Pure functions for creating mock Jira responses
 */

import { createErrorResponse } from '../core/nock-mock-service.js';
import { getJiraState, mockData, updateJiraState } from './jira-mock-data.js';

// Helper functions for creating mock responses
const generateIssueIdentifiers = () => {
  const currentState = getJiraState();
  const issueId = String(currentState.issueCounter);
  const issueKey = `MOCK-${currentState.issueCounter}`;
  
  updateJiraState({ issueCounter: currentState.issueCounter + 1 });
  
  return { issueId, issueKey };
};

const getIssueMetadata = (issueData) => {
  const issueType = mockData.issueTypes.find(type => 
    type.id === issueData.issuetype?.id,
  ) || mockData.issueTypes[0];
  
  const priority = mockData.priorities.find(p => 
    p.id === issueData.priority?.id,
  ) || mockData.priorities[2];
  
  const [status] = mockData.statuses; // Default to 'Open'
  const project = mockData.projects.get('MOCK');
  
  return { issueType, priority, status, project };
};

export const createMockIssue = (issueData) => {
  const { issueId, issueKey } = generateIssueIdentifiers();
  const { issueType, priority, status, project } = getIssueMetadata(issueData);

  const issue = {
    id: issueId,
    key: issueKey,
    self: `https://mock-jira.atlassian.net/rest/api/2/issue/${issueId}`,
    expand: 'renderedFields,names,schema,operations,editmeta,changelog,versionedRepresentations',
    fields: {
      summary: issueData.summary || 'Mock Issue',
      description: issueData.description || 'Mock issue description',
      issuetype: issueType,
      status,
      priority,
      assignee: issueData.assignee || null,
      reporter: issueData.reporter || mockData.users.get('mock-user-1'),
      project,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      labels: issueData.labels || [],
      components: issueData.components || [],
      fixVersions: issueData.fixVersions || [],
      versions: issueData.versions || [],
    },
  };

  mockData.issues.set(issueKey, issue);
  return issue;
};

export const createMockComment = (issueKey, commentData) => {
  const currentState = getJiraState();
  const commentId = String(currentState.commentCounter);
  
  updateJiraState({ commentCounter: currentState.commentCounter + 1 });

  const comment = {
    id: commentId,
    self: `https://mock-jira.atlassian.net/rest/api/2/issue/${issueKey}/comment/${commentId}`,
    author: commentData.author || mockData.users.get('mock-user-1'),
    body: commentData.body || 'Mock comment',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    visibility: commentData.visibility || null,
  };

  if (!mockData.comments.has(issueKey)) {
    mockData.comments.set(issueKey, []);
  }
  mockData.comments.get(issueKey).push(comment);

  return comment;
};

export const searchIssues = (jql, startAt = 0, maxResults = 50) => {
  const allIssues = Array.from(mockData.issues.values());
  
  // Simple JQL parsing for common patterns
  let filteredIssues = allIssues;
  
  if (jql.includes('project =')) {
    const projectMatch = jql.match(/project\s*=\s*([A-Z]+)/i);
    if (projectMatch) {
      const [, projectKey] = projectMatch;
      filteredIssues = filteredIssues.filter(issue => 
        issue.fields.project.key === projectKey,
      );
    }
  }
  
  if (jql.includes('status =')) {
    const statusMatch = jql.match(/status\s*=\s*"([^"]+)"/i);
    if (statusMatch) {
      const [, statusName] = statusMatch;
      filteredIssues = filteredIssues.filter(issue => 
        issue.fields.status.name === statusName,
      );
    }
  }

  const total = filteredIssues.length;
  const paginatedIssues = filteredIssues.slice(startAt, startAt + maxResults);

  return {
    expand: 'names,schema',
    startAt,
    maxResults,
    total,
    issues: paginatedIssues,
  };
};

// Utility functions
export const extractIssueKeyFromUri = (uri) => {
  const pathParts = uri.split('/');
  return pathParts[5]; // /rest/api/2/issue/{issueKey}/...
};

export const getIssueFromKey = (issueKey) => {
  const issue = mockData.issues.get(issueKey);
  if (!issue) {
    throw createErrorResponse(404, `Issue ${issueKey} not found`);
  }
  return issue;
};

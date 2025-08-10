/**
 * Jira Mock Metadata Operations
 * Contains metadata-related mock functions
 */

import { mockProjectMetadata } from './mock-metadata.js';

/**
 * Get summary field configuration
 * @returns {object} Summary field config
 */
const getSummaryFieldConfig = () => ({
  required: true,
  name: 'Summary',
  key: 'summary',
  hasDefaultValue: false,
  operations: ['set'],
  allowedValues: [],
  schema: {
    type: 'string',
    system: 'summary',
  },
});

/**
 * Get description field configuration
 * @returns {object} Description field config
 */
const getDescriptionFieldConfig = () => ({
  required: false,
  name: 'Description',
  key: 'description',
  hasDefaultValue: false,
  operations: ['set'],
  allowedValues: [],
  schema: {
    type: 'string',
    system: 'description',
  },
});

/**
 * Get priority field configuration
 * @returns {object} Priority field config
 */
const getPriorityFieldConfig = () => ({
  required: false,
  name: 'Priority',
  key: 'priority',
  hasDefaultValue: true,
  operations: ['set'],
  allowedValues: [
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
  ],
  schema: {
    type: 'priority',
    system: 'priority',
  },
});

/**
 * Get field configuration for create meta
 * @returns {object} Field configurations
 */
const getFieldConfigurations = () => ({
  summary: getSummaryFieldConfig(),
  description: getDescriptionFieldConfig(),
  priority: getPriorityFieldConfig(),
});

/**
 * Build issue type with fields for create meta
 * @param {object} issueType - Issue type object
 * @returns {object} Issue type with fields
 */
export const buildIssueTypeWithFields = (issueType) => {
  const fieldConfigs = getFieldConfigurations();
  
  return {
    ...issueType,
    fields: {
      ...fieldConfigs,
      issuetype: {
        required: true,
        name: 'Issue Type',
        key: 'issuetype',
        hasDefaultValue: false,
        operations: ['set'],
        allowedValues: [issueType],
        schema: {
          type: 'issuetype',
          system: 'issuetype',
        },
      },
    },
  };
};

/**
 * Get create meta data structure
 * @returns {object} Create meta data
 */
export const getCreateMetaData = () => ({
  expand: 'projects',
  projects: [
    {
      ...mockProjectMetadata,
      issuetypes: mockProjectMetadata.issuetypes.map(buildIssueTypeWithFields),
    },
  ],
});

/**
 * Get transition data
 * @returns {object} Transitions data
 */
export const getTransitionsData = () => ({
  expand: 'transitions',
  transitions: [
    {
      id: '21',
      name: 'In Progress',
      to: {
        id: '3',
        name: 'In Progress',
        statusCategory: {
          id: 4,
          key: 'indeterminate',
          colorName: 'yellow',
        },
      },
      fields: {},
    },
    {
      id: '31',
      name: 'Done',
      to: {
        id: '10001',
        name: 'Done',
        statusCategory: {
          id: 3,
          key: 'done',
          colorName: 'green',
        },
      },
      fields: {},
    },
  ],
});

/**
 * Get status based on transition ID
 * @param {string} transitionId - Transition ID
 * @returns {object|null} Status object or null
 */
export const getStatusByTransitionId = (transitionId) => {
  const statusMap = {
    '21': {
      id: '3',
      name: 'In Progress',
      statusCategory: {
        id: 4,
        key: 'indeterminate',
        colorName: 'yellow',
      },
    },
    '31': {
      id: '10001',
      name: 'Done',
      statusCategory: {
        id: 3,
        key: 'done',
        colorName: 'green',
      },
    },
  };
  
  return statusMap[transitionId] || null;
};

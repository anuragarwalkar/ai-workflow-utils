// Utility functions for Jira content service (modularized)
import { ISSUE_TYPE_MAPPING } from '../utils/constants.js';

export const getAvailableIssueTypes = () => {
  return {
    Bug: {
      description: 'A problem or defect in the software',
      templateType: ISSUE_TYPE_MAPPING.Bug,
      aiCapabilities: [
        'Bug report generation',
        'Steps to reproduce',
        'Expected vs actual behavior',
      ],
    },
    Task: {
      description: 'A unit of work to be completed',
      templateType: ISSUE_TYPE_MAPPING.Task,
      aiCapabilities: ['Task breakdown', 'Implementation details', 'Checklist generation'],
    },
    Story: {
      description: 'A user story representing a feature or requirement',
      templateType: ISSUE_TYPE_MAPPING.Story,
      aiCapabilities: ['User story formatting', 'Acceptance criteria', 'Use case scenarios'],
    },
  };
};

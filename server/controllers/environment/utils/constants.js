/**
 * Constants for Environment Controller
 */

export const PROVIDER_TYPES = {
  AI: 'ai',
  REPOSITORY: 'repository', 
  ISSUE_TRACKING: 'issue_tracking',
  EMAIL: 'email'
};

export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama'
};

export const REPOSITORY_PROVIDERS = {
  BITBUCKET: 'bitbucket',
  GITHUB: 'github',
  GITLAB: 'gitlab'
};

export const ISSUE_TRACKING_PROVIDERS = {
  JIRA: 'jira',
  LINEAR: 'linear',
  GITHUB_ISSUES: 'github_issues'
};

export const SENSITIVE_FIELD_PATTERNS = [
  'token',
  'key', 
  'password',
  'secret',
  'auth',
  'api_key'
];

export const REQUIRED_FIELDS_BY_PROVIDER = {
  [AI_PROVIDERS.OPENAI]: ['OPENAI_COMPATIBLE_API_KEY', 'OPENAI_COMPATIBLE_BASE_URL'],
  [AI_PROVIDERS.ANTHROPIC]: ['ANTHROPIC_API_KEY'],
  [AI_PROVIDERS.GOOGLE]: ['GOOGLE_API_KEY'],
  [AI_PROVIDERS.OLLAMA]: ['OLLAMA_BASE_URL'],
  [REPOSITORY_PROVIDERS.BITBUCKET]: ['BIT_BUCKET_URL', 'BITBUCKET_AUTHORIZATION_TOKEN'],
  [ISSUE_TRACKING_PROVIDERS.JIRA]: ['JIRA_URL', 'JIRA_TOKEN']
};

export const DEFAULT_TIMEOUT = 30000; // 30 seconds

export const CONNECTION_TEST_STATUSES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  PENDING: 'pending'
};

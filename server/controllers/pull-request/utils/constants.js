// PR Controller Constants
export const DEFAULT_COMMIT_LIMIT = 20;
export const DEFAULT_TARGET_BRANCH = 'main';

// Commit type keywords
export const COMMIT_TYPE_KEYWORDS = {
  FEAT: ['feat', 'feature', 'add', 'implement', 'create', 'new', 'introduce'],
  FIX: ['fix', 'bug', 'patch', 'resolve', 'correct', 'repair', 'hotfix'],
  CHORE: [
    'chore',
    'refactor',
    'update',
    'clean',
    'maintain',
    'deps',
    'dependency',
    'style',
    'format',
  ],
};

// Server-Sent Events headers
export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Cache-Control',
};

import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import logger from '../logger.ts';

/**
 * Discovers and loads environment variables from multiple possible locations:
 * 1. User working directory where CLI/npx was invoked (AI_WORKFLOW_USER_CWD, INIT_CWD, or process.cwd())
 * 2. User home configuration directory (~/.ai-workflow-utils/config.env, ~/.ai-workflow-utils/.env)
 * 3. Current process working directory (.env.local, .env)
 * 4. Package directory (.env)
 */
export function loadEnvironment(options: { packageDir?: string; verbose?: boolean } = {}): {
  loadedFiles: string[];
} {
  const loadedFiles: string[] = [];
  const homeDir = os.homedir();
  const userCwd =
    process.env.AI_WORKFLOW_USER_CWD ||
    process.env.INIT_CWD ||
    process.cwd();

  const candidatePaths: string[] = [
    // 1. User's invocation working directory
    path.join(userCwd, '.env.local'),
    path.join(userCwd, '.env'),

    // 2. User's home config directory (~/.ai-workflow-utils)
    path.join(homeDir, '.ai-workflow-utils', 'config.env'),
    path.join(homeDir, '.ai-workflow-utils', '.env'),

    // 3. Current process working directory (if different from userCwd)
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ];

  // 4. Package directory if provided or resolved
  if (options.packageDir) {
    candidatePaths.push(path.join(options.packageDir, '.env'));
  }

  // Deduplicate paths
  const uniqueCandidatePaths = Array.from(new Set(candidatePaths.map(p => path.resolve(p))));

  for (const filePath of uniqueCandidatePaths) {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const result = dotenv.config({ path: filePath });
        if (!result.error) {
          loadedFiles.push(filePath);
        }
      }
    } catch {
      // Ignore file access errors
    }
  }

  if (options.verbose !== false && loadedFiles.length > 0) {
    logger.info(`Loaded environment files: ${loadedFiles.join(', ')}`);
  }

  return { loadedFiles };
}

export default loadEnvironment;

const _pacakges = String(import.meta.env.VITE_GIT_REPOS);

// Set available repos to show and create pr
export const AVAILABLE_PACKAGES = _pacakges.trim() ? _pacakges.split(',') : [];


// Pull request configuration from environment variables
export const PR_CONFIG = {
  PROJECT_KEY: import.meta.env.VITE_PR_CREATION_REPO_KEY,
  REPO_SLUG: import.meta.env.VITE_PR_CREATION_REPO_SLUG 
};

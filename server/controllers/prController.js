// Modular PR Controller - Backwards compatibility layer
// This file now delegates to the modular PR controller structure
import { 
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
  generatePRContentStructured
} from "./pr/index.js";

// Export all functions for backward compatibility
export {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
  generatePRContentStructured,
};

export default {
  getPullRequests,
  getPullRequestDiff,
  reviewPullRequest,
  createPullRequest,
  streamPRPreview,
  generatePRContentStructured,
};

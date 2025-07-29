import { DEFAULT_TARGET_BRANCH } from "../utils/constants.js";

/**
 * Pull Request model for data validation and structure
 */
class PullRequest {
  constructor(data) {
    this.title = data.title;
    this.description = data.description;
    this.fromBranch = data.fromBranch;
    this.toBranch = data.toBranch || DEFAULT_TARGET_BRANCH;
    this.projectKey = data.projectKey;
    this.repoSlug = data.repoSlug;
    this.ticketNumber = data.ticketNumber;
  }

  /**
   * Validate required fields
   */
  static validate(data) {
    const required = ['title', 'description', 'fromBranch', 'projectKey', 'repoSlug'];
    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Create Bitbucket API payload
   */
  toBitbucketPayload() {
    return {
      title: this.title,
      description: this.description,
      fromRef: {
        id: `refs/heads/${this.fromBranch}`,
      },
      toRef: {
        id: `refs/heads/${this.toBranch}`,
      },
    };
  }

  /**
   * Create response payload
   */
  toResponsePayload(additionalData = {}) {
    return {
      message: "Pull request created successfully",
      prTitle: this.title,
      prDescription: this.description,
      ticketNumber: this.ticketNumber,
      branchName: this.fromBranch,
      ...additionalData
    };
  }
}

export default PullRequest;

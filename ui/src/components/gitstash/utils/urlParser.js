/**
 * Pure function to parse GitStash URLs
 * @param {string} url - The GitStash URL to parse
 * @returns {object} Parsed data with validation result
 */
export const parseGitStashUrl = (url) => {
  try {
    // Remove any trailing slashes and whitespace
    const cleanUrl = url.trim().replace(/\/$/, '');

    // Pattern for GitStash URLs
    // Format: https://domain/projects/PROJECT_KEY/repos/REPO_SLUG/pull-requests/PR_NUMBER[/overview|/diff|/commits]
    // Or: https://domain/projects/PROJECT_KEY/repos/REPO_SLUG
    const urlPattern =
      /\/projects\/([^/]+)\/repos\/([^/]+)(?:\/pull-requests\/(\d+)(?:\/(?:overview|diff|commits))?)?/;
    const match = cleanUrl.match(urlPattern);

    if (match) {
      const [, projectKey, repoSlug, prNumber] = match;
      return {
        projectKey: projectKey.toUpperCase(),
        repoSlug,
        prNumber: prNumber ? parseInt(prNumber, 10) : null,
        isValid: true,
      };
    }

    return { isValid: false };
  } catch {
    return { isValid: false };
  }
};

/**
 * Pure function to validate form data
 * @param {object} formData - Form data to validate
 * @returns {object} Validation result with errors
 */
export const validateFormData = (formData) => {
  const errors = [];
  
  if (!formData.projectKey?.trim()) {
    errors.push('Project Key is required');
  }
  
  if (!formData.repoSlug?.trim()) {
    errors.push('Repository Slug is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Pure function to validate URL data
 * @param {string} url - URL to validate
 * @returns {object} Validation result with errors
 */
export const validateUrlData = (url) => {
  if (!url?.trim()) {
    return {
      isValid: false,
      errors: ['Please enter a GitStash URL'],
    };
  }

  const parsed = parseGitStashUrl(url);
  if (!parsed.isValid) {
    return {
      isValid: false,
      errors: ['Invalid GitStash URL format. Please check the URL and try again.'],
    };
  }

  return {
    isValid: true,
    errors: [],
    parsed,
  };
};

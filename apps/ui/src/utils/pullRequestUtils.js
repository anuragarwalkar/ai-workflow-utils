/**
 * Utility functions for Pull Request operations
 */

/**
 * Get the author name from a pull request object
 * @param {Object} pr - Pull request object
 * @returns {string} Author display name or 'Unknown'
 */
export const getAuthorName = pr => 
  pr.author?.user?.displayName || pr.author?.displayName || 'Unknown';

/**
 * Format timestamp to a readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export const formatDate = timestamp =>
  new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Get status color for different PR states
 * @param {string} state - PR state (OPEN, MERGED, DECLINED)
 * @returns {string} Material-UI color variant
 */
export const getStatusColor = state => {
  switch (state) {
    case 'OPEN':
      return 'success';
    case 'MERGED':
      return 'primary';
    case 'DECLINED':
      return 'error';
    default:
      return 'default';
  }
};

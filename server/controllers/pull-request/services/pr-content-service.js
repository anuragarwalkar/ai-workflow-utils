import { COMMIT_TYPE_KEYWORDS } from '../utils/constants.js';

/**
 * Service for generating PR content using AI
 */
class PRContentService {
  /**
   * Analyze commits to determine the type (feat/fix/chore)
   */
  static analyzeCommitType(commits) {
    const commitMessages = commits
      .map(commit => commit.message.toLowerCase())
      .join(' ');

    let featScore = 0;
    let fixScore = 0;
    let choreScore = 0;

    // Score based on keyword matches
    COMMIT_TYPE_KEYWORDS.FEAT.forEach(keyword => {
      if (commitMessages.includes(keyword)) featScore++;
    });

    COMMIT_TYPE_KEYWORDS.FIX.forEach(keyword => {
      if (commitMessages.includes(keyword)) fixScore++;
    });

    COMMIT_TYPE_KEYWORDS.CHORE.forEach(keyword => {
      if (commitMessages.includes(keyword)) choreScore++;
    });

    // Return the type with highest score, default to 'feat'
    if (fixScore > featScore && fixScore > choreScore) {
      return 'fix';
    } else if (choreScore > featScore && choreScore > fixScore) {
      return 'chore';
    } else {
      return 'feat';
    }
  }
}

export default PRContentService;

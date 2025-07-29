import UnidiffProcessor from "../processors/unidiffProcessor.js";
import BitbucketDiffProcessor from "../processors/bitbucketDiffProcessor.js";
import LegacyDiffProcessor from "../processors/legacyDiffProcessor.js";

/**
 * Service to process different types of diff data
 */
class DiffProcessorService {
  /**
   * Build review prompt data for LangChain
   */
  static buildReviewPromptData(diffData, prDetails) {
    const prTitle = prDetails?.title || "N/A";
    const prDescription = prDetails?.description || "N/A";
    const prAuthor = prDetails?.author?.user?.displayName || 
                     prDetails?.author?.displayName || "N/A";

    let codeChanges = "";
    let hasChanges = false;

    // Try unidiff processing first for better accuracy
    const unidiffResult = UnidiffProcessor.processWithUnidiff(diffData);
    if (unidiffResult.hasChanges) {
      codeChanges = unidiffResult.codeChanges;
      hasChanges = unidiffResult.hasChanges;
    } else {
      // Fallback to Bitbucket diff format
      const bitbucketResult = BitbucketDiffProcessor.processBitbucketDiff(diffData);
      if (bitbucketResult.hasChanges) {
        codeChanges = bitbucketResult.codeChanges;
        hasChanges = bitbucketResult.hasChanges;
      } else {
        // Fallback to legacy format
        const legacyResult = LegacyDiffProcessor.processLegacyDiff(diffData);
        if (legacyResult.hasChanges) {
          codeChanges = legacyResult.codeChanges;
          hasChanges = legacyResult.hasChanges;
        } else if (diffData && typeof diffData === "string") {
          // Handle raw diff string
          hasChanges = true;
          codeChanges += `\`\`\`diff\n${diffData}\n\`\`\`\n\n`;
        } else if (diffData && typeof diffData === "object") {
          // Handle other diff object structures
          hasChanges = true;
          codeChanges += `\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
          codeChanges += `Note: The above is the raw diff data structure. Please analyze the changes within this data.\n\n`;
        }
      }
    }

    if (!hasChanges) {
      codeChanges += `**Note:** No specific code changes were detected in the provided diff data. This might indicate:\n`;
      codeChanges += `- The diff data structure is different than expected\n`;
      codeChanges += `- The changes are in binary files or very large files\n`;
      codeChanges += `- There might be an issue with how the diff was generated\n\n`;
      codeChanges += `Raw diff data structure:\n\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
    }

    return {
      prTitle,
      prDescription,
      prAuthor,
      codeChanges
    };
  }
}

export default DiffProcessorService;

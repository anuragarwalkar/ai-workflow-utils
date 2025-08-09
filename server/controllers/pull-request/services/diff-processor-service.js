import UnidiffProcessor from '../processors/uni-diff-processor.js';

/**
 * Service to process different types of diff data using UnidiffProcessor exclusively
 */
class DiffProcessorService {
  /**
   * Build review prompt data for LangChain
   */
  static async buildReviewPromptData(diffData, prDetails) {
    const prTitle = prDetails?.title || 'N/A';
    const prDescription = prDetails?.description || 'N/A';
    const prAuthor =
      prDetails?.author?.user?.displayName ||
      prDetails?.author?.displayName ||
      'N/A';

    let codeChanges = '';
    let hasChanges = false;
    let processorUsed = 'UnidiffProcessor';

    // Use UnidiffProcessor exclusively for all diff processing
    const unidiffResult = await UnidiffProcessor.processWithUnidiff(diffData);

    if (unidiffResult.hasChanges) {
      codeChanges = unidiffResult.codeChanges;
      hasChanges = unidiffResult.hasChanges;
    } else {
      codeChanges += '**Note:** No specific code changes were detected in the provided diff data. This might indicate:\n';
      codeChanges += '- The diff data structure is different than expected\n';
      codeChanges += '- The changes are in binary files or very large files\n';
      codeChanges += '- There might be an issue with how the diff was generated\n\n';
      codeChanges += `Raw diff data structure:\n\`\`\`json\n${JSON.stringify(diffData, null, 2)}\n\`\`\`\n\n`;
      processorUsed = 'UnidiffProcessor (no changes detected)';
    }

    return {
      prTitle,
      prDescription,
      prAuthor,
      codeChanges,
      processorUsed,
    };
  }
}

export default DiffProcessorService;

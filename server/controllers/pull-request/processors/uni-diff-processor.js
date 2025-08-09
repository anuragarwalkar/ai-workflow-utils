import logger from '../../../logger.js';
import FileFilter from '../utils/file-filter.js';

// Use dynamic import to avoid webpack bundling issues
let parsePatch = null;

async function initializeParsePatch() {
  if (!parsePatch) {
    try {
      const unidiff = await import('unidiff');
      parsePatch = unidiff.default.parsePatch || unidiff.parsePatch;
      if (!parsePatch) {
        throw new Error('parsePatch function not found in unidiff module');
      }
    } catch (error) {
      logger.error('Failed to load unidiff module:', error.message);
      throw error;
    }
  }
  return parsePatch;
}

/**
 * Unidiff-based diff processing utilities
 */
class UnidiffProcessor {
  /**
   * Convert Bitbucket diff data to unified diff format and parse with unidiff
   */
  static async processWithUnidiff(diffData) {
    try {
      logger.info('UnidiffProcessor: Starting diff processing');
      
      const parsePatchFn = await initializeParsePatch();

      // If diffData is already a string in unified diff format, parse it directly
      if (typeof diffData === 'string') {
        logger.info('UnidiffProcessor: Processing string diff format');
        const patches = parsePatchFn(diffData);
        
        // Filter out ignored files from parsed patches
        const filteredPatches = patches.filter(patch => {
          const fileName = patch.newFileName || patch.oldFileName || '';
          if (FileFilter.shouldIgnoreFile(fileName)) {
            return false;
          }
          return true;
        });

        const filteredCount = patches.length - filteredPatches.length;
        if (filteredCount > 0) {
          logger.info(
            `UnidiffProcessor: Filtered out ${filteredCount} ignored files from string diff, processing ${filteredPatches.length} remaining files`,
          );
        }

        return this.formatUnidiffPatches(filteredPatches);
      }

      // Convert Bitbucket format to unified diff string
      logger.info(
        'UnidiffProcessor: Converting structured diff to unified format',
      );
      const unifiedDiff = this.convertBitbucketToUnifiedDiff(diffData);
      if (unifiedDiff) {
        logger.info(
          'UnidiffProcessor: Successfully converted to unified diff, parsing...',
        );
        const patches = parsePatchFn(unifiedDiff);
        const result = this.formatUnidiffPatches(patches);
        logger.info(
          `UnidiffProcessor: Successfully processed diff with ${result.hasChanges ? 'changes' : 'no changes'}`,
        );
        return result;
      }

      logger.warn(
        'UnidiffProcessor: Failed to convert structured diff to unified format',
      );
      return { codeChanges: '', hasChanges: false };
    } catch (error) {
      logger.warn('Failed to process diff with unidiff:', error.message);
      // logger.debug('Diff data structure:', JSON.stringify(diffData, null, 2));
      return { codeChanges: '', hasChanges: false };
    }
  }

  /**
   * Process segment lines for unified diff format
   */
  static processSegmentLines(segment) {
    if (!segment.lines || !Array.isArray(segment.lines)) {
      return '';
    }

    return segment.lines
      .map(line => {
        let prefix = ' ';
        if (segment.type === 'ADDED') {
          prefix = '+';
        } else if (segment.type === 'REMOVED') {
          prefix = '-';
        }
        // Handle both 'line' property and direct string content
        const lineContent =
          line.line !== undefined
            ? line.line
            : typeof line === 'string'
              ? line
              : '';
        return `${prefix}${lineContent}\n`;
      })
      .join('');
  }

  /**
   * Process hunk segments for unified diff format
   */
  static processHunkSegments(hunk) {
    if (!hunk.segments || !Array.isArray(hunk.segments)) {
      return '';
    }

    const segmentContents = hunk.segments.map(segment => {
      const segmentContent = this.processSegmentLines(segment);
      return segmentContent;
    });

    return segmentContents.join('');
  }

  /**
   * Process file hunks for unified diff format
   */
  static processFileHunks(file) {
    if (!file.hunks || !Array.isArray(file.hunks)) {
      return '';
    }

    const hunkContents = file.hunks
      .map((hunk, index) => {
        const sourceStart = hunk.sourceLine || 0;
        const sourceSpan = hunk.sourceSpan || 0;
        const destStart = hunk.destinationLine || 0;
        const destSpan = hunk.destinationSpan || 0;

        let hunkContent = `@@ -${sourceStart},${sourceSpan} +${destStart},${destSpan} @@\n`;

        const segmentsContent = this.processHunkSegments(hunk);
        if (!segmentsContent) {
          logger.warn(
            `UnidiffProcessor: No segments content for hunk ${index}`,
          );
          return null;
        }

        hunkContent += segmentsContent;
        return hunkContent;
      })
      .filter(Boolean); // Remove null entries

    return hunkContents.join('');
  }

  /**
   * Convert Bitbucket diff structure to unified diff format
   */
  static convertBitbucketToUnifiedDiff(diffData) {
    try {
      if (!diffData || !diffData.diffs || !Array.isArray(diffData.diffs)) {
        logger.warn(
          'UnidiffProcessor: Invalid or missing diffs array in diffData',
        );
        return null;
      }

      logger.info(
        `UnidiffProcessor: Processing ${diffData.diffs.length} file diffs`,
      );

      // Filter out ignored files before processing
      const filteredDiffs = diffData.diffs.filter(file => {
        const sourceFile = file.source?.toString || '/dev/null';
        const destFile = file.destination?.toString || '/dev/null';
        
        // Check if either source or destination file should be ignored
        const shouldIgnoreSource = sourceFile !== '/dev/null' && FileFilter.shouldIgnoreFile(sourceFile);
        const shouldIgnoreDestination = destFile !== '/dev/null' && FileFilter.shouldIgnoreFile(destFile);
        
        if (shouldIgnoreSource || shouldIgnoreDestination) {
          return false;
        }
        
        return true;
      });

      const filteredCount = diffData.diffs.length - filteredDiffs.length;
      if (filteredCount > 0) {
        logger.info(
          `UnidiffProcessor: Filtered out ${filteredCount} ignored files, processing ${filteredDiffs.length} remaining files`,
        );
      }

      // If all files were filtered out, return early
      if (filteredDiffs.length === 0) {
        logger.info('UnidiffProcessor: All files were filtered out as ignored files');
        return null;
      }

      const unifiedDiffParts = filteredDiffs
        .map(file => {
          const sourceFile = file.source?.toString || '/dev/null';
          const destFile = file.destination?.toString || '/dev/null';

          let fileContent = `--- ${sourceFile}\n`;
          fileContent += `+++ ${destFile}\n`;

          const hunksContent = this.processFileHunks(file);
          if (!hunksContent) {
            logger.warn(
              `UnidiffProcessor: No hunks content for file ${sourceFile}`,
            );
            return null;
          }

          fileContent += hunksContent;
          return fileContent;
        })
        .filter(Boolean); // Remove null entries

      const result = unifiedDiffParts.join('');
      logger.info(
        `UnidiffProcessor: Generated unified diff with ${result.length} characters from ${unifiedDiffParts.length} files`,
      );

      return result || null;
    } catch (error) {
      logger.error(
        'UnidiffProcessor: Error in convertBitbucketToUnifiedDiff:',
        error.message,
      );
      return null;
    }
  }

  /**
   * Format parsed unidiff patches into readable markdown
   */
  static formatUnidiffPatches(patches) {
    let codeChanges = '';
    let hasChanges = false;

    patches.forEach((patch, index) => {
      const fileName = patch.newFileName || patch.oldFileName || 'Unknown file';
      codeChanges += `### File ${index + 1}: ${fileName}\n\n`;

      if (patch.hunks && patch.hunks.length > 0) {
        patch.hunks.forEach((hunk, hunkIndex) => {
          codeChanges += `**Hunk ${hunkIndex + 1}**: Lines ${hunk.oldStart}-${hunk.oldStart + hunk.oldLines - 1} → ${hunk.newStart}-${hunk.newStart + hunk.newLines - 1}\n\n`;
          codeChanges += '```diff\n';

          hunk.lines.forEach((line, lineIndex) => {
            // Handle different possible line structures
            let lineType = '';
            let lineContent = '';

            if (typeof line === 'string') {
              // Line is a plain string
              lineType = line[0] || ' ';
              lineContent = line.slice(1) || line;
            } else if (line && typeof line === 'object') {
              // Line is an object - check various possible properties
              lineType =
                line.type ||
                line.operation ||
                line.prefix ||
                (line.content && line.content[0]) ||
                ' ';
              lineContent =
                line.content || line.text || line.line || line.value || '';

              // Handle cases where type might be words instead of symbols
              if (
                lineType === 'add' ||
                lineType === 'added' ||
                lineType === '+'
              )
                lineType = '+';
              else if (
                lineType === 'remove' ||
                lineType === 'removed' ||
                lineType === '-'
              )
                lineType = '-';
              else if (
                lineType === 'context' ||
                lineType === 'normal' ||
                lineType === ' '
              )
                lineType = ' ';
            }

            // Ensure we have valid content
            if (lineContent !== undefined && lineContent !== null) {
              codeChanges += `${lineType}${lineContent}\n`;
              hasChanges = true;
            } else {
              console.warn(
                `formatUnidiffPatches - Invalid line content at index ${lineIndex}:`,
                line,
              );
              codeChanges += `${lineType || ' '}[Invalid line content]\n`;
            }
          });

          codeChanges += '```\n\n';
        });
      }

      codeChanges += '---\n\n';
    });

    return { codeChanges, hasChanges };
  }

  /**
   * Get a summary of changes from parsed patches
   */
  static getChangesSummary(patches) {
    let addedLines = 0;
    let removedLines = 0;
    let modifiedFiles = 0;

    patches.forEach(patch => {
      modifiedFiles++;
      patch.hunks.forEach(hunk => {
        hunk.lines.forEach(line => {
          if (line.type === '+') addedLines++;
          if (line.type === '-') removedLines++;
        });
      });
    });

    return { addedLines, removedLines, modifiedFiles };
  }

  /**
   * Get detailed diff analysis using unidiff
   */
  static async analyzeDiff(diffData) {
    try {
      const result = await this.processWithUnidiff(diffData);
      if (!result.hasChanges) {
        return {
          ...result,
          summary: { addedLines: 0, removedLines: 0, modifiedFiles: 0 },
        };
      }

      const parsePatchFn = await initializeParsePatch();

      // Parse again to get statistics (with filtering applied)
      let patches = [];
      if (typeof diffData === 'string') {
        const allPatches = parsePatchFn(diffData);
        // Apply filtering to string-based patches
        patches = allPatches.filter(patch => {
          const fileName = patch.newFileName || patch.oldFileName || '';
          return !FileFilter.shouldIgnoreFile(fileName);
        });
      } else {
        const unifiedDiff = this.convertBitbucketToUnifiedDiff(diffData);
        if (unifiedDiff) {
          patches = parsePatchFn(unifiedDiff);
        }
      }

      const summary = this.getChangesSummary(patches);
      return { ...result, summary };
    } catch (error) {
      logger.warn('Failed to analyze diff:', error.message);
      return {
        codeChanges: '',
        hasChanges: false,
        summary: { addedLines: 0, removedLines: 0, modifiedFiles: 0 },
      };
    }
  }
}

export default UnidiffProcessor;

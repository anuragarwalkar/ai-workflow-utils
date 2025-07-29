import { parsePatch } from "unidiff";
import logger from "../../../logger.js";

/**
 * Unidiff-based diff processing utilities
 */
class UnidiffProcessor {
  /**
   * Convert Bitbucket diff data to unified diff format and parse with unidiff
   */
  static processWithUnidiff(diffData) {
    try {
      // If diffData is already a string in unified diff format, parse it directly
      if (typeof diffData === "string") {
        const patches = parsePatch(diffData);
        return this.formatUnidiffPatches(patches);
      }

      // Convert Bitbucket format to unified diff string
      const unifiedDiff = this.convertBitbucketToUnifiedDiff(diffData);
      if (unifiedDiff) {
        const patches = parsePatch(unifiedDiff);
        return this.formatUnidiffPatches(patches);
      }

      return { codeChanges: "", hasChanges: false };
    } catch (error) {
      logger.warn("Failed to process diff with unidiff:", error.message);
      return { codeChanges: "", hasChanges: false };
    }
  }

  /**
   * Process segment lines for unified diff format
   */
  static processSegmentLines(segment) {
    if (!segment.lines || !Array.isArray(segment.lines)) {
      return "";
    }

    return segment.lines.map((line) => {
      let prefix = " ";
      if (segment.type === "ADDED") {
        prefix = "+";
      } else if (segment.type === "REMOVED") {
        prefix = "-";
      }
      return `${prefix}${line.line || ""}\n`;
    }).join("");
  }

  /**
   * Process hunk segments for unified diff format
   */
  static processHunkSegments(hunk) {
    if (!hunk.segments || !Array.isArray(hunk.segments)) {
      return "";
    }

    return hunk.segments.map(segment => this.processSegmentLines(segment)).join("");
  }

  /**
   * Process file hunks for unified diff format
   */
  static processFileHunks(file) {
    if (!file.hunks || !Array.isArray(file.hunks)) {
      return "";
    }

    return file.hunks.map((hunk) => {
      const sourceStart = hunk.sourceLine || 0;
      const sourceSpan = hunk.sourceSpan || 0;
      const destStart = hunk.destinationLine || 0;
      const destSpan = hunk.destinationSpan || 0;

      let hunkContent = `@@ -${sourceStart},${sourceSpan} +${destStart},${destSpan} @@\n`;
      hunkContent += this.processHunkSegments(hunk);
      return hunkContent;
    }).join("");
  }

  /**
   * Convert Bitbucket diff structure to unified diff format
   */
  static convertBitbucketToUnifiedDiff(diffData) {
    if (!diffData || !diffData.diffs || !Array.isArray(diffData.diffs)) {
      return null;
    }

    return diffData.diffs.map((file) => {
      const sourceFile = file.source?.toString || "/dev/null";
      const destFile = file.destination?.toString || "/dev/null";
      
      let fileContent = `--- ${sourceFile}\n`;
      fileContent += `+++ ${destFile}\n`;
      fileContent += this.processFileHunks(file);
      return fileContent;
    }).join("") || null;
  }

  /**
   * Format parsed unidiff patches into readable markdown
   */
  static formatUnidiffPatches(patches) {
    let codeChanges = "";
    let hasChanges = false;

    patches.forEach((patch, index) => {
      const fileName = patch.newFileName || patch.oldFileName || "Unknown file";
      codeChanges += `### File ${index + 1}: ${fileName}\n\n`;

      if (patch.hunks && patch.hunks.length > 0) {
        patch.hunks.forEach((hunk, hunkIndex) => {
          codeChanges += `**Hunk ${hunkIndex + 1}**: Lines ${hunk.oldStart}-${hunk.oldStart + hunk.oldLines - 1} → ${hunk.newStart}-${hunk.newStart + hunk.newLines - 1}\n\n`;
          codeChanges += "```diff\n";

          hunk.lines.forEach((line) => {
            codeChanges += `${line.type}${line.content}\n`;
            hasChanges = true;
          });

          codeChanges += "```\n\n";
        });
      }

      codeChanges += "---\n\n";
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

    patches.forEach((patch) => {
      modifiedFiles++;
      patch.hunks.forEach((hunk) => {
        hunk.lines.forEach((line) => {
          if (line.type === "+") addedLines++;
          if (line.type === "-") removedLines++;
        });
      });
    });

    return { addedLines, removedLines, modifiedFiles };
  }

  /**
   * Get detailed diff analysis using unidiff
   */
  static analyzeDiff(diffData) {
    try {
      const result = this.processWithUnidiff(diffData);
      if (!result.hasChanges) {
        return { 
          ...result, 
          summary: { addedLines: 0, removedLines: 0, modifiedFiles: 0 }
        };
      }

      // Parse again to get statistics
      let patches = [];
      if (typeof diffData === "string") {
        patches = parsePatch(diffData);
      } else {
        const unifiedDiff = this.convertBitbucketToUnifiedDiff(diffData);
        if (unifiedDiff) {
          patches = parsePatch(unifiedDiff);
        }
      }

      const summary = this.getChangesSummary(patches);
      return { ...result, summary };
    } catch (error) {
      logger.warn("Failed to analyze diff:", error.message);
      return { 
        codeChanges: "", 
        hasChanges: false, 
        summary: { addedLines: 0, removedLines: 0, modifiedFiles: 0 }
      };
    }
  }
}

export default UnidiffProcessor;

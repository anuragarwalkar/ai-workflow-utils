/**
 * Bitbucket-specific diff processing utilities
 */
class BitbucketDiffProcessor {
  static processLine(line, segment) {
    let prefix = ' '; // context line
    if (segment.type === 'ADDED') {
      prefix = '+';
    } else if (segment.type === 'REMOVED') {
      prefix = '-';
    }
    return `${prefix}${line.line}\n`;
  }

  static processSegment(segment) {
    if (!segment.lines || !Array.isArray(segment.lines)) {
      return '';
    }

    return segment.lines.map(line => this.processLine(line, segment)).join('');
  }

  static processHunk(hunk, hunkIndex) {
    let content = `\n**Hunk ${hunkIndex + 1}**`;
    if (hunk.context) {
      content += ` (${hunk.context})`;
    }
    content += `:\n`;
    content += `Lines: ${hunk.sourceLine}-${hunk.sourceLine + hunk.sourceSpan - 1} → ${hunk.destinationLine}-${hunk.destinationLine + hunk.destinationSpan - 1}\n\n`;
    content += `\`\`\`diff\n`;

    if (hunk.segments && Array.isArray(hunk.segments)) {
      content += hunk.segments
        .map(segment => this.processSegment(segment))
        .join('');
    }

    content += `\`\`\`\n\n`;
    return content;
  }

  static processBitbucketDiff(diffData) {
    let codeChanges = '';
    let hasChanges = false;

    if (diffData && diffData.diffs && Array.isArray(diffData.diffs)) {
      diffData.diffs.forEach((file, index) => {
        const fileName =
          file.source?.toString || file.destination?.toString || 'Unknown file';
        codeChanges += `### File ${index + 1}: ${fileName}\n`;

        if (file.hunks && Array.isArray(file.hunks)) {
          file.hunks.forEach((hunk, hunkIndex) => {
            codeChanges += this.processHunk(hunk, hunkIndex);
            hasChanges = true;
          });
        }
        codeChanges += `\n---\n\n`;
      });
    }

    return { codeChanges, hasChanges };
  }
}

export default BitbucketDiffProcessor;

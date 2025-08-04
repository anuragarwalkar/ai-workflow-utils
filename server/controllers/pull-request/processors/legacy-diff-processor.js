/**
 * Legacy diff format processing utilities
 */
class LegacyDiffProcessor {
  static processLegacyDiff(diffData) {
    let codeChanges = '';
    let hasChanges = false;

    if (diffData && diffData.values && Array.isArray(diffData.values)) {
      diffData.values.forEach((file, index) => {
        const fileName =
          file.srcPath?.toString ||
          file.path?.toString ||
          file.source?.toString ||
          'Unknown file';
        codeChanges += `### File ${index + 1}: ${fileName}\n`;

        if (file.hunks && Array.isArray(file.hunks)) {
          file.hunks.forEach((hunk, hunkIndex) => {
            codeChanges += `\n**Hunk ${hunkIndex + 1}**:\n`;
            if (hunk.oldLine !== undefined && hunk.newLine !== undefined) {
              codeChanges += `Lines: ${hunk.oldLine} → ${hunk.newLine}\n`;
            }
            codeChanges += `\`\`\`diff\n`;

            if (hunk.lines && Array.isArray(hunk.lines)) {
              hunk.lines.forEach(line => {
                hasChanges = true;
                if (line.left && line.right) {
                  codeChanges += `-${line.left}\n+${line.right}\n`;
                } else if (line.left) {
                  codeChanges += `-${line.left}\n`;
                } else if (line.right) {
                  codeChanges += `+${line.right}\n`;
                } else if (line.content) {
                  let prefix = ' ';
                  if (line.type === 'ADDED') {
                    prefix = '+';
                  } else if (line.type === 'REMOVED') {
                    prefix = '-';
                  }
                  codeChanges += `${prefix}${line.content}\n`;
                } else if (typeof line === 'string') {
                  codeChanges += `${line}\n`;
                }
              });
            } else if (hunk.content) {
              hasChanges = true;
              codeChanges += `${hunk.content}\n`;
            }
            codeChanges += `\`\`\`\n\n`;
          });
        } else if (file.content || file.diff) {
          hasChanges = true;
          codeChanges += `\n\`\`\`diff\n`;
          codeChanges += `${file.content || file.diff}\n`;
          codeChanges += `\`\`\`\n\n`;
        }
        codeChanges += `\n---\n\n`;
      });
    }

    return { codeChanges, hasChanges };
  }
}

export default LegacyDiffProcessor;

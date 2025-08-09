import logger from '../../../logger.js';

/**
 * Service for parsing PR content from AI-generated text
 */
class PRContentParser {
  /**
   * Parse streaming content to extract title and description in real-time
   */
  static parseStreamingContent(content) {
    // Try structured parsing first
    const structuredResult = this.parseStructuredContent(content);
    if (structuredResult.title || structuredResult.description) {
      return structuredResult;
    }

    // Fallback to simple parsing
    return this.parseFallbackContent(content);
  }

  /**
   * Parse structured content with markers
   */
  static parseStructuredContent(content) {
    const lines = content.split('\n');
    let title = '';
    const description = content.trim(); // Always put entire content in description
    let foundTitle = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for title markers and extract just the title
      if (!foundTitle && this.isTitleLine(line)) {
        foundTitle = true;
        // Extract title from the same line if it contains content after the marker
        const titleMatch =
          line.match(/\*\*title:\*\*\s*(.*)/i) ||
          line.match(/title:\s*(.*)/i) ||
          line.match(/##?\s*title:?\s*(.*)/i);

        if (titleMatch && titleMatch[1] && titleMatch[1].trim()) {
          title = titleMatch[1].trim();
        } else {
          // Look for title in the next non-empty lines
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !this.isDescriptionLine(nextLine)) {
              title = nextLine;
              break;
            } else if (this.isDescriptionLine(nextLine)) {
              break;
            }
          }
        }
        break; // Stop after finding title
      }
    }

    // If no title found, try to extract from first content line after title marker
    if (!foundTitle && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (this.isTitleLine(line)) {
          // Found title marker, get the next non-empty line
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !this.isDescriptionLine(nextLine)) {
              title = nextLine.replace(/^\*\*|\*\*$/g, '').trim(); // Remove markdown bold
              foundTitle = true;
              break;
            }
          }
          break;
        }
      }
    }

    // If still no title found, try to extract from first non-empty line
    if (!foundTitle && lines.length > 0) {
      for (const line of lines) {
        const cleanLine = line.trim();
        if (
          cleanLine &&
          cleanLine.length < 100 &&
          !this.isDescriptionLine(cleanLine)
        ) {
          title = cleanLine.replace(/^\*\*|\*\*$/g, '').trim(); // Remove markdown bold
          break;
        }
      }
    }

    // Fallback title if none found
    if (!title) {
      title = 'Pull Request';
    }

    return { title, description }; // Description always contains full content
  }

  /**
   * Check if line contains title marker
   */
  static isTitleLine(line) {
    return (
      line.toLowerCase().includes('title:') ||
      line.toLowerCase().includes('pr title:') ||
      line.toLowerCase().includes('pull request title:') ||
      line.toLowerCase().includes('**title:**') ||
      line.toLowerCase().includes('## title') ||
      line.toLowerCase().includes('# title')
    );
  }

  /**
   * Check if line contains description marker
   */
  static isDescriptionLine(line) {
    return (
      line.toLowerCase().includes('description:') ||
      line.toLowerCase().includes('pr description:') ||
      line.toLowerCase().includes('pull request description:') ||
      line.toLowerCase().includes('**description:**') ||
      line.toLowerCase().includes('## description') ||
      line.toLowerCase().includes('# description')
    );
  }

  /**
   * Fallback parsing when no structured markers found
   */
  static parseFallbackContent(content) {
    if (content.length < 50) {
      return { title: content.trim(), description: '' };
    }

    const sections = content.split('\n\n');
    if (sections.length >= 2) {
      return {
        title: sections[0].trim(),
        description: sections.slice(1).join('\n\n').trim(),
      };
    }

    // Single section - treat first line as title, rest as description
    const firstLineEnd = content.indexOf('\n');
    if (firstLineEnd > 0) {
      return {
        title: content.substring(0, firstLineEnd).trim(),
        description: content.substring(firstLineEnd + 1).trim(),
      };
    }

    return { title: content.trim(), description: '' };
  }

  /**
   * Extract title and description from template-generated content
   */
  static extractTitleAndDescriptionFromContent(content) {
    if (!content || content.trim() === '') {
      return {
        title: 'PR Title',
        description: 'PR Description',
      };
    }

    // Try to split content into title and description based on common patterns
    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return {
        title: 'PR Title',
        description: content.trim(),
      };
    }

    // If only one line, use it as title
    if (lines.length === 1) {
      return {
        title: lines[0].trim(),
        description: lines[0].trim(),
      };
    }

    // If multiple lines, first line is typically title, rest is description
    const title = lines[0].trim();
    const description = lines.slice(1).join('\n').trim();

    return {
      title: title || 'PR Title',
      description: description || title || 'PR Description',
    };
  }
}

export default PRContentParser;

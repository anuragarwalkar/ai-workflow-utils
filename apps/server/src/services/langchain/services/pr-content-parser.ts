/**
 * Service for parsing PR content from AI-generated text
 */
class PRContentParser {
  /**
   * Parse streaming content to extract title and description in real-time
   */
  static parseStreamingContent(content: string): { title: string; description: string } {
    const structuredResult = this.parseStructuredContent(content);
    if (structuredResult.title || structuredResult.description) {
      return structuredResult;
    }

    return this.parseFallbackContent(content);
  }

  /**
   * Parse structured content with markers
   */
  static parseStructuredContent(content: string): { title: string; description: string } {
    const lines = content.split('\n');
    let title = '';
    const description = content.trim();
    let foundTitle = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!foundTitle && this.isTitleLine(line)) {
        foundTitle = true;
        const titleMatch =
          line.match(/\*\*title:\*\*\s*(.*)/i) ||
          line.match(/title:\s*(.*)/i) ||
          line.match(/##?\s*title:?\s*(.*)/i);

        if (titleMatch && titleMatch[1] && titleMatch[1].trim()) {
          title = titleMatch[1].trim();
        } else {
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
        break;
      }
    }

    if (!foundTitle && lines.length > 0) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (this.isTitleLine(line)) {
          for (let j = i + 1; j < lines.length; j++) {
            const nextLine = lines[j].trim();
            if (nextLine && !this.isDescriptionLine(nextLine)) {
              title = nextLine.replace(/^\*\*|\*\*$/g, '').trim();
              foundTitle = true;
              break;
            }
          }
          break;
        }
      }
    }

    if (!foundTitle && lines.length > 0) {
      for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine && cleanLine.length < 100 && !this.isDescriptionLine(cleanLine)) {
          title = cleanLine.replace(/^\*\*|\*\*$/g, '').trim();
          break;
        }
      }
    }

    if (!title) {
      title = 'Pull Request';
    }

    return { title, description };
  }

  /**
   * Check if line contains title marker
   */
  static isTitleLine(line: string): boolean {
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
  static isDescriptionLine(line: string): boolean {
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
  static parseFallbackContent(content: string): { title: string; description: string } {
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
  static extractTitleAndDescriptionFromContent(content: string): { title: string; description: string } {
    if (!content || content.trim() === '') {
      return {
        title: 'PR Title',
        description: 'PR Description',
      };
    }

    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      return {
        title: 'PR Title',
        description: content.trim(),
      };
    }

    if (lines.length === 1) {
      return {
        title: lines[0].trim(),
        description: lines[0].trim(),
      };
    }

    const title = lines[0].trim();
    const description = lines.slice(1).join('\n').trim();

    return {
      title: title || 'PR Title',
      description: description || title || 'PR Description',
    };
  }
}

export default PRContentParser;

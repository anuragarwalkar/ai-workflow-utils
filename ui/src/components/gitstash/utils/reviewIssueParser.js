/**
 * Utility for parsing AI PR review Markdown into structured issues
 */

/**
 * Parses markdown review content into an array of structured issues.
 * Looks for file sections (e.g., '## File:' or '### File:') and issue headers (e.g., '### [Minor] Title').
 * 
 * @param {string} markdown - The raw markdown review content
 * @returns {Array} Array of issue objects
 */
export const parseReviewIssues = (markdown) => {
  if (!markdown || typeof markdown !== 'string') return [];

  const issues = [];
  const lines = markdown.split('\n');
  
  let currentFile = 'General';
  let currentIssue = null;
  let currentIssueContent = [];
  let issueCounter = 0;

  // Regex patterns
  const fileHeaderRegex = /^(?:#{2,4}|\*\*)\s*(?:File|In|For)?\s*[`*]?([^`*:]+)[`*]?\s*:?/i;
  const issueHeaderRegex = /^(?:#{2,5}|\-|\*)\s*(?:\[([^\]]+)\])?\s*(.+)$/;
  const severityKeywords = ['critical', 'major', 'minor', 'info', 'suggestion', 'note', 'warning', 'error'];

  // Helper to save current issue
  const saveCurrentIssue = () => {
    if (currentIssue) {
      currentIssue.description = currentIssueContent.join('\n').trim();
      
      // Only save if it has a title or meaningful description
      if (currentIssue.title || currentIssue.description.length > 20) {
        // Assign a default title if missing
        if (!currentIssue.title) {
          const firstLine = currentIssue.description.split('\n')[0].replace(/^#+\s*/, '').substring(0, 50);
          currentIssue.title = firstLine + (currentIssue.description.length > 50 ? '...' : '');
        }
        
        issues.push({ ...currentIssue });
      }
      currentIssueContent = [];
    }
  };

  // Helper to determine if a string contains a severity
  const extractSeverity = (bracketText, titleText) => {
    let rawSeverity = bracketText || '';
    let titleWithoutSeverity = titleText || '';

    // If we have explicit brackets like [Major]
    if (rawSeverity) {
      const lowerSev = rawSeverity.toLowerCase();
      if (severityKeywords.some(k => lowerSev.includes(k))) {
        return { 
          severity: rawSeverity.trim(), 
          title: titleWithoutSeverity.trim() 
        };
      }
    }

    // Check if the title starts with a severity (e.g., "**Major:** Some issue")
    const match = titleText.match(/^(?:\*\*)?(Critical|Major|Minor|Info|Suggestion|Warning|Error)(?:\*\*)?\s*:\s*(.+)$/i);
    if (match) {
      return {
        severity: match[1],
        title: match[2].trim()
      };
    }

    return { severity: 'Info', title: titleText.trim() };
  };

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Track code blocks so we don't parse headers inside them
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentIssue) {
        currentIssueContent.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentIssue) {
        currentIssueContent.push(line);
      }
      continue;
    }

    // Check if line is a file header (e.g., "## File: src/index.js")
    const fileMatch = line.match(fileHeaderRegex);
    if (fileMatch && line.toLowerCase().includes('file')) {
      saveCurrentIssue();
      currentFile = fileMatch[1].trim();
      currentIssue = null;
      continue;
    }

    // Check if line is an issue header (starts with ### or -)
    // We only treat it as an issue header if it looks like a distinct item
    const isHeader = line.startsWith('###') || line.startsWith('####');
    const isListItem = (line.startsWith('- ') || line.startsWith('* ')) && (line.includes('[') || severityKeywords.some(s => line.toLowerCase().includes(s + ':')));
    
    if (isHeader || isListItem) {
      const issueMatch = line.match(issueHeaderRegex);
      if (issueMatch) {
        const { severity, title } = extractSeverity(issueMatch[1], issueMatch[2]);
        
        // If it's a generic header like "Summary" or "Overall", don't treat it as a specific issue
        const lowerTitle = title.toLowerCase();
        if (['summary', 'overview', 'conclusion', 'overall'].some(k => lowerTitle.includes(k)) && !issueMatch[1]) {
           if (currentIssue) {
             currentIssueContent.push(line);
           }
           continue;
        }

        saveCurrentIssue();
        
        issueCounter++;
        currentIssue = {
          id: `issue-${Date.now()}-${issueCounter}`,
          file: currentFile,
          severity: severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase(),
          title: title.replace(/\*\*/g, '').trim(), // Remove bold markup from title
          posted: false,
        };
        continue;
      }
    }

    // If we're accumulating content for an issue, add the line
    if (currentIssue) {
      currentIssueContent.push(line);
    } else if (line.trim().length > 0) {
      // If we don't have an issue yet but find content, start a generic one
      // (This handles flat reviews without sub-headers)
      if (!['summary', 'overview', 'code review'].some(k => line.toLowerCase().includes(k) && line.startsWith('#'))) {
        issueCounter++;
        currentIssue = {
          id: `issue-${Date.now()}-${issueCounter}`,
          file: currentFile,
          severity: 'Info',
          title: 'General Comment',
          posted: false,
        };
        currentIssueContent.push(line);
      }
    }
  }

  // Save the last issue
  saveCurrentIssue();

  // If we couldn't parse anything specific, wrap the whole thing as one issue
  if (issues.length === 0 && markdown.trim().length > 0) {
    return [{
      id: `issue-${Date.now()}-1`,
      file: 'General',
      severity: 'Info',
      title: 'Overall Review',
      description: markdown,
      posted: false,
    }];
  }

  return issues;
};

/**
 * Helper to determine the MUI color for a severity
 */
export const getSeverityColor = (severity) => {
  const lowerSev = severity?.toLowerCase() || '';
  if (['critical', 'error'].some(s => lowerSev.includes(s))) return 'error';
  if (['major', 'warning'].some(s => lowerSev.includes(s))) return 'warning';
  if (['minor', 'note'].some(s => lowerSev.includes(s))) return 'info';
  if (lowerSev === 'suggestion') return 'success';
  return 'default';
};

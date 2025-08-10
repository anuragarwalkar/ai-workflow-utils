import logger from '../../../logger.js';
import { toApiFormat } from '../models/template.js'; 

export function processExport(templates, settings) {
  try {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      templates: templates
        .filter(template => !template.isDefault)
        .map(template => ({
          name: template.name,
          issueType: template.issueType,
          content: template.content,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          variables: template.variables,
        })),
      settings: {
        defaultIssueTypes: settings.defaultIssueTypes,
        maxTemplatesPerType: settings.maxTemplatesPerType,
        allowCustomIssueTypes: settings.allowCustomIssueTypes,
        autoBackup: settings.autoBackup,
        backupRetentionDays: settings.backupRetentionDays,
      },
      metadata: {
        totalTemplates: templates.filter(t => !t.isDefault).length,
        issueTypes: [
          ...new Set(templates.filter(t => !t.isDefault).map(t => t.issueType)),
        ],
      },
    };
    logger.info(`Processed export data with ${exportData.templates.length} templates`);
    return exportData;
  } catch (error) {
    logger.error('Error processing export data:', error);
    throw new Error('Failed to process export data');
  }
}

export function processImport(importData) {
  try {
    const processedTemplates = importData.templates.map(template => ({
      ...template,
      id: undefined,
      isDefault: false,
      isActive: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const processedData = {
      templates: processedTemplates,
      settings: importData.settings || {},
      importStats: {
        templatesCount: processedTemplates.length,
        issueTypes: [...new Set(processedTemplates.map(t => t.issueType))],
        importDate: new Date().toISOString(),
      },
    };
    logger.info(`Processed import data with ${processedData.templates.length} templates`);
    return processedData;
  } catch (error) {
    logger.error('Error processing import data:', error);
    throw new Error('Failed to process import data');
  }
}

export function processDuplication(originalTemplate, newName) {
  try {
    const processedTemplate = {
      name: newName,
      issueType: originalTemplate.issueType,
      content: originalTemplate.content,
      isDefault: false,
      isActive: false,
    };
    logger.info(`Processed template duplication: ${originalTemplate.name} -> ${newName}`);
    return processedTemplate;
  } catch (error) {
    logger.error('Error processing template duplication:', error);
    throw new Error('Failed to process template duplication');
  }
}

export function processContentAnalysis(content) {
  try {
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const variables = [];
    const matches = [];
    let match;
    while ((match = variablePattern.exec(content)) !== null) {
      const variable = match[1].trim();
      matches.push({ variable, position: match.index, length: match[0].length });
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    const analysis = {
      variables,
      variableCount: variables.length,
      totalMatches: matches.length,
      matches,
      hasVariables: variables.length > 0,
      complexity: calculateComplexity(content, variables.length),
    };
    logger.debug(`Content analysis completed: ${variables.length} unique variables found`);
    return analysis;
  } catch (error) {
    logger.error('Error processing content analysis:', error);
    throw new Error('Failed to analyze template content');
  }
}

function calculateComplexity(content, variableCount) {
  const contentLength = content.length;
  let score = 0;
  if (contentLength > 1000) score += 2;
  else if (contentLength > 500) score += 1;
  if (variableCount > 10) score += 2;
  else if (variableCount > 5) score += 1;
  if (content.includes('\n')) score += 1;
  if (content.includes('{{#if') || content.includes('{{#each')) score += 2;
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export function processApiResponse(templates) {
  try {
    const processedTemplates = templates.map(template => toApiFormat(template));
    logger.debug(`Processed ${processedTemplates.length} templates for API response`);
    return processedTemplates;
  } catch (error) {
    logger.error('Error processing API response:', error);
    throw new Error('Failed to process templates for API response');
  }
}

export function processSearch(templates, filters = {}) {
  try {
    let filteredTemplates = [...templates];
    if (filters.issueType) {
      filteredTemplates = filteredTemplates.filter(
        template => template.issueType === filters.issueType,
      );
    }
    if (filters.name) {
      const nameFilter = filters.name.toLowerCase();
      filteredTemplates = filteredTemplates.filter(template =>
        template.name.toLowerCase().includes(nameFilter),
      );
    }
    if (filters.isActive !== undefined) {
      filteredTemplates = filteredTemplates.filter(
        template => template.isActive === filters.isActive,
      );
    }
    if (filters.isDefault !== undefined) {
      filteredTemplates = filteredTemplates.filter(
        template => template.isDefault === filters.isDefault,
      );
    }
    if (filters.sortBy) {
      filteredTemplates.sort((a, b) => {
        const aValue = a[filters.sortBy];
        const bValue = b[filters.sortBy];
        if (filters.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }
    logger.debug(`Processed search: ${filteredTemplates.length} results from ${templates.length} templates`);
    return filteredTemplates;
  } catch (error) {
    logger.error('Error processing template search:', error);
    throw new Error('Failed to process template search');
  }
}

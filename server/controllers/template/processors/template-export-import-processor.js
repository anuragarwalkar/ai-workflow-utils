import logger from '../../../logger.js';

/**
 * Processor for template export/import operations
 */
class TemplateExportImportProcessor {
  /**
   * Process templates for export
   * @param {Array} templates - Templates to export
   * @param {Object} settings - Template settings
   * @returns {Object} Processed export data
   */
  static processExport(templates, settings) {
    try {
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        templates: templates
          .filter(template => !template.isDefault) // Only export user templates
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
            ...new Set(
              templates.filter(t => !t.isDefault).map(t => t.issueType),
            ),
          ],
        },
      };

      logger.info(
        `Processed export data with ${exportData.templates.length} templates`,
      );
      return exportData;
    } catch (error) {
      logger.error('Error processing export data:', error);
      throw new Error('Failed to process export data');
    }
  }

  /**
   * Process import data and prepare for database insertion
   * @param {Object} importData - Raw import data
   * @returns {Object} Processed import data
   */
  static processImport(importData) {
    try {
      const processedTemplates = importData.templates.map(template => ({
        ...template,
        id: undefined, // Let the system generate new IDs
        isDefault: false, // Imported templates are never default
        isActive: false, // Imported templates start as inactive
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

      logger.info(
        `Processed import data with ${processedData.templates.length} templates`,
      );
      return processedData;
    } catch (error) {
      logger.error('Error processing import data:', error);
      throw new Error('Failed to process import data');
    }
  }

  /**
   * Process template data for duplication
   * @param {Object} originalTemplate - Original template data
   * @param {string} newName - New name for duplicate
   * @returns {Object} Processed template data for creation
   */
  static processDuplication(originalTemplate, newName) {
    try {
      const processedTemplate = {
        name: newName,
        issueType: originalTemplate.issueType,
        content: originalTemplate.content,
        isDefault: false,
        isActive: false,
      };

      logger.info(
        `Processed template duplication: ${originalTemplate.name} -> ${newName}`,
      );
      return processedTemplate;
    } catch (error) {
      logger.error('Error processing template duplication:', error);
      throw new Error('Failed to process template duplication');
    }
  }

  /**
   * Process template content for variable extraction
   * @param {string} content - Template content
   * @returns {Object} Processed content analysis
   */
  static processContentAnalysis(content) {
    try {
      const variablePattern = /\{\{([^}]+)\}\}/g;
      const variables = [];
      const matches = [];
      let match;

      while ((match = variablePattern.exec(content)) !== null) {
        const variable = match[1].trim();
        matches.push({
          variable,
          position: match.index,
          length: match[0].length,
        });

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
        complexity: this.calculateComplexity(content, variables.length),
      };

      logger.debug(
        `Content analysis completed: ${variables.length} unique variables found`,
      );
      return analysis;
    } catch (error) {
      logger.error('Error processing content analysis:', error);
      throw new Error('Failed to analyze template content');
    }
  }

  /**
   * Calculate template complexity score
   * @private
   * @param {string} content - Template content
   * @param {number} variableCount - Number of variables
   * @returns {string} Complexity level
   */
  static calculateComplexity(content, variableCount) {
    const contentLength = content.length;
    let score = 0;

    // Length factor
    if (contentLength > 1000) score += 2;
    else if (contentLength > 500) score += 1;

    // Variable factor
    if (variableCount > 10) score += 2;
    else if (variableCount > 5) score += 1;

    // Structure complexity (basic heuristics)
    if (content.includes('\n')) score += 1;
    if (content.includes('{{#if') || content.includes('{{#each')) score += 2;

    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }

  /**
   * Process templates for API response formatting
   * @param {Array} templates - Template instances
   * @returns {Array} Formatted templates for API
   */
  static processApiResponse(templates) {
    try {
      const processedTemplates = templates.map(template =>
        template.toApiFormat(),
      );

      logger.debug(
        `Processed ${processedTemplates.length} templates for API response`,
      );
      return processedTemplates;
    } catch (error) {
      logger.error('Error processing API response:', error);
      throw new Error('Failed to process templates for API response');
    }
  }

  /**
   * Process template search and filtering
   * @param {Array} templates - Template instances
   * @param {Object} filters - Search filters
   * @returns {Array} Filtered templates
   */
  static processSearch(templates, filters = {}) {
    try {
      let filteredTemplates = [...templates];

      // Filter by issue type
      if (filters.issueType) {
        filteredTemplates = filteredTemplates.filter(
          template => template.issueType === filters.issueType,
        );
      }

      // Filter by name (case-insensitive partial match)
      if (filters.name) {
        const nameFilter = filters.name.toLowerCase();
        filteredTemplates = filteredTemplates.filter(template =>
          template.name.toLowerCase().includes(nameFilter),
        );
      }

      // Filter by active status
      if (filters.isActive !== undefined) {
        filteredTemplates = filteredTemplates.filter(
          template => template.isActive === filters.isActive,
        );
      }

      // Filter by default status
      if (filters.isDefault !== undefined) {
        filteredTemplates = filteredTemplates.filter(
          template => template.isDefault === filters.isDefault,
        );
      }

      // Sort results
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

      logger.debug(
        `Processed search: ${filteredTemplates.length} results from ${templates.length} templates`,
      );
      return filteredTemplates;
    } catch (error) {
      logger.error('Error processing template search:', error);
      throw new Error('Failed to process template search');
    }
  }
}

export default TemplateExportImportProcessor;

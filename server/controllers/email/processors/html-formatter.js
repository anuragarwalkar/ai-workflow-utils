import logger from '../../../logger.js';

/**
 * HtmlFormatter - Processor for formatting table data into HTML email content
 */
class HtmlFormatter {
  /**
   * Formats table data into grouped HTML email content
   * @param {Array} tableData - 2D array representing table data
   * @returns {string} Formatted HTML content
   */
  static formatTableByGroup(tableData) {
    try {
      if (!Array.isArray(tableData) || tableData.length === 0) {
        throw new Error('Invalid table data for formatting');
      }

      const columnsToRemove = [
        'Value Stream',
        'Value Stream Version',
        'Remarks (Optional)',
      ];
      const groupByFields = ['Value Stream', 'Value Stream Version'];

      // Split headers and rows
      const [headers, ...rows] = tableData;

      // Build column index map before filtering
      const colIndex = Object.fromEntries(headers.map((h, i) => [h, i]));

      // Create filtered headers and map of indexes to keep
      const keepIndexes = headers
        .map((h, i) => ({ h, i }))
        .filter(({ h }) => !columnsToRemove.includes(h));

      const filteredHeaders = keepIndexes.map(col => col.h);

      // Group rows using original (unfiltered) headers
      const grouped = this._groupRowsByFields(rows, colIndex, groupByFields);

      // Generate HTML for each group
      let html = '';
      for (const key in grouped) {
        const group = grouped[key];
        html += this._generateGroupHtml(
          group,
          groupByFields,
          filteredHeaders,
          keepIndexes,
        );
      }

      logger.info('Table formatted successfully', {
        groupCount: Object.keys(grouped).length,
        totalRows: rows.length,
      });

      return html;
    } catch (error) {
      logger.error('Failed to format table data', {
        error: error.message,
      });
      throw new Error(`Table formatting failed: ${error.message}`);
    }
  }

  /**
   * Groups table rows by specified fields
   * @private
   * @param {Array} rows - Table rows
   * @param {Object} colIndex - Column index mapping
   * @param {Array} groupByFields - Fields to group by
   * @returns {Object} Grouped data
   */
  static _groupRowsByFields(rows, colIndex, groupByFields) {
    const grouped = {};
    const lastGroup = {};

    rows.forEach(row => {
      const currentGroup = {};
      groupByFields.forEach(field => {
        const val = row[colIndex[field]];
        currentGroup[field] = val || lastGroup[field] || '';
        if (val) lastGroup[field] = val;
      });

      const key = groupByFields.map(f => currentGroup[f]).join('__');

      if (!grouped[key]) {
        grouped[key] = {
          groupValues: currentGroup,
          rows: [],
        };
      }

      grouped[key].rows.push(row);
    });

    return grouped;
  }

  /**
   * Generates HTML for a single group
   * @private
   * @param {Object} group - Group data
   * @param {Array} groupByFields - Fields used for grouping
   * @param {Array} filteredHeaders - Headers to display
   * @param {Array} keepIndexes - Column indexes to keep
   * @returns {string} HTML for the group
   */
  static _generateGroupHtml(
    group,
    groupByFields,
    filteredHeaders,
    keepIndexes,
  ) {
    const groupTitle = groupByFields
      .map(f => `${f}: ${group.groupValues[f]}`)
      .join(' | ');

    let html = `<div style="background-color:#eef3f7;padding:10px;font-weight:bold;text-align:left;border-left:4px solid #801C81;margin-top:30px;font-family:Arial,sans-serif;font-size:14px;">${groupTitle}</div>`;

    html += '<table style="width:100%;border-collapse:collapse;margin-top:10px;font-family:Arial,sans-serif;font-size:14px;">';

    // Generate table header
    html += '<thead><tr>';
    filteredHeaders.forEach(h => {
      html += `<th style="border:1px solid #ccc;padding:10px;background-color:#f2f2f2;text-align:center;vertical-align:middle;">${h}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Generate table rows
    group.rows.forEach(row => {
      html += '<tr>';
      keepIndexes.forEach(({ h, i }) => {
        const val = row[i] || '';
        html += this._generateTableCell(h, val);
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  /**
   * Generates HTML for a single table cell with appropriate formatting
   * @private
   * @param {string} header - Column header
   * @param {string} value - Cell value
   * @returns {string} HTML for the cell
   */
  static _generateTableCell(header, value) {
    const lower = header.toLowerCase();
    const tdStyle =
      'border:1px solid #ccc;padding:10px;text-align:left;vertical-align:middle;';

    if (lower.includes('jira') && value) {
      return `<td style="${tdStyle}"><a href="https://jira/app/${value}" style="color:#0645AD;text-decoration:none;">${value}</a></td>`;
    } else if (value && value.includes('.html')) {
      return `<td style="${tdStyle}"><a href="${value}" style="color:#0645AD;text-decoration:none;">${value.split('/').pop()}</a></td>`;
    } else {
      return `<td style="${tdStyle}">${value}</td>`;
    }
  }

  /**
   * Generates complete email body with formatted table
   * @param {Array} tableData - Table data to format
   * @param {Object} metadata - Email metadata
   * @param {string} metadata.version - Build version
   * @param {string} metadata.wikiUrl - Wiki URL
   * @returns {string} Complete email HTML
   */
  static generateCompleteEmailBody(tableData, { version, wikiUrl }) {
    const formattedTable = this.formatTableByGroup(tableData);
    const greeting = this._getTimeBasedGreeting();
    const formattedDate = this._formatDate();

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000;">
        <p>${greeting}</p>
        <p>We're pleased to share the latest update from our mobile app QA build. Please find the details below:</p>

        <ul>
        <li><strong>Date:</strong> ${formattedDate}</li>
        <li><strong>Current Build Version:</strong> ${version}</li>
        <li><strong>Status:</strong> Completed</li>
        <li><strong>Release Note URL:</strong> <a href="${wikiUrl}" target="_blank">${wikiUrl}</a></li>
        </ul>

        <p>This update includes important bug fixes, enhancements, and tasks related to the value streams. Scroll down to review the full list of changes:</p>
        
        ${formattedTable}

        <p>Please reach out if you need further details.</p>
        <p>Thank you</p>
      </div>
    `;
  }

  /**
   * Gets time-based greeting
   * @private
   * @returns {string} Appropriate greeting
   */
  static _getTimeBasedGreeting() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
      return 'Good morning, team,';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon, team,';
    } else if (hour >= 17 && hour < 22) {
      return 'Good evening, team,';
    } else {
      return 'Hello team,';
    }
  }

  /**
   * Formats date for display
   * @private
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  static _formatDate(date = new Date()) {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}

export { HtmlFormatter };

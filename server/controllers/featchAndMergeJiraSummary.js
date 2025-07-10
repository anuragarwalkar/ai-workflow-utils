const { fetchJiraSummaries } = require('./jiraController');

async function fetchAndMergeJiraSummary(tableData) {
  if (!Array.isArray(tableData) || tableData.length < 2) {
    throw new Error("Invalid table data");
  }

  const headers = tableData[0];
  const jiraKeyIndex = headers.indexOf('Jira URL');

  if (jiraKeyIndex === -1) {
    throw new Error("Missing 'Jira URL' column");
  }

  // Add 'Summary' column if not already present
  if (!headers.includes('Summary')) {
    headers.push('Summary');
  }

  // Extract Jira keys
  const issueKeys = tableData
    .slice(1)
    .map(row => row[jiraKeyIndex])
    .filter(Boolean);

  const summariesMap = await fetchJiraSummaries(issueKeys);

  // Append summaries to table
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];
    const jiraKey = row[jiraKeyIndex];
    row[headers.length - 1] = (summariesMap[jiraKey] || '');
  }

  return tableData;
}

module.exports = {
    fetchAndMergeJiraSummary,
}
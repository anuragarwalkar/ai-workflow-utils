const { extractTableAsArray } = require("./extractTableAsArray");
const { emailBody } = require('./htmlParser');
const { sendNotification} = require('./email');
const {fetchJiraSummaries} = require('./jiraController')

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
    .filter(Boolean); // skip empty keys

  const summariesMap = await fetchJiraSummaries(issueKeys);

  // Append summaries to table
  for (let i = 1; i < tableData.length; i++) {
    const row = tableData[i];
    const jiraKey = row[jiraKeyIndex];
    row[headers.length - 1] = (summariesMap[jiraKey] || ''); // add summary or blank
  }

  return tableData;
}

async function sendEmail(req, res) {
  const { version, dryRun = false} = req.query;

  const myHeaders = new Headers();

  myHeaders.append("Accept", "application/json");
  myHeaders.append("Authorization", `Basic ${process.env.WIKI_BASIC_AUTH}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  // UR atlassian page link
  const releaseNoteURL = process.env.WIKI_URL;

  const response = await fetch(releaseNoteURL, requestOptions);
  const htmlResponse = await response.text();
  
  const tableData = await extractTableAsArray(htmlResponse, version);

  const mergedTableDataWithJira = await fetchAndMergeJiraSummary(tableData);

  const emailBodyRes = emailBody(mergedTableDataWithJira, { releaseNoteURL, version })

  if(!dryRun) {
    await sendNotification('anurag.arwalkar@globant.com', `Release Notes QA Build : ${version}`, emailBodyRes)
  }

  res.status(200).send(emailBodyRes);
}

module.exports = {
  sendEmail,
};

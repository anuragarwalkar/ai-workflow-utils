const { extractTableAsArray } = require("./extractTableAsArray");
const { emailBody } = require('./htmlParser');
const { sendNotification} = require('./email');
const {fetchAndMergeJiraSummary} = require('./featchAndMergeJiraSummary');
const logger = require("../logger");

async function sendEmail(req, res) {
  const releaseNoteURL = process.env.WIKI_URL;
  const { version, dryRun = 'false'} = req.query;
  
  // Convert string to boolean
  const isDryRun = dryRun === 'true';
  
  const myHeaders = new Headers();

  myHeaders.append("Accept", "application/json");
  myHeaders.append("Authorization", `Basic ${process.env.WIKI_BASIC_AUTH}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(releaseNoteURL, requestOptions);
  const htmlResponse = await response.text();
  
  const tableData = await extractTableAsArray(htmlResponse, version);

  const mergedTableDataWithJira = await fetchAndMergeJiraSummary(tableData);

  const emailBodyRes = emailBody(mergedTableDataWithJira, { releaseNoteURL, version })

  if(!isDryRun) {
    await sendNotification('anurag.arwalkar@globant.com', `Release Notes QA Build : ${version}`, emailBodyRes)
    logger.info('Email notification sent');
  }

  res.status(200).send(emailBodyRes);
}

module.exports = {
  sendEmail,
};

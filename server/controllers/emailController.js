const { extractTableAsArray } = require("./extractTableAsArray");
const { emailBody } = require('./htmlParser');
const { sendNotification} = require('./email')

async function sendEmail(req, res) {
  const myHeaders = new Headers();
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Authorization", `Basic ${process.env.WIKI_BASIC_AUTH}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  // UR atlassian page link
  const releaseNoteURL = "https://wiki.app.aib.ie/display/CAD/Release+July-2025";

  const response = await fetch(releaseNoteURL, requestOptions);
  const htmlResponse = await response.text();

  const version = req.query.version;
  const tableData = await extractTableAsArray(htmlResponse, version);
  const emailBodyRes = emailBody(tableData, { releaseNoteURL, version })
  await sendNotification('anurag.arwalkar@globant.com', `Release Notes - QA Build ${version}`, emailBodyRes)
  res.status(200).send(emailBodyRes);
}

module.exports = {
  sendEmail,
};

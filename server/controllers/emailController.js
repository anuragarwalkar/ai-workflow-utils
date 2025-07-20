import { extractTableAsArray } from "./extractTableAsArray.js";
import { emailBody } from './htmlParser.js';
import { fetchAndMergeJiraSummary } from './featchAndMergeJiraSummary.js';

async function sendEmailController(req, res) {
  const { version } = req.query;
  const { wikiUrl, wikiBasicAuth } = req.body;

  const myHeaders = new Headers();

  myHeaders.append("Accept", "application/json");
  myHeaders.append("Authorization", `Basic ${wikiBasicAuth}`);

  const requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  const response = await fetch(wikiUrl, requestOptions);
  const htmlResponse = await response.text();
  
  const tableData = await extractTableAsArray(htmlResponse, version);

  const mergedTableDataWithJira = await fetchAndMergeJiraSummary(tableData);

  const emailBodyRes = emailBody(mergedTableDataWithJira, { wikiUrl, version });

  res.status(200).send(emailBodyRes);
}

export default sendEmailController;

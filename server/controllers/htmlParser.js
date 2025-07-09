function createHtmlTable(data) {
  const headers = data[0];
  const rows = data.slice(1);

  const html = `
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000;">
      <thead style="background-color: #f2f2f2;">
        <tr>${headers.map((col) => `<th>${col}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            ${headers
              .map((_, i) => {
                if (i === 1 && row[i]) {
                  return `<td><a href=${process.env.JIRA_URL}/browse/${row[i]}" target="_blank">${row[i]}</a></td>`;
                }
                return `<td>${row[i] || ""}</td>`;
              })
              .join("")}
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
  return html;
}

// Utility: format today's date
function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }); // e.g. "8 July 2025"
}

const emailBody = (tableData, { version, releaseNoteURL }) => `
  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000;">
    <p>Hello all,</p>

    <p>Here’s the daily update on our build release:</p>
    <ul>
      <li><strong>Date:</strong> ${formatDate()}</li>
      <li><strong>Current Build Version:</strong> ${version}</li>
      <li><strong>Status:</strong> Completed</li>
      <li><strong>Release Note URL:</strong> <a href="${releaseNoteURL}" target="_blank">${releaseNoteURL}</a></li>
    </ul>

    ${createHtmlTable(tableData)}

    <p>Regards,<br/>Anurag</p>
  </div>
`;

module.exports = {
   emailBody
}
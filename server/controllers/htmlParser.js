function formatTableSimple(data) {
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

function formatTableByGroup(tableData) {
  const [headers, ...rows] = tableData;

  const colIndex = Object.fromEntries(headers.map((h, i) => [h, i]));
  const groupByFields = ['Value Stream', 'Value Stream Version'];

  const grouped = {};
  let lastGroup = {};

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
        rows: []
      };
    }

    grouped[key].rows.push(row);
  });

  let html = `
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      th, td {
        border: 1px solid #ccc;
        padding: 10px;
        text-align: center;
        vertical-align: middle;
      }
      th {
        background-color: #f2f2f2;
      }
      .group-header {
        background-color: #eef3f7;
        padding: 10px;
        font-weight: bold;
        text-align: left; 
        border-left: 4px solid #801C81;
        margin-top: 30px;
      }
      a {
        color: #0645AD;
        text-decoration: none;
      }
    </style>
  `;

  for (const key in grouped) {
    const group = grouped[key];
    const firstRowspan = group.rows.length;

    // Add the nice visual header
    const groupTitle = groupByFields.map(f => `${f}: ${group.groupValues[f]}`).join(' | ');
    html += `<div class="group-header">${groupTitle}</div>`;

    html += `<table><thead><tr>`;
    headers.forEach(h => html += `<th>${h}</th>`);
    html += `</tr></thead><tbody>`;

    group.rows.forEach((row, rowIndex) => {
      html += `<tr>`;
      headers.forEach((h) => {
        const val = row[colIndex[h]] || '';
        const lower = h.toLowerCase();

        if (groupByFields.includes(h)) {
          if (rowIndex === 0) {
            html += `<td rowspan="${firstRowspan}">${val}</td>`;
          }
        } else {
          if (lower.includes('jira') && val) {
            html += `<td><a href="https://jira/app/${val}">${val}</a></td>`;
          } else if (val && val.includes('.html')) {
            html += `<td><a href="${val}">${val.split('/').pop()}</a></td>`;
          } else {
            html += `<td>${val}</td>`;
          }
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
  }

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

    ${formatTableByGroup(tableData)}

    <p>Regards,<br/>Anurag</p>
  </div>
`;

module.exports = {
   emailBody
}
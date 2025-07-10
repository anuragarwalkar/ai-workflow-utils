function formatTableByGroup(tableData) {
  const columnsToRemove = ['Value Stream', 'Value Stream Version', 'Remarks (Optional)'];
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

  let html = '';

  for (const key in grouped) {
    const group = grouped[key];

    const groupTitle = groupByFields.map(f => `${f}: ${group.groupValues[f]}`).join(' | ');
    html += `<div style="background-color:#eef3f7;padding:10px;font-weight:bold;text-align:left;border-left:4px solid #801C81;margin-top:30px;font-family:Arial,sans-serif;font-size:14px;">${groupTitle}</div>`;

    html += `<table style="width:100%;border-collapse:collapse;margin-top:10px;font-family:Arial,sans-serif;font-size:14px;">`;
    html += `<thead><tr>`;
    filteredHeaders.forEach(h => {
      html += `<th style="border:1px solid #ccc;padding:10px;background-color:#f2f2f2;text-align:center;vertical-align:middle;">${h}</th>`;
    });
    html += `</tr></thead><tbody>`;

    group.rows.forEach((row, rowIndex) => {
      html += `<tr>`;
      keepIndexes.forEach(({ h, i }) => {
        const val = row[i] || '';
        const lower = h.toLowerCase();
        const tdStyle = 'border:1px solid #ccc;padding:10px;text-align:center;vertical-align:middle;';

        if (lower.includes('jira') && val) {
          html += `<td style="${tdStyle}"><a href="https://jira/app/${val}" style="color:#0645AD;text-decoration:none;">${val}</a></td>`;
        } else if (val && val.includes('.html')) {
          html += `<td style="${tdStyle}"><a href="${val}" style="color:#0645AD;text-decoration:none;">${val.split('/').pop()}</a></td>`;
        } else {
          html += `<td style="${tdStyle}">${val}</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</tbody></table>`;
  }

  return html;
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
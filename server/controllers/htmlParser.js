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

    group.rows.forEach((row) => {
      html += `<tr>`;
      keepIndexes.forEach(({ h, i }) => {
        const val = row[i] || '';
        const lower = h.toLowerCase();
        const tdStyle = 'border:1px solid #ccc;padding:10px;text-align:left;vertical-align:middle;';

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

function getTimeBasedGreeting() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Good morning, team,";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon, team,";
  } else if (hour >= 17 && hour < 22) {
    return "Good evening, team,";
  } else {
    return "Hello team,";
  }
}

export const emailBody = (tableData, { version, wikiUrl }) => `
  <div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #000;">
    <p>${getTimeBasedGreeting()}</p>
    <p>We’re pleased to share the latest update from our mobile app QA build. Please find the details below:</p>

    <ul>
    <li><strong>Date:</strong> ${formatDate()}</li>
    <li><strong>Current Build Version:</strong> ${version}</li>
    <li><strong>Status:</strong> Completed</li>
    <li><strong>Release Note URL:</strong> <a href="${wikiUrl}" target="_blank">${wikiUrl}</a></li>
    </ul>

    <p>This update includes important bug fixes, enhancements, and tasks related to the value streams. Scroll down to review the full list of changes:</p>
    
    ${formatTableByGroup(tableData)}

    <p>Regards,<br/>Anurag</p>
  </div>
`;

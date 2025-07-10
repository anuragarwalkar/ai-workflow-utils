const path = require("path");
const { JSDOM } = require("jsdom");

async function extractTableAsArray(htmlString, buildNumber) {
  const dom = new JSDOM(htmlString);
  const document = dom.window.document;

  const safeBuild = buildNumber
    .replace(/\./g, "\\.")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
  const h2 = document.querySelector(`h2[id*="${safeBuild}"]`);
  if (!h2) throw new Error(`Heading not found for build: ${buildNumber}`);

  let next = h2.nextElementSibling;
  let table;

  while (next && !/^H[1-6]$/i.test(next.tagName)) {
    if (next.matches(".table-wrap") && next.querySelector("table")) {
      table = next.querySelector("table");
      break;
    }
    next = next.nextElementSibling;
  }

  if (!table) throw new Error("Table not found for the build section.");

  // Parse and clean table
  const rows = Array.from(table.querySelectorAll("tr"));
  const data = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll("th, td"));
    return cells.map((cell) => {
      let text = cell.textContent.replace(/\s+/g, " ").trim();
      text = text.replace(/\s+-\s+Getting issue details.*$/i, ""); // <- cleanup
      return text;
    });
  });

  // Filter out rows where ALL cells are empty
  const filteredData = data.filter((row) => {
    return !row.every(cell => cell.trim() === '');
  });

  return filteredData;
}

module.exports = {
  extractTableAsArray,
};

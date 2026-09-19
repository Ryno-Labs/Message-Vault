const SHEET_NAME = 'Messages';

function doGet(e) {
  try {
    const callback = sanitizeCallback_(e && e.parameter ? e.parameter.callback : '');
    const messages = getMessages_();
    const payload = JSON.stringify({ ok: true, messages: messages });

    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${payload});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const callback = sanitizeCallback_(e && e.parameter ? e.parameter.callback : '');
    const payload = JSON.stringify({ ok: false, error: String(error.message || error) });

    if (callback) {
      return ContentService
        .createTextOutput(`${callback}(${payload});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getMessages_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet tab "${SHEET_NAME}" was not found.`);

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const index = {
    id: headers.indexOf('id'),
    project: headers.indexOf('project'),
    category: headers.indexOf('category'),
    title: headers.indexOf('title'),
    message: headers.indexOf('message'),
    active: headers.indexOf('active'),
    sort: headers.indexOf('sort')
  };

  ['project', 'category', 'title', 'message'].forEach(name => {
    if (index[name] === -1) throw new Error(`Missing required column: ${name}`);
  });

  return values.slice(1)
    .map((row, rowIndex) => ({
      id: index.id === -1 ? rowIndex + 2 : (row[index.id] || rowIndex + 2),
      project: row[index.project] || 'General',
      category: row[index.category] || 'General',
      title: row[index.title] || 'Untitled',
      message: row[index.message] || '',
      active: index.active === -1 ? true : parseActive_(row[index.active]),
      sort: index.sort === -1 ? 9999 : Number(row[index.sort] || 9999)
    }))
    .filter(item => item.active && item.message.trim() !== '')
    .sort((a, b) =>
      a.project.localeCompare(b.project) ||
      (a.sort - b.sort) ||
      a.category.localeCompare(b.category) ||
      a.title.localeCompare(b.title)
    )
    .map(({ active, sort, ...item }) => item);
}

function parseActive_(value) {
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return true;
  return !['false', 'no', '0', 'off', 'inactive'].includes(normalized);
}

function sanitizeCallback_(value) {
  const callback = String(value || '').trim();
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback) ? callback : '';
}

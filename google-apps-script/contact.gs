/**
 * Dream Needles — Contact Us → Google Sheet
 *
 * Receives contact-form submissions from the website's server and appends
 * them as rows. Setup steps are in SETUP.md, Part 5.
 *
 * Security: the website sends a shared secret with every request; requests
 * without the right secret are rejected. Store the secret in
 * Project Settings → Script properties as SHARED_SECRET (never in this code).
 */

const SHEET_NAME = "Submissions";
const HEADERS = [
  "Received at",
  "Name",
  "Email",
  "Phone",
  "Subject",
  "Message",
  "Reference",
];

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const expected =
      PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
    if (!expected || !safeEquals(String(body.secret || ""), expected)) {
      return json({ ok: false, error: "unauthorized" });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet();
      sheet.appendRow([
        new Date(),
        clean(body.name),
        clean(body.email),
        clean(body.phone),
        clean(body.subject),
        clean(body.message),
        clean(body.id),
      ]);
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) });
  }
}

/** Creates the "Submissions" tab with a header row on first use. */
function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

/** Plain text only, max 5000 chars; stops "=..." from running as a formula. */
function clean(value) {
  const text = String(value == null ? "" : value).slice(0, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

/** Compares secrets without leaking how many characters matched. */
function safeEquals(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * ==============================================================================
 * NTI SIGN-IN / SIGN-OUT SYSTEM — 100% FREE AUTOMATED DAILY SPREADSHEET SYNC
 * ==============================================================================
 * 
 * Target Accounts:
 * - Testing: maphallaamari@gmail.com
 * - Production: Linda's account (e.g. lindadv@ngi.ac.za / Linda's Gmail)
 * 
 * Instructions:
 * 1. Open Google Sheets (https://sheets.new) logged in with your Google account.
 * 2. Title the sheet: "NTI Attendance & Evaluation Register - Live"
 * 3. Go to "Extensions" -> "Apps Script".
 * 4. Paste this ENTIRE code into the Apps Script editor.
 * 5. Run "installDaily1700Trigger()" ONCE from the Apps Script toolbar.
 * 
 * What this does:
 * - Automatically grants Viewer/Editor access to maphallaamari@gmail.com & Linda.
 * - Automatically refreshes all 4 sheets every day at 17:00 from Supabase.
 * - Allows maphallaamari@gmail.com & Linda to open the sheet live or download as Excel (.xlsx).
 * ==============================================================================
 */

// 1. CONFIGURATION
const NTI_API_URL = 'https://<YOUR-NTI-DEPLOYMENT-URL>/api/reports/daily-refresh'; // Replace with your live Vercel/production URL
const API_KEY = 'nti_reporting_secret_2026'; // Match your REPORTING_API_KEY

// Target Accounts to Automatically Share the Sheet With
const TARGET_EMAILS = [
  'maphallaamari@gmail.com', // Testing account
  'lindadv@ngi.ac.za',       // Linda's account (add Linda's personal Gmail here if different)
];

/**
 * Main Sync Function:
 * Fetches latest attendance records and exit surveys from Supabase via NTI API,
 * then writes formatted tables into all 4 sheets.
 */
function syncNTIAttendanceData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const options = {
    method: 'get',
    headers: {
      'x-api-key': API_KEY,
    },
    muteHttpExceptions: true,
  };

  try {
    const urlWithKey = NTI_API_URL + '?key=' + encodeURIComponent(API_KEY);
    const response = UrlFetchApp.fetch(urlWithKey, options);
    const code = response.getResponseCode();

    if (code !== 200) {
      Logger.log('Error fetching NTI data: HTTP ' + code + ' ' + response.getContentText());
      return;
    }

    const payload = JSON.parse(response.getContentText());
    if (!payload.success || !payload.sheets) {
      Logger.log('Invalid payload received: ' + response.getContentText());
      return;
    }

    const { dashboard, attendance, evaluations, dailySummary } = payload.sheets;

    // 1. Refresh Dashboard Sheet (Executive KPIs)
    populateSheet(ss, 'Dashboard', dashboard, '#1e3a8a', true);

    // 2. Refresh Attendance Sheet (In/Out register)
    populateSheet(ss, 'Attendance', attendance, '#0f766e', false);

    // 3. Refresh Evaluations Sheet (Exit surveys & ratings)
    populateSheet(ss, 'Evaluations', evaluations, '#4338ca', false);

    // 4. Refresh Daily Summary Sheet (Day-by-day totals)
    populateSheet(ss, 'Daily Summary', dailySummary, '#374151', false);

    // Ensure target users have access to this sheet
    shareSpreadsheetAccess(ss);

    Logger.log('NTI Attendance & Evaluations successfully synchronized at ' + new Date().toLocaleString());
  } catch (err) {
    Logger.log('Sync Exception: ' + err.toString());
  }
}

/**
 * Automatically shares the spreadsheet with the designated testing & production emails.
 */
function shareSpreadsheetAccess(ss) {
  TARGET_EMAILS.forEach(function(email) {
    try {
      if (email && email.includes('@')) {
        ss.addViewer(email);
        Logger.log('Granted access to: ' + email);
      }
    } catch (e) {
      Logger.log('Could not automatically add viewer ' + email + ': ' + e.toString());
    }
  });
}

/**
 * Helper to clear, write data, style headers, and auto-fit columns for a sheet.
 */
function populateSheet(ss, sheetName, dataRows, headerColor, isDashboard) {
  if (!dataRows || dataRows.length === 0) return;

  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  const numRows = dataRows.length;
  const numCols = Math.max(...dataRows.map(function(r) { return r.length; }));

  // Pad short rows
  const paddedData = dataRows.map(function(row) {
    const rowCopy = [...row];
    while (rowCopy.length < numCols) {
      rowCopy.push('');
    }
    return rowCopy;
  });

  const range = sheet.getRange(1, 1, numRows, numCols);
  range.setValues(paddedData);

  // Apply visual styling
  if (isDashboard) {
    // Title Banner
    sheet.getRange(1, 1, 1, Math.min(2, numCols))
      .setBackground('#0f172a')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setFontSize(12);

    // Table Header
    if (numRows >= 5) {
      sheet.getRange(5, 1, 1, numCols)
        .setBackground(headerColor)
        .setFontColor('#ffffff')
        .setFontWeight('bold');
    }
  } else {
    // Standard Table Header on Row 1
    sheet.getRange(1, 1, 1, numCols)
      .setBackground(headerColor)
      .setFontColor('#ffffff')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  // Auto resize all columns
  for (let c = 1; c <= numCols; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * ONE-CLICK SETUP FUNCTION:
 * Run this ONCE from the toolbar in Apps Script.
 * It will immediately sync the data, share access with maphallaamari@gmail.com and Linda,
 * and schedule the automated 17:00 daily trigger.
 */
function installDaily1700Trigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Run initial sync immediately
  syncNTIAttendanceData();

  // 2. Share spreadsheet access
  shareSpreadsheetAccess(ss);

  // 3. Clear older triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'syncNTIAttendanceData') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // 4. Create daily trigger for 17:00 (5:00 PM)
  ScriptApp.newTrigger('syncNTIAttendanceData')
    .timeBased()
    .everyDays(1)
    .atHour(17)
    .create();

  Logger.log('Setup complete! Daily 17:00 sync is active, and access has been shared with target accounts.');
}

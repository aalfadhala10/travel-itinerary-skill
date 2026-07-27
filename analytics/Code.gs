/**
 * Bosla · بوصلة — privacy-friendly analytics backend (Google Apps Script)
 *
 * Receives cookieless usage events from the app and stores them in a Google Sheet.
 * Also serves a live stats dashboard when you open the web-app URL in a browser.
 *
 * No personal data is collected — just a random session id (resets when the tab
 * closes), the page/plan/outbound event, language, destination, and days.
 *
 * SETUP: see analytics/SETUP.md (5 minutes, no coding).
 */

var SHEET_NAME = 'Events';
var HEADERS = ['received', 't', 'ev', 'sid', 'lang', 'mode', 'dest', 'country', 'days', 'cities', 'host', 'ref'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Receives an event from the app (navigator.sendBeacon / fetch POST). */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var sh = getSheet_();
    sh.appendRow([
      new Date(),
      data.t || '', data.ev || '', data.sid || '', data.lang || '',
      data.mode || '', data.dest || '', data.country || '',
      (data.days != null ? data.days : ''), (data.cities != null ? data.cities : ''),
      data.host || '', data.ref || ''
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Opening the web-app URL in a browser shows a live stats dashboard. */
function doGet(e) {
  var sh = getSheet_();
  var rows = sh.getDataRange().getValues();
  rows.shift(); // drop header

  var total = rows.length;
  var pageViews = 0, plans = 0, saves = 0, shares = 0, outbound = 0;
  var sessions = {}, dests = {}, countries = {}, hosts = {}, langs = {}, byDay = {};

  var now = new Date();
  var days7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var received = r[0], ev = r[2], sid = r[3], lang = r[4],
        dest = r[6], country = r[7], host = r[10];
    if (sid) sessions[sid] = 1;
    if (lang) langs[lang] = (langs[lang] || 0) + 1;
    if (ev === 'page_view') pageViews++;
    else if (ev === 'plan') { plans++; if (dest) dests[dest] = (dests[dest] || 0) + 1; if (country) countries[country] = (countries[country] || 0) + 1; }
    else if (ev === 'save') saves++;
    else if (ev === 'share' || ev === 'wa') shares++;
    else if (ev === 'outbound') { outbound++; if (host) hosts[host] = (hosts[host] || 0) + 1; }
    if (received instanceof Date) {
      var key = Utilities.formatDate(received, 'GMT', 'yyyy-MM-dd');
      byDay[key] = (byDay[key] || 0) + 1;
    }
  }

  function topList(obj, n) {
    return Object.keys(obj).map(function (k) { return [k, obj[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 10);
  }
  function rowsHtml(list) {
    if (!list.length) return '<tr><td colspan="2" style="opacity:.5">no data yet</td></tr>';
    return list.map(function (x) {
      return '<tr><td>' + escapeHtml_(x[0]) + '</td><td class="n">' + x[1] + '</td></tr>';
    }).join('');
  }

  var uniqueSessions = Object.keys(sessions).length;
  var dayKeys = Object.keys(byDay).sort();
  var spark = dayKeys.slice(-14).map(function (k) { return '<span title="' + k + ': ' + byDay[k] + '">' + byDay[k] + '</span>'; }).join(' · ');

  var html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Bosla · Stats</title><style>' +
    'body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f1720;color:#e8eef5;padding:20px}' +
    'h1{font-size:20px;margin:0 0 4px}.sub{opacity:.6;font-size:13px;margin-bottom:20px}' +
    '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:24px}' +
    '.card{background:#182430;border:1px solid #26333f;border-radius:12px;padding:14px}' +
    '.card .big{font-size:26px;font-weight:700}.card .lbl{opacity:.6;font-size:12px;margin-top:2px}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}' +
    'table{width:100%;border-collapse:collapse;background:#182430;border:1px solid #26333f;border-radius:12px;overflow:hidden}' +
    'th{text-align:left;font-size:12px;opacity:.6;padding:8px 12px;border-bottom:1px solid #26333f}' +
    'td{padding:7px 12px;font-size:14px;border-bottom:1px solid #1e2a35}td.n{text-align:right;font-variant-numeric:tabular-nums}' +
    'h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;opacity:.7;margin:0 0 8px}' +
    '.spark{background:#182430;border:1px solid #26333f;border-radius:12px;padding:12px;font-size:13px;margin-bottom:24px;line-height:1.8}' +
    '</style></head><body>' +
    '<h1>بوصلة · Bosla — usage stats</h1>' +
    '<div class="sub">Cookieless. No personal data. Auto-refreshes on reload.</div>' +
    '<div class="cards">' +
    card_(total, 'total events') + card_(uniqueSessions, 'unique sessions') +
    card_(pageViews, 'page views') + card_(plans, 'plans made') +
    card_(saves, 'trips saved') + card_(shares, 'shares / WhatsApp') +
    card_(outbound, 'outbound clicks') +
    '</div>' +
    '<h3>Events per day (last 14)</h3><div class="spark">' + (spark || '<span style="opacity:.5">no data yet</span>') + '</div>' +
    '<div class="grid">' +
    tbl_('Top destinations', 'Destination', rowsHtml(topList(dests))) +
    tbl_('Top countries', 'Country', rowsHtml(topList(countries))) +
    tbl_('Outbound clicks by site', 'Site', rowsHtml(topList(hosts))) +
    tbl_('Language', 'Lang', rowsHtml(topList(langs))) +
    '</div></body></html>';

  return HtmlService.createHtmlOutput(html).setTitle('Bosla · Stats');
}

function card_(n, lbl) { return '<div class="card"><div class="big">' + n + '</div><div class="lbl">' + lbl + '</div></div>'; }
function tbl_(title, col, body) { return '<div><h3>' + title + '</h3><table><tr><th>' + col + '</th><th class="n">Count</th></tr>' + body + '</table></div>'; }
function escapeHtml_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

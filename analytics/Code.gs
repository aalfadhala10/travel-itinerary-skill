/**
 * Bosla · بوصلة — analytics + feedback backend (Google Apps Script)
 *
 * One web app handles BOTH:
 *   • cookieless usage events (page views, plans, outbound clicks), and
 *   • in-app feedback (star rating + message + optional contact).
 * Everything is stored in your own Google Sheet — two tabs, "Events" and
 * "Feedback" — so it all lives in your Google Drive automatically.
 *
 * No personal data beyond what a user chooses to type in the feedback box.
 *
 * SETUP: see analytics/SETUP.md (5 minutes, no coding). Paste the deployed
 * /exec URL into BOTH CONFIG.analyticsEndpoint and CONFIG.feedbackEndpoint.
 */

var EVENTS_SHEET = 'Events';
var EVENTS_HEADERS = ['received', 't', 'ev', 'sid', 'lang', 'mode', 'dest', 'country', 'days', 'cities', 'host', 'ref', 'tz', 'msg'];
var FEEDBACK_SHEET = 'Feedback';
var FEEDBACK_HEADERS = ['received', 'rating', 'message', 'contact', 'lang', 'page'];

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    return sh;
  }
  // If new columns were added later (e.g. 'tz'), extend the header row without touching existing data.
  if (headers && sh.getLastColumn() < headers.length) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

/** Receives an event OR a feedback submission from the app. */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }
    var isFeedback = (data.type === 'feedback') || (data.message != null && data.ev == null);
    if (isFeedback) {
      sheet_(FEEDBACK_SHEET, FEEDBACK_HEADERS).appendRow([
        new Date(), (data.rating != null ? data.rating : ''),
        data.message || '', data.email || data.contact || '',
        data.lang || '', data.page || ''
      ]);
    } else {
      sheet_(EVENTS_SHEET, EVENTS_HEADERS).appendRow([
        new Date(),
        data.t || '', data.ev || '', data.sid || '', data.lang || '',
        data.mode || '', data.dest || '', data.country || '',
        (data.days != null ? data.days : ''), (data.cities != null ? data.cities : ''),
        data.host || '', data.ref || '', data.tz || '', data.msg || ''
      ]);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** Opening the web-app URL in a browser shows a live stats dashboard. */
function doGet(e) {
  var eRows = sheet_(EVENTS_SHEET, EVENTS_HEADERS).getDataRange().getValues(); eRows.shift();
  var fRows = sheet_(FEEDBACK_SHEET, FEEDBACK_HEADERS).getDataRange().getValues(); fRows.shift();

  var total = eRows.length;
  var pageViews = 0, plans = 0, saves = 0, shares = 0, outbound = 0;
  var sessions = {}, dests = {}, countries = {}, hosts = {}, langs = {}, byDay = {}, misses = {}, missTotal = 0;
  var sessCountry = {}; // one visitor-country per session (from their timezone)
  var chatMsgTotal = 0, chatPlanTotal = 0, chatDests = {}, chatMsgList = [];

  for (var i = 0; i < eRows.length; i++) {
    var r = eRows[i];
    var received = r[0], ev = r[2], sid = r[3], lang = r[4], dest = r[6], country = r[7], host = r[10], tz = r[12], msg = r[13];
    if (sid) sessions[sid] = 1;
    if (sid && tz && !sessCountry[sid]) sessCountry[sid] = tzCountry_(tz);
    if (ev === 'chat_msg') { chatMsgTotal++; if (msg) chatMsgList.push([received, msg]); }
    else if (ev === 'chat_plan') { chatPlanTotal++; if (dest) chatDests[dest] = (chatDests[dest] || 0) + 1; }
    if (lang) langs[lang] = (langs[lang] || 0) + 1;
    if (ev === 'page_view') pageViews++;
    else if (ev === 'plan') { plans++; if (dest) dests[dest] = (dests[dest] || 0) + 1; if (country) countries[country] = (countries[country] || 0) + 1; }
    else if (ev === 'save') saves++;
    else if (ev === 'share' || ev === 'wa') shares++;
    else if (ev === 'outbound') { outbound++; if (host) hosts[host] = (hosts[host] || 0) + 1; }
    else if (ev === 'miss') { missTotal++; if (dest) misses[dest] = (misses[dest] || 0) + 1; }
    if (received instanceof Date) {
      var key = Utilities.formatDate(received, 'GMT', 'yyyy-MM-dd');
      byDay[key] = (byDay[key] || 0) + 1;
    }
  }

  function topList(obj, n) {
    return Object.keys(obj).map(function (k) { return [k, obj[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; }).slice(0, n || 10);
  }
  // Every count table doubles as a bar chart: the bar is the row's own background, scaled against
  // the biggest value in that table, so the shape of the data reads before you read any number.
  function rowsHtml(list) {
    if (!list.length) return '<tr><td colspan="2" style="opacity:.5">no data yet</td></tr>';
    var max = list.reduce(function (m, x) { return Math.max(m, x[1]); }, 0) || 1;
    return list.map(function (x) {
      var pct = Math.max(1.5, Math.round((x[1] / max) * 100));
      return '<tr><td class="bc"><span class="bar" style="width:' + pct + '%"></span>' +
        '<span class="bl">' + esc_(x[0]) + '</span></td><td class="n">' + x[1] + '</td></tr>';
    }).join('');
  }

  var uniqueSessions = Object.keys(sessions).length;
  var geo = {}; // visitors per country
  Object.keys(sessCountry).forEach(function (s) { var c = sessCountry[s]; if (c) geo[c] = (geo[c] || 0) + 1; });
  var chart = dayChart_(byDay, 14);
  // chat assistant — what people typed (newest first) and where those chats led
  var chatRecent = chatMsgList.slice().reverse().slice(0, 40);
  var chatHtml = chatRecent.length ? chatRecent.map(function (r) {
    var when = (r[0] instanceof Date) ? Utilities.formatDate(r[0], 'GMT', 'yyyy-MM-dd') : '';
    return '<div class="fb"><div class="fbtop"><span class="fbmeta">' + when + '</span></div><div class="fbmsg">' + esc_(r[1]) + '</div></div>';
  }).join('') : '<div style="opacity:.5">no chat messages yet</div>';

  // recent feedback (newest first)
  var fb = fRows.slice().reverse().slice(0, 25);
  var avg = 0, rated = 0;
  for (var j = 0; j < fRows.length; j++) { var rt = parseFloat(fRows[j][1]); if (rt > 0) { avg += rt; rated++; } }
  avg = rated ? (avg / rated).toFixed(1) : '—';
  var fbHtml = fb.length ? fb.map(function (r) {
    var stars = (parseFloat(r[1]) > 0) ? ('★'.repeat(parseFloat(r[1])) + '☆'.repeat(5 - parseFloat(r[1]))) : '';
    var when = (r[0] instanceof Date) ? Utilities.formatDate(r[0], 'GMT', 'yyyy-MM-dd') : '';
    var contact = r[3] ? (' · ' + esc_(r[3])) : '';
    return '<div class="fb"><div class="fbtop"><span class="stars">' + stars + '</span><span class="fbmeta">' + when + ' · ' + esc_(r[4] || '') + contact + '</span></div><div class="fbmsg">' + esc_(r[2] || '') + '</div></div>';
  }).join('') : '<div style="opacity:.5">no feedback yet</div>';

  var html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Bosla · Stats</title><style>' +
    'body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#0f1720;color:#e8eef5;padding:20px}' +
    'h1{font-size:20px;margin:0 0 4px}.sub{opacity:.6;font-size:13px;margin-bottom:20px}' +
    '.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-bottom:24px}' +
    '.card{background:#182430;border:1px solid #26333f;border-radius:12px;padding:14px}' +
    '.card .big{font-size:26px;font-weight:700}.card .lbl{opacity:.6;font-size:12px;margin-top:2px}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px}' +
    'table{width:100%;border-collapse:collapse;background:#182430;border:1px solid #26333f;border-radius:12px;overflow:hidden}' +
    'th{text-align:left;font-size:12px;opacity:.6;padding:8px 12px;border-bottom:1px solid #26333f}' +
    'td{padding:7px 12px;font-size:14px;border-bottom:1px solid #1e2a35}td.n{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}' +
    'h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;opacity:.7;margin:0 0 8px}' +
    // a count table that is also a bar chart — the bar sits behind the label
    'td.bc{position:relative;padding-left:12px}' +
    // amber at any real opacity turns olive over the navy row, so keep it faint and let the
    // solid left edge carry the colour
    '.bar{position:absolute;left:0;top:3px;bottom:3px;background:linear-gradient(90deg,rgba(245,196,81,.16),rgba(245,196,81,.02));border-left:2px solid #f5c451;border-radius:0 4px 4px 0}' +
    '.bl{position:relative}' +
    // events per day
    '.chart{background:#182430;border:1px solid #26333f;border-radius:12px;padding:16px 14px 10px;margin-bottom:24px}' +
    '.cols{display:flex;align-items:flex-end;gap:5px}' +
    '.col{flex:1;min-width:0;text-align:center}' +
    '.col b{display:block;font-size:10px;font-weight:600;opacity:.75;margin-bottom:4px;font-variant-numeric:tabular-nums}' +
    '.colw{height:130px;display:flex;align-items:flex-end}' +
    '.col i{display:block;width:100%;background:linear-gradient(180deg,#f5c451,#d9892a);border-radius:4px 4px 0 0;min-height:2px}' +
    '.col i.zero{background:#26333f}' +
    '.col s{display:block;text-decoration:none;font-size:10px;opacity:.45;margin-top:6px;white-space:nowrap}' +
    // funnel
    '.fun{background:#182430;border:1px solid #26333f;border-radius:12px;padding:14px;margin-bottom:24px}' +
    '.fr{display:flex;align-items:center;gap:10px;margin-bottom:9px}' +
    '.fr:last-child{margin-bottom:0}' +
    '.fk{width:110px;font-size:12px;opacity:.7;flex:none}' +
    '.ft{flex:1;background:#0f1720;border-radius:5px;height:22px;overflow:hidden}' +
    '.ft i{display:block;height:100%;background:linear-gradient(90deg,#f5c451,#d9892a);border-radius:5px}' +
    '.fv{width:96px;text-align:right;font-size:12px;flex:none;font-variant-numeric:tabular-nums}' +
    '.fv em{opacity:.5;font-style:normal}' +
    '.fb{background:#182430;border:1px solid #26333f;border-radius:10px;padding:10px 12px;margin-bottom:8px}' +
    '.fbtop{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:4px}' +
    '.stars{color:#f5c451}.fbmeta{opacity:.55}.fbmsg{font-size:14px;line-height:1.4}' +
    '</style></head><body>' +
    '<h1>بوصلة · Bosla — usage stats</h1>' +
    '<div class="sub">Cookieless. Reload to refresh.</div>' +
    '<div class="cards">' +
    card_(total, 'total events') + card_(uniqueSessions, 'unique sessions') +
    card_(pageViews, 'page views') + card_(plans, 'plans made') +
    card_(saves, 'trips saved') + card_(shares, 'shares') +
    card_(outbound, 'outbound clicks') + card_(fRows.length, 'feedback') + card_(avg, 'avg rating') +
    card_(missTotal, 'searches w/ no result') +
    card_(chatMsgTotal, 'chat messages') + card_(chatPlanTotal, 'chat trips built') +
    '</div>' +
    '<h3>Events per day (last 14)</h3>' + chart +
    '<h3>How far people get</h3>' +
    funnel_([
      ['Visited', pageViews], ['Made a plan', plans], ['Chatted', chatMsgTotal],
      ['Clicked out', outbound], ['Saved or shared', saves + shares]
    ]) +
    '<h3>Missing places — asked for, not in our data (add these next)</h3>' +
    '<table><tr><th>What they typed</th><th class="n">Times</th></tr>' + rowsHtml(topList(misses, 30)) + '</table>' +
    '<div style="height:24px"></div>' +
    '<h3>Where visitors are (by timezone — approximate country, anonymous)</h3>' +
    '<table><tr><th>Country</th><th class="n">Visitors</th></tr>' + rowsHtml(topList(geo, 40)) + '</table>' +
    '<div style="height:24px"></div>' +
    '<div class="grid">' +
    tbl_('Top destinations', 'Destination', rowsHtml(topList(dests))) +
    tbl_('Top countries', 'Country', rowsHtml(topList(countries))) +
    tbl_('Outbound clicks by site', 'Site', rowsHtml(topList(hosts))) +
    tbl_('Language', 'Lang', rowsHtml(topList(langs))) +
    '</div>' +
    '<h3>Chat trips — by destination the assistant built</h3>' +
    '<table><tr><th>Destination</th><th class="n">Trips</th></tr>' + rowsHtml(topList(chatDests, 30)) + '</table>' +
    '<div style="height:24px"></div>' +
    '<h3>Recent chat messages (what people asked the assistant)</h3>' + chatHtml +
    '<div style="height:24px"></div>' +
    '<h3>Recent feedback</h3>' + fbHtml +
    '</body></html>';

  return HtmlService.createHtmlOutput(html).setTitle('Bosla · Stats');
}

function card_(n, lbl) { return '<div class="card"><div class="big">' + n + '</div><div class="lbl">' + lbl + '</div></div>'; }

/** Column chart of the last n days. Days with nothing are drawn as flat grey columns rather than
 *  skipped — a gap in a chart of only the busy days reads as steady traffic when it wasn't. */
function dayChart_(byDay, n) {
  var days = [], today = new Date(), i;
  for (i = n - 1; i >= 0; i--) {
    var d = new Date(today.getTime() - i * 86400000);
    var k = Utilities.formatDate(d, 'GMT', 'yyyy-MM-dd');
    days.push([k, byDay[k] || 0, Utilities.formatDate(d, 'GMT', 'd MMM')]);
  }
  var max = days.reduce(function (m, x) { return Math.max(m, x[1]); }, 0);
  if (!max) return '<div class="chart" style="opacity:.5">no data yet</div>';
  var cols = days.map(function (x, idx) {
    var pct = x[1] ? Math.max(3, Math.round((x[1] / max) * 100)) : 0;
    return '<div class="col" title="' + x[0] + ': ' + x[1] + '">' +
      '<b>' + (x[1] || '') + '</b>' +
      '<div class="colw"><i class="' + (x[1] ? '' : 'zero') + '" style="height:' + (x[1] ? pct : 0) + '%"></i></div>' +
      '<s>' + (idx % 2 === 0 || n <= 8 ? esc_(x[2]) : '') + '</s></div>';
  }).join('');
  return '<div class="chart"><div class="cols">' + cols + '</div></div>';
}

/** Horizontal bars for a drop-off funnel, each also shown as a share of the first step. */
function funnel_(steps) {
  var top = steps.length ? steps[0][1] : 0;
  if (!top) return '<div class="fun" style="opacity:.5">no data yet</div>';
  return '<div class="fun">' + steps.map(function (s) {
    var pct = Math.max(0, Math.round((s[1] / top) * 100));
    return '<div class="fr"><div class="fk">' + esc_(s[0]) + '</div>' +
      '<div class="ft"><i style="width:' + Math.max(s[1] ? 2 : 0, pct) + '%"></i></div>' +
      '<div class="fv">' + s[1] + ' <em>· ' + pct + '%</em></div></div>';
  }).join('') + '</div>';
}
function tbl_(title, col, body) { return '<div><h3>' + title + '</h3><table><tr><th>' + col + '</th><th class="n">Count</th></tr>' + body + '</table></div>'; }
function esc_(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/** Map an IANA timezone (e.g. "Asia/Riyadh") to a country name. Anonymous, approximate — a VPN
 *  or traveler skews it, but it's a good read on where your audience is. Unknown zones fall back
 *  to the city name so you still learn something. */
function tzCountry_(tz) {
  var M = {
    'Asia/Riyadh': 'Saudi Arabia', 'Asia/Dubai': 'UAE', 'Asia/Qatar': 'Qatar', 'Asia/Bahrain': 'Bahrain',
    'Asia/Kuwait': 'Kuwait', 'Asia/Muscat': 'Oman', 'Asia/Aden': 'Yemen', 'Asia/Baghdad': 'Iraq',
    'Asia/Amman': 'Jordan', 'Asia/Beirut': 'Lebanon', 'Asia/Damascus': 'Syria', 'Asia/Gaza': 'Palestine',
    'Asia/Hebron': 'Palestine', 'Africa/Cairo': 'Egypt', 'Africa/Khartoum': 'Sudan', 'Africa/Casablanca': 'Morocco',
    'Africa/Tunis': 'Tunisia', 'Africa/Algiers': 'Algeria', 'Africa/Tripoli': 'Libya', 'Africa/Lagos': 'Nigeria',
    'Africa/Johannesburg': 'South Africa', 'Africa/Nairobi': 'Kenya',
    'Europe/London': 'United Kingdom', 'Europe/Dublin': 'Ireland', 'Europe/Paris': 'France', 'Europe/Madrid': 'Spain',
    'Europe/Berlin': 'Germany', 'Europe/Rome': 'Italy', 'Europe/Amsterdam': 'Netherlands', 'Europe/Brussels': 'Belgium',
    'Europe/Zurich': 'Switzerland', 'Europe/Vienna': 'Austria', 'Europe/Lisbon': 'Portugal', 'Europe/Athens': 'Greece',
    'Europe/Istanbul': 'Turkey', 'Europe/Moscow': 'Russia', 'Europe/Stockholm': 'Sweden', 'Europe/Oslo': 'Norway',
    'Europe/Copenhagen': 'Denmark', 'Europe/Warsaw': 'Poland', 'Europe/Prague': 'Czech Republic', 'Europe/Budapest': 'Hungary',
    'Europe/Bucharest': 'Romania', 'Europe/Kiev': 'Ukraine', 'Europe/Helsinki': 'Finland',
    'America/New_York': 'United States', 'America/Chicago': 'United States', 'America/Denver': 'United States',
    'America/Los_Angeles': 'United States', 'America/Phoenix': 'United States', 'America/Toronto': 'Canada',
    'America/Vancouver': 'Canada', 'America/Mexico_City': 'Mexico', 'America/Sao_Paulo': 'Brazil',
    'America/Buenos_Aires': 'Argentina', 'America/Bogota': 'Colombia', 'America/Lima': 'Peru',
    'Asia/Karachi': 'Pakistan', 'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India', 'Asia/Dhaka': 'Bangladesh',
    'Asia/Colombo': 'Sri Lanka', 'Asia/Kathmandu': 'Nepal', 'Asia/Tehran': 'Iran', 'Asia/Kabul': 'Afghanistan',
    'Asia/Bangkok': 'Thailand', 'Asia/Jakarta': 'Indonesia', 'Asia/Kuala_Lumpur': 'Malaysia', 'Asia/Singapore': 'Singapore',
    'Asia/Manila': 'Philippines', 'Asia/Ho_Chi_Minh': 'Vietnam', 'Asia/Saigon': 'Vietnam', 'Asia/Tokyo': 'Japan',
    'Asia/Seoul': 'South Korea', 'Asia/Shanghai': 'China', 'Asia/Hong_Kong': 'Hong Kong', 'Asia/Taipei': 'Taiwan',
    'Australia/Sydney': 'Australia', 'Australia/Melbourne': 'Australia', 'Australia/Perth': 'Australia',
    'Pacific/Auckland': 'New Zealand'
  };
  if (M[tz]) return M[tz];
  var city = String(tz || '').split('/').pop().replace(/_/g, ' ');
  return city || 'Unknown';
}

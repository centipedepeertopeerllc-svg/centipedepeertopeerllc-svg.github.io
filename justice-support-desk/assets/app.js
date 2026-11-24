"use strict";
/* Centipede Peer to Peer, LLC — Justice Support Center Case Tracker
   (assets/app.js). Built November 24, 2026 at the direction of the
   Chief Executive Officer, modeled on Clio Manage's structure —
   matters, contacts, calendaring, tasks, documents, and an overview
   dashboard — reshaped for criminal justice support work at a
   peer-support company that is NOT a law firm. No billing, no time
   tracking, no trust accounting: none of that applies here.

   Records live in this device's browser storage (Local Mode, the same
   honest pattern as the other Portal dashboards) under
   "cpp.justice.tracker.v1". The store seeds EMPTY — no real client
   information is ever seeded into a dashboard file. The locked client
   binders and the Legal Binder (CPP-BND-2026-001) remain the official
   record. Sign-in is assets/auth.js (username + password + 2FA); the
   administrator (admin: true in config.js) can add, edit, and delete
   everything and manages user access from the header panel auth.js
   provides. */
const CFG = window.JUSTICE_DESK_CONFIG;
const DB_KEY = "cpp.justice.tracker.v1";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtDate = (s) => { if (!s) return "—"; const p = s.split("-"); if (p.length !== 3) return s; return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0]; };
const daysUntil = (s) => { if (!s) return null; const a = new Date(todayStr() + "T00:00:00"); const b = new Date(s + "T00:00:00"); return Math.round((b - a) / 86400000); };
const isOpen = (m) => m.stage !== "Resolved / Closed";

const dbGet = () => { try { const d = JSON.parse(localStorage.getItem(DB_KEY)); if (d && Array.isArray(d.matters) && Array.isArray(d.tasks) && Array.isArray(d.contacts)) { if (!Array.isArray(d.applications)) d.applications = []; return d; } } catch { /* fall through */ } return { matters: [], tasks: [], contacts: [], applications: [] }; };
const dbSet = (d) => localStorage.setItem(DB_KEY, JSON.stringify(d));

const state = { user: null, tab: "overview", matterId: null, editingMatter: null, editingContact: null, matterSearch: "", matterStage: "" };

function matterName(id) { const m = dbGet().matters.find((x) => x.id === id); return m ? m.person : "(matter removed)"; }
function dateBadge(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return "";
  if (d < 0) return ' <span class="badge badge-overdue">' + Math.abs(d) + "d overdue</span>";
  if (d === 0) return ' <span class="badge badge-overdue">TODAY</span>';
  if (d <= 14) return ' <span class="badge badge-soon">in ' + d + "d</span>";
  return "";
}

/* ---------------- Overview ---------------- */
function renderOverview() {
  const db = dbGet();
  const open = db.matters.filter(isOpen);
  const in14 = open.filter((m) => { const d = daysUntil(m.nextDate); return d !== null && d >= 0 && d <= 14; }).sort((a, b) => a.nextDate < b.nextDate ? -1 : 1);
  const overdueTasks = db.tasks.filter((t) => !t.done && daysUntil(t.due) !== null && daysUntil(t.due) < 0);
  const overdueCourt = open.filter((m) => { const d = daysUntil(m.nextDate); return d !== null && d < 0; });
  let h = '<div class="stats">'
    + '<div class="stat"><div class="num">' + open.length + '</div><div class="lbl">Open matters</div></div>'
    + '<div class="stat"><div class="num">' + in14.length + '</div><div class="lbl">Court dates in the next 14 days</div></div>'
    + '<div class="stat' + (overdueTasks.length ? " alert" : "") + '"><div class="num">' + overdueTasks.length + '</div><div class="lbl">Overdue tasks</div></div>'
    + '<div class="stat"><div class="num">' + db.contacts.length + '</div><div class="lbl">Contacts on file</div></div>'
    + "</div>";
  h += '<section class="panel"><h2>Coming up — court dates, next 14 days</h2>';
  if (!in14.length && !overdueCourt.length) h += '<p class="empty-note">No court dates in the next 14 days. When a matter has a next court date, it shows here.</p>';
  if (overdueCourt.length) {
    h += '<h3>Past dates still on open matters — update the matter</h3><ul class="item-list">'
      + overdueCourt.map((m) => '<li class="clickable" data-open-matter="' + m.id + '"><strong>' + esc(m.person) + "</strong> — " + esc(m.nextType || "Court date") + ", " + fmtDate(m.nextDate) + dateBadge(m.nextDate) + '<br><span class="meta">' + esc(m.court || "") + " · Case " + esc(m.caseNumber || "—") + "</span></li>").join("") + "</ul>";
  }
  if (in14.length) {
    h += '<ul class="item-list">' + in14.map((m) => '<li class="clickable" data-open-matter="' + m.id + '"><strong>' + esc(m.person) + "</strong> — " + esc(m.nextType || "Court date") + ", " + fmtDate(m.nextDate) + dateBadge(m.nextDate) + '<br><span class="meta">' + esc(m.court || "") + " · " + esc(m.stage) + "</span></li>").join("") + "</ul>";
  }
  h += "</section>";
  h += '<section class="panel"><h2>Needs attention</h2>';
  if (!overdueTasks.length) h += '<p class="empty-note">No overdue tasks. Good order.</p>';
  else h += '<ul class="item-list">' + overdueTasks.map((t) => '<li><strong>' + esc(t.title) + "</strong>" + dateBadge(t.due) + '<br><span class="meta">Due ' + fmtDate(t.due) + " · " + esc(matterName(t.matterId)) + "</span></li>").join("") + "</ul>";
  h += '<p><button type="button" class="btn-navy" data-goto="matters">Open Matters</button> <button type="button" class="btn-small" data-goto="calendar">Open Court Calendar</button></p></section>';
  $("view-overview").innerHTML = h;
  wireView($("view-overview"));
}

/* ---------------- Matters ---------------- */
function renderMatters() {
  const db = dbGet();
  let list = db.matters.slice().sort((a, b) => (a.person || "").localeCompare(b.person || ""));
  if (state.matterSearch) list = list.filter((m) => (m.person + " " + m.caseNumber + " " + m.court).toLowerCase().includes(state.matterSearch.toLowerCase()));
  if (state.matterStage) list = list.filter((m) => m.stage === state.matterStage);
  let h = '<section class="panel"><div class="toolbar">'
    + '<label>Search matters<input type="text" id="m-search" value="' + esc(state.matterSearch) + '" placeholder="Name, case number, or court"></label>'
    + '<label>Stage<select id="m-stage"><option value="">All stages</option>' + CFG.stages.map((s) => '<option' + (state.matterStage === s ? " selected" : "") + ">" + esc(s) + "</option>").join("") + "</select></label>"
    + '<button type="button" class="btn-navy" id="m-new">+ New matter</button></div>';
  if (!db.matters.length) h += '<p class="empty-note">No matters yet. The tracker starts empty on purpose — add the first matter with <strong>+ New matter</strong>. Only case number and court are kept on the charge side; the person\u2019s story and support notes belong in the notes, in plain language.</p>';
  else if (!list.length) h += '<p class="empty-note">No matters match that search.</p>';
  else {
    h += '<table class="data"><thead><tr><th>Person</th><th>Case number</th><th>Court</th><th>Stage</th><th>Next court date</th><th>Assigned</th></tr></thead><tbody>'
      + list.map((m) => '<tr class="clickable" data-open-matter="' + m.id + '"><td><strong>' + esc(m.person) + '</strong></td><td>' + esc(m.caseNumber || "—") + "</td><td>" + esc(m.court || "—") + '</td><td><span class="badge badge-stage">' + esc(m.stage) + "</span></td><td>" + (m.nextDate ? fmtDate(m.nextDate) + " — " + esc(m.nextType || "Court date") + dateBadge(m.nextDate) : "—") + "</td><td>" + esc(m.staff || "—") + "</td></tr>").join("")
      + "</tbody></table>";
  }
  h += "</section>";
  if (state.editingMatter !== null) h += matterForm(db.matters.find((m) => m.id === state.editingMatter) || null);
  if (state.matterId) { const m = db.matters.find((x) => x.id === state.matterId); if (m) h += matterDetail(m, db); }
  $("view-matters").innerHTML = h;
  wireView($("view-matters"));
  const s = $("m-search"); if (s) s.addEventListener("input", () => { state.matterSearch = s.value; const pos = s.selectionStart; renderMatters(); const s2 = $("m-search"); s2.focus(); s2.setSelectionRange(pos, pos); });
  const st = $("m-stage"); if (st) st.addEventListener("change", () => { state.matterStage = st.value; renderMatters(); });
  const nw = $("m-new"); if (nw) nw.addEventListener("click", () => { state.editingMatter = ""; state.matterId = null; renderMatters(); });
  wireMatterForms();
}

function matterForm(m) {
  const v = m || { person: "", caseNumber: "", court: "", stage: CFG.stages[0], nextDate: "", nextType: CFG.hearingTypes[0], staff: "", notes: "" };
  return '<section class="panel"><h2>' + (m ? "Edit matter" : "New matter") + "</h2>"
    + '<form id="matter-form"><div class="grid2">'
    + '<label>Person\u2019s full name <span class="req">*</span><input type="text" id="mf-person" value="' + esc(v.person) + '" required></label>'
    + '<label>Case number<input type="text" id="mf-case" value="' + esc(v.caseNumber) + '"></label>'
    + '<label>Court / jurisdiction<input type="text" id="mf-court" value="' + esc(v.court) + '" placeholder="e.g. San Joaquin County Superior Court"></label>'
    + '<label>Stage in the process<select id="mf-stage">' + CFG.stages.map((s) => "<option" + (v.stage === s ? " selected" : "") + ">" + esc(s) + "</option>").join("") + "</select></label>"
    + '<label>Next court date<input type="date" id="mf-nextdate" value="' + esc(v.nextDate) + '"></label>'
    + '<label>Next date type<select id="mf-nexttype">' + CFG.hearingTypes.map((s) => "<option" + (v.nextType === s ? " selected" : "") + ">" + esc(s) + "</option>").join("") + "</select></label>"
    + '<label>Assigned staff<input type="text" id="mf-staff" value="' + esc(v.staff) + '"></label>'
    + "</div>"
    + '<label>Support notes<textarea id="mf-notes" rows="3" placeholder="Plain-language support notes — rides, reminders, check-ins, what the person asked us to help with. No clinical language.">' + esc(v.notes) + "</textarea></label>"
    + '<p><button type="submit" class="btn-navy">Save matter</button> <button type="button" class="btn-small" id="mf-cancel">Cancel</button> <span class="save-status" id="mf-msg"></span></p></form></section>';
}

function matterDetail(m, db) {
  const tasks = db.tasks.filter((t) => t.matterId === m.id);
  const contacts = db.contacts.filter((c) => c.matterId === m.id);
  let h = '<section class="panel"><h2>' + esc(m.person) + ' <span class="badge badge-stage">' + esc(m.stage) + "</span></h2>"
    + '<dl class="detail-grid">'
    + "<div><dt>Case number</dt><dd>" + esc(m.caseNumber || "—") + "</dd></div>"
    + "<div><dt>Court / jurisdiction</dt><dd>" + esc(m.court || "—") + "</dd></div>"
    + "<div><dt>Next court date</dt><dd>" + (m.nextDate ? fmtDate(m.nextDate) + " — " + esc(m.nextType || "Court date") + dateBadge(m.nextDate) : "—") + "</dd></div>"
    + "<div><dt>Assigned staff</dt><dd>" + esc(m.staff || "—") + "</dd></div>"
    + "</dl>"
    + (m.notes ? "<h3>Support notes</h3><blockquote class=\"note-text\">" + esc(m.notes) + "</blockquote>" : "")
    + '<p class="no-print"><button type="button" class="btn-small" id="md-edit">Edit this matter</button> '
    + (state.user && state.user.admin ? '<button type="button" class="btn-small btn-danger" id="md-delete">Delete this matter</button> ' : "")
    + '<button type="button" class="btn-small" id="md-close">Close</button></p>'
    + "<h3>Documents</h3>";
  h += signNowSection("Documents for this matter are signed through SignNow — the company's one signing route for every application and signature. When a document is fully signed, the signed copy and its audit trail file into this matter's record automatically.");
  if (!m.docs || !m.docs.length) h += '<p class="hint">No document links yet. Link to the document\u2019s home (Portal page or file) — the paper and binder copies stay the official record.</p>';
  else h += '<ul class="item-list">' + m.docs.map((d, i) => '<li><a href="' + esc(d.url) + '" target="_blank" rel="noopener">' + esc(d.label || d.url) + "</a>" + (state.user && state.user.admin ? ' <button type="button" class="btn-small btn-danger" data-doc-del="' + i + '">Remove</button>' : "") + "</li>").join("") + "</ul>";
  h += '<form id="doc-form" class="no-print"><div class="grid2"><label>Document name<input type="text" id="df-label"></label><label>Link (URL)<input type="url" id="df-url" placeholder="https://"></label></div><p><button type="submit" class="btn-small">Add document link</button></p></form>'
    + "<h3>Tasks for this matter</h3>";
  if (!tasks.length) h += '<p class="hint">No tasks yet — add one below or from the Tasks tab.</p>';
  else h += '<ul class="item-list">' + tasks.map((t) => taskRow(t)).join("") + "</ul>";
  h += '<form id="mtask-form" class="no-print"><div class="grid2"><label>New task<input type="text" id="mt-title"></label><label>Due date<input type="date" id="mt-due"></label></div><p><button type="submit" class="btn-small">Add task</button></p></form>'
    + "<h3>Contacts on this matter</h3>"
    + (contacts.length ? '<ul class="item-list">' + contacts.map((c) => "<li><strong>" + esc(c.name) + "</strong> — " + esc(c.role) + (c.phone ? " · " + esc(c.phone) : "") + "</li>").join("") + "</ul>" : '<p class="hint">No contacts tied to this matter yet — add them on the Contacts tab.</p>')
    + "<h3>Notes timeline</h3>"
    + (m.timeline && m.timeline.length ? '<ul class="timeline">' + m.timeline.slice().reverse().map((n) => "<li><strong>" + esc(n.when) + "</strong> · " + esc(n.by) + "<br>" + esc(n.text) + "</li>").join("") + "</ul>" : '<p class="hint">No notes yet.</p>')
    + '<form id="note-form" class="no-print"><label>Add a note<textarea id="nf-text" rows="2"></textarea></label><p><button type="submit" class="btn-small">Add note</button></p></form>'
    + "</section>";
  return h;
}

function taskRow(t) {
  return '<li><label class="check" style="display:inline-flex;"><input type="checkbox" data-task-done="' + t.id + '"' + (t.done ? " checked" : "") + '> <span class="' + (t.done ? "task-done" : "") + '">' + esc(t.title) + "</span></label>"
    + (t.due ? " — due " + fmtDate(t.due) + (t.done ? "" : dateBadge(t.due)) : "")
    + (state.user && state.user.admin ? ' <button type="button" class="btn-small btn-danger" data-task-del="' + t.id + '">Delete</button>' : "") + "</li>";
}

function wireMatterForms() {
  const f = $("matter-form");
  if (f) f.addEventListener("submit", (e) => {
    e.preventDefault();
    const db = dbGet();
    const rec = { person: $("mf-person").value.trim(), caseNumber: $("mf-case").value.trim(), court: $("mf-court").value.trim(), stage: $("mf-stage").value, nextDate: $("mf-nextdate").value, nextType: $("mf-nexttype").value, staff: $("mf-staff").value.trim(), notes: $("mf-notes").value.trim() };
    if (!rec.person) return;
    if (state.editingMatter) { const m = db.matters.find((x) => x.id === state.editingMatter); Object.assign(m, rec); state.matterId = m.id; }
    else { rec.id = uid(); rec.docs = []; rec.timeline = []; db.matters.push(rec); state.matterId = rec.id; }
    state.editingMatter = null; dbSet(db); renderMatters();
  });
  const cancel = $("mf-cancel"); if (cancel) cancel.addEventListener("click", () => { state.editingMatter = null; renderMatters(); });
  const edit = $("md-edit"); if (edit) edit.addEventListener("click", () => { state.editingMatter = state.matterId; renderMatters(); });
  const close = $("md-close"); if (close) close.addEventListener("click", () => { state.matterId = null; renderMatters(); });
  const del = $("md-delete"); if (del) del.addEventListener("click", () => {
    if (!confirm("Delete this matter and its document links and notes timeline? Its tasks stay in the task list, unlinked. This cannot be undone.")) return;
    const db = dbGet(); db.matters = db.matters.filter((x) => x.id !== state.matterId); dbSet(db); state.matterId = null; renderMatters();
  });
  const df = $("doc-form"); if (df) df.addEventListener("submit", (e) => {
    e.preventDefault(); const url = $("df-url").value.trim(); if (!url) return;
    const db = dbGet(); const m = db.matters.find((x) => x.id === state.matterId); m.docs = m.docs || []; m.docs.push({ label: $("df-label").value.trim(), url }); dbSet(db); renderMatters();
  });
  document.querySelectorAll("[data-doc-del]").forEach((b) => b.addEventListener("click", () => {
    const db = dbGet(); const m = db.matters.find((x) => x.id === state.matterId); m.docs.splice(Number(b.getAttribute("data-doc-del")), 1); dbSet(db); renderMatters();
  }));
  const nf = $("note-form"); if (nf) nf.addEventListener("submit", (e) => {
    e.preventDefault(); const text = $("nf-text").value.trim(); if (!text) return;
    const db = dbGet(); const m = db.matters.find((x) => x.id === state.matterId); m.timeline = m.timeline || []; m.timeline.push({ when: todayStr(), by: state.user ? state.user.name : "", text }); dbSet(db); renderMatters();
  });
  const mt = $("mtask-form"); if (mt) mt.addEventListener("submit", (e) => {
    e.preventDefault(); const title = $("mt-title").value.trim(); if (!title) return;
    const db = dbGet(); db.tasks.push({ id: uid(), matterId: state.matterId, title, due: $("mt-due").value, done: false }); dbSet(db); renderMatters();
  });
  wireTaskToggles($("view-matters"));
}

/* ---------------- SignNow — the company's one signing route ----------------
   SignNow is the signing route for EVERY application and signature at
   Centipede — Justice Support, Employment, and Volunteer applications
   alike (Levi's direction, Nov 24, 2026). There is no typed-name
   signature block in the converted flow: the applicant signs the
   application document itself through SignNow. This page is static,
   so this section is the designed signing ENTRY POINT: in the live
   flow the Portal asks the secure backend (which alone holds the
   SignNow key — never in page code), the signer signs in an embedded
   SignNow session, and the signed copy plus its audit trail file
   into the person's record automatically. Design: Legal Department
   SignNow–Portal integration design note, Nov 24, 2026. */
function signNowSection(blurb) {
  return '<div class="panel" style="border:2px solid #0e3b26;">'
    + "<h3>Sign with SignNow</h3>"
    + '<p class="hint">' + esc(blurb) + "</p>"
    + '<p class="hint">How signing works here: this is the signing entry point. The document opens in a SignNow signing session arranged through the Portal\u2019s secure backend — no SignNow account is needed by the signer, and no key or credential is ever held in this page. When signing is complete, the signed copy and its audit trail file into the person\u2019s record automatically.</p>'
    + '<p><button type="button" class="btn-navy" data-signnow-open>Sign with SignNow</button> <span class="save-status" data-signnow-msg></span></p>'
    + "</div>";
}
function wireSignNow(root) {
  if (!root) return;
  root.querySelectorAll("[data-signnow-open]").forEach((b) => b.addEventListener("click", () => {
    const msg = b.parentElement.querySelector("[data-signnow-msg]");
    if (msg) msg.textContent = "Signing entry point: in the live Portal flow, this opens the SignNow signing session for the document. Signed copies file into the record automatically.";
  }));
}

/* ---------------- Justice Support Program Application ---------------- */
const HELP_OPTIONS = ["Court reminders", "Rides to court", "Document help", "ID help", "Housing referrals", "Peer support check-ins", "Other"];
function renderApplication() {
  const db = dbGet();
  let h = '<section class="panel"><h2>Justice Support Program Application</h2>'
    + '<p class="hint">The Justice Support Program is <strong>Active</strong> (approved November 20, 2026). A person completes this application to enter the program; staff may complete it on the person\u2019s behalf at the person\u2019s direction. Applications are kept in this tracker on this device (Local Mode); the signed application files into the person\u2019s client record.</p>'
    + '<p class="hint"><strong>Please read first:</strong> Centipede Peer to Peer, LLC is a California for-profit limited liability company. The Justice Support Program is non-clinical peer support from people with lived experience. It is <strong>not legal advice</strong>: Centipede is not a law firm, program staff are not attorneys, and staff never give legal advice or representation. In an emergency, call 911.</p>'
    + '<form id="app-form"><div class="grid2">'
    + '<label>Full legal name <span class="req">*</span><input type="text" id="af-name" required></label>'
    + '<label>Date of birth <span class="req">*</span><input type="date" id="af-dob" required></label>'
    + '<label>Phone <span class="req">*</span><input type="tel" id="af-phone" required></label>'
    + '<label>Email (optional)<input type="email" id="af-email"></label>'
    + '<label>Mailing address — or write \u201cno fixed address\u201d<input type="text" id="af-address" placeholder="Street, city, ZIP — or: no fixed address"></label>'
    + '<label>Case number(s)<input type="text" id="af-case"></label>'
    + '<label>Court / jurisdiction<input type="text" id="af-court" placeholder="e.g. San Joaquin County Superior Court"></label>'
    + '<label>Next court date<input type="date" id="af-nextdate"></label>'
    + '<label>Probation / parole status<input type="text" id="af-probation" placeholder="e.g. On probation; on parole; not on supervision"></label>'
    + '<label>Probation / parole officer name (optional)<input type="text" id="af-officer"></label>'
    + '<label>How did you hear about us?<input type="text" id="af-heard"></label>'
    + "</div>"
    + '<fieldset style="border:1px solid #ccc;border-radius:8px;padding:10px 12px;"><legend>What do you need help with?</legend>'
    + HELP_OPTIONS.map((o, i) => '<label class="check" style="display:block;"><input type="checkbox" id="af-help-' + i + '"> ' + esc(o) + "</label>").join("")
    + '<label>Other — tell us in your words<input type="text" id="af-help-other"></label></fieldset>'
    + '<h3>Consent</h3>'
    + '<p class="hint">By submitting this application, I ask Centipede Peer to Peer, LLC to enroll me in the Justice Support Program and to contact me about my court dates and the help I asked for. I understand the program is non-clinical peer support, not legal advice, and that Centipede is a for-profit company. I understand my information is confidential and is shared outside the company only with my signed release or a judge-signed court order. <strong>This application is signed through SignNow</strong> — the company\u2019s signing service — in the signing step below; there is no typed signature block, because the SignNow signature on the application document itself is my signature.</p>'
    + '<label class="check" style="display:block;"><input type="checkbox" id="af-consent" required> I have read the consent above, I understand it, and the information I gave is true as I know it. <span class="req">*</span></label>'
    + '<p><button type="submit" class="btn-navy">Submit application</button> <span class="save-status" id="af-msg"></span></p></form>'
    + signNowSection("The submitted application is signed through SignNow — the signature step for this application, and for every Centipede application. The signed copy files into the applicant\u2019s client record.")
    + "</section>";
  h += '<section class="panel"><h2>Applications received (this device)</h2>';
  if (!db.applications.length) h += '<p class="empty-note">No applications yet. The list starts empty on purpose — submitted applications show here.</p>';
  else h += '<table class="data"><thead><tr><th>Applicant</th><th>Submitted</th><th>Case number</th><th>Next court date</th><th>Needs</th><th>Signing</th></tr></thead><tbody>'
    + db.applications.slice().reverse().map((a) => "<tr><td><strong>" + esc(a.name) + "</strong></td><td>" + fmtDate(a.submitted) + "</td><td>" + esc(a.caseNumber || "—") + "</td><td>" + (a.nextDate ? fmtDate(a.nextDate) : "—") + "</td><td>" + esc((a.help || []).join(", ") || "—") + "</td><td>Signs through SignNow; signed copy files to the client record</td></tr>").join("")
    + "</tbody></table>";
  h += "</section>";
  $("view-application").innerHTML = h;
  wireSignNow($("view-application"));
  $("app-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("af-name").value.trim();
    if (!name || !$("af-consent").checked) { $("af-msg").textContent = "Name and consent are required."; return; }
    const help = HELP_OPTIONS.filter((o, i) => $("af-help-" + i).checked);
    const other = $("af-help-other").value.trim(); if (other) help.push("Other: " + other);
    const db2 = dbGet();
    db2.applications.push({ id: uid(), submitted: todayStr(), name, dob: $("af-dob").value, phone: $("af-phone").value.trim(), email: $("af-email").value.trim(), address: $("af-address").value.trim(), caseNumber: $("af-case").value.trim(), court: $("af-court").value.trim(), nextDate: $("af-nextdate").value, probation: $("af-probation").value.trim(), officer: $("af-officer").value.trim(), help, heard: $("af-heard").value.trim(), consent: true, signedVia: "SignNow" });
    dbSet(db2); renderApplication();
    const msg = $("af-msg"); if (msg) msg.textContent = "Application saved. Complete the SignNow signing step so the signed copy files into the client record.";
  });
}

/* ---------------- Policies (DRAFTS — read-only) ---------------- */
const POLICY_PROGRAM = [
"COMPANY POLICY CPP-POL-2026-___ — JUSTICE SUPPORT PROGRAM POLICY",
"Status: DRAFT — not issued. This draft takes effect only when it is approved by the Chief Executive Officer, assigned its CPP-POL number, posted in the Portal library, and emailed to all staff. Drafted November 24, 2026.",
"1. PURPOSE. This policy governs the Justice Support Program of Centipede Peer to Peer, LLC: what the program is, who it serves, what its staff do and do not do, how program documents are signed, how member information is protected, and where program records are kept.",
"2. PROGRAM STATUS. The Justice Support Program is Active. It was approved on November 20, 2026. The program is run by the company's Legal Department, and its working tool is the Justice Support Center Case Tracker in the company Portal.",
"3. WHO THE PROGRAM SERVES. The program serves people in Stockton and San Joaquin County who are involved in the criminal justice system — people with a court case, people on probation or parole, and people working to clear up court obligations — who ask Centipede for peer support. A person enters the program by completing the Justice Support Program Application, in person, by phone with staff help, or through the Portal. Staff may complete the application on a person's behalf at the person's direction.",
"4. SCOPE — NON-CLINICAL PEER SUPPORT. The program provides non-clinical peer support from people with lived experience. Program staff support, encourage, coach, mentor, navigate, and connect members to resources. Services include: court date reminders and help keeping track of court obligations; rides to court, where available; help understanding and organizing court and program documents; help obtaining identification; referrals to housing and other community resources; and peer support check-ins.",
"5. WHAT THE PROGRAM IS NOT — NO LEGAL ADVICE. Centipede Peer to Peer, LLC is not a law firm. Program staff are not attorneys, do not act as attorneys, and never give legal advice, legal opinions, or legal representation. Staff do not tell a member what plea to enter, what a court will decide, or how a case will come out. A member who needs legal advice is referred to an attorney or to the public defender. Program support is also non-clinical: staff do not diagnose, do not provide treatment, therapy, or counseling in the clinical sense, and the program is not a medical or mental-health provider.",
"6. ELECTRONIC SIGNATURES — SIGNNOW. SignNow is the company's one signing route for every application and signature. Program documents that require a signature — including the program application — are signed through SignNow under CPP-POL-2026-047 (Electronic Signatures). The applicant signs the document itself through SignNow; there is no typed-name signature block in the signing flow. Signed copies file into the member's client record. No program document is signed through any other service unless the Chief Executive Officer directs it in writing.",
"7. CONFIDENTIALITY. Member information is confidential. It is shared outside the company only (a) with the member's signed Release of Information (ROI), or (b) under a judge-signed court order. A subpoena alone is not sufficient. Program staff do not discuss a member's case, court status, or personal information with family members, employers, or any outside party except as this section allows.",
"8. RECORDS. The locked client binders and the Legal Binder (CPP-BND-2026-001) are the official record of the Justice Support Program. The Justice Support Center Case Tracker is a working tool; its records live in the signed-in device's browser storage (Local Mode) and are backed up under the Admin & Data function. Signed program documents file into the member's client binder. Legal documents and program legal actions file into the Legal Binder the same session they are made.",
"9. COMPANY STATEMENT. Centipede Peer to Peer, LLC is a California for-profit limited liability company. The Justice Support Program is a peer support program. Nothing in this policy, and nothing program staff say or write, is legal, medical, or psychiatric advice. In an emergency, call 911.",
"Legal — Counsel: Fluetsch and Fluetsch, Attorney at Law. Centipede Peer to Peer, LLC is fully dealt with counsel."
];
const POLICY_MEMBERS = [
"COMPANY POLICY CPP-POL-2026-___ — JUSTICE SUPPORT MEMBERS POLICY",
"Status: DRAFT — not issued. This draft takes effect only when it is approved by the Chief Executive Officer, assigned its CPP-POL number, posted in the Portal library, and emailed to all staff. Drafted November 24, 2026.",
"1. PURPOSE. This policy states what a member of the Justice Support Program can expect from Centipede Peer to Peer, LLC, what the program asks of its members, and how membership begins and ends. It is written in plain language on purpose, so every member can read it and hold us to it.",
"2. WHO IS A MEMBER. A member is a person who has completed the Justice Support Program Application and been enrolled. Membership is free of any promise of outcome: the program offers support, reminders, rides where available, document and ID help, referrals, and check-ins. The program does not promise any court result.",
"3. MEMBER RIGHTS. Every member has the right to: (a) be treated with respect and without judgment, whatever their case or history; (b) peer support that is non-clinical — support, encouragement, coaching, mentoring, navigation, and connection to resources from people with lived experience; (c) clear information about what the program can and cannot do, including that staff are not attorneys and never give legal advice; (d) privacy under section 6; (e) ask questions, raise a concern, or make a complaint to the Legal Department or the Board without losing services for having spoken up; (f) leave the program at any time, for any reason, by telling any program staff member.",
"4. WHAT MEMBERS CAN EXPECT. Members can expect: court date reminders for the dates they give us; help keeping their court and program papers organized; help obtaining identification; referrals to housing and community resources, with a warm handoff where we can make one; peer support check-ins at the rhythm agreed with their assigned staff; and honest answers — including 'we cannot do that' — when a request is outside the program's scope.",
"5. MEMBER RESPONSIBILITIES AND CONDUCT. Members are asked to: give true information as they know it, and update us when court dates, phone numbers, or addresses change; treat staff, other members, and partners with respect; come to scheduled meetings and rides on time, or let us know ahead when they cannot; never ask staff to break the law, falsify a document, or speak for them in court; and keep their own court obligations — the program reminds and supports, but the member's case remains the member's responsibility. Violence, threats, or harassment toward staff or other members is not tolerated.",
"6. PRIVACY. A member's information is confidential. It is shared outside the company only with the member's signed Release of Information (ROI) or under a judge-signed court order; a subpoena alone is not sufficient. Members may see their own program record by asking the Legal Department. Program documents the member signs are signed through SignNow, the company's signing service, and the signed copies are kept in the member's client record.",
"7. LEAVING THE PROGRAM. A member may leave at any time by telling any staff member; no reason is required and no penalty follows. When a member leaves, staff close the member's matter in the tracker, note the closing in the client record, and stop reminders and check-ins.",
"8. REMOVAL FROM THE PROGRAM. The program may end a membership when a member: engages in violence, threats, or harassment toward staff or other members; asks staff to break the law or falsify records and repeats the request after being told no; or cannot be reached after repeated documented attempts over 60 days and has no upcoming court date on file. Removal is decided by the Legal Department, is recorded in the member's client record with the reason, and is told to the member directly (in person, by phone, or by mail to the last address given) unless the member cannot be reached. A removed member may ask the Board to review the decision.",
"9. COMPANY STATEMENT. Centipede Peer to Peer, LLC is a California for-profit limited liability company. The Justice Support Program is non-clinical peer support, not legal advice, not treatment, and not a medical or mental-health service. In an emergency, call 911.",
"Legal — Counsel: Fluetsch and Fluetsch, Attorney at Law. Centipede Peer to Peer, LLC is fully dealt with counsel."
];
function renderPolicies() {
  const para = (arr) => arr.map((p, i) => i === 0 ? "<h3>" + esc(p) + "</h3>" : '<p class="hint" style="color:inherit;">' + esc(p) + "</p>").join("");
  $("view-policies").innerHTML = '<section class="panel"><h2>Program Policies — DRAFTS</h2>'
    + '<p class="hint"><strong>These are DRAFT policies — not issued.</strong> They are shown here read-only for review. Each takes effect only when the Chief Executive Officer approves it, it is assigned its CPP-POL number, posted in the Portal library, and emailed to all staff.</p></section>'
    + '<section class="panel">' + para(POLICY_PROGRAM) + "</section>"
    + '<section class="panel">' + para(POLICY_MEMBERS) + "</section>";
}

/* ---------------- Court Calendar ---------------- */
function renderCalendar() {
  const db = dbGet();
  const items = [];
  db.matters.filter(isOpen).forEach((m) => { if (m.nextDate) items.push({ date: m.nextDate, kind: "Court", label: (m.nextType || "Court date") + " — " + m.person, sub: (m.court || "") + " · Case " + (m.caseNumber || "—") + " · " + m.stage, matterId: m.id }); });
  db.tasks.filter((t) => !t.done && t.due).forEach((t) => items.push({ date: t.due, kind: "Deadline", label: t.title, sub: matterName(t.matterId), matterId: t.matterId }));
  items.sort((a, b) => a.date < b.date ? -1 : 1);
  const overdue = items.filter((i) => daysUntil(i.date) < 0);
  const upcoming = items.filter((i) => daysUntil(i.date) >= 0);
  const row = (i) => '<tr class="' + (daysUntil(i.date) < 0 ? "overdue" : "") + '"><td>' + fmtDate(i.date) + dateBadge(i.date) + '</td><td><span class="badge">' + i.kind + '</span></td><td><strong>' + esc(i.label) + '</strong><br><span class="meta">' + esc(i.sub) + "</span></td></tr>";
  let h = '<section class="panel"><h2>Court Calendar — every court date and deadline, in order</h2>';
  if (!items.length) h += '<p class="empty-note">Nothing on the calendar yet. Court dates come from each matter\u2019s next court date; deadlines come from open tasks with due dates.</p>';
  else {
    if (overdue.length) h += "<h3>Overdue — needs attention</h3><table class=\"data\"><tbody>" + overdue.map(row).join("") + "</tbody></table>";
    if (upcoming.length) h += "<h3>Coming up</h3><table class=\"data\"><tbody>" + upcoming.map(row).join("") + "</tbody></table>";
  }
  h += "</section>";
  $("view-calendar").innerHTML = h;
}

/* ---------------- Tasks ---------------- */
function renderTasks() {
  const db = dbGet();
  const tasks = db.tasks.slice().sort((a, b) => (a.done - b.done) || ((a.due || "9999") < (b.due || "9999") ? -1 : 1));
  let h = '<section class="panel"><h2>Tasks</h2>';
  if (!tasks.length) h += '<p class="empty-note">No tasks yet. Add the first one below — tie it to a matter so nothing floats loose.</p>';
  else h += '<ul class="item-list">' + tasks.map((t) => taskRow(t).replace("</li>", '<br><span class="meta">' + esc(matterName(t.matterId)) + "</span></li>")).join("") + "</ul>";
  h += '<form id="task-form"><div class="grid2"><label>Task <span class="req">*</span><input type="text" id="tf-title"></label>'
    + '<label>Matter<select id="tf-matter"><option value="">— No matter —</option>' + db.matters.map((m) => '<option value="' + m.id + '">' + esc(m.person) + "</option>").join("") + "</select></label>"
    + '<label>Due date<input type="date" id="tf-due"></label></div>'
    + '<p><button type="submit" class="btn-navy">Add task</button></p></form></section>';
  $("view-tasks").innerHTML = h;
  wireTaskToggles($("view-tasks"));
  $("task-form").addEventListener("submit", (e) => {
    e.preventDefault(); const title = $("tf-title").value.trim(); if (!title) return;
    const db2 = dbGet(); db2.tasks.push({ id: uid(), matterId: $("tf-matter").value || null, title, due: $("tf-due").value, done: false }); dbSet(db2); renderTasks();
  });
}

function wireTaskToggles(root) {
  if (!root) return;
  root.querySelectorAll("[data-task-done]").forEach((cb) => cb.addEventListener("change", () => {
    const db = dbGet(); const t = db.tasks.find((x) => x.id === cb.getAttribute("data-task-done")); if (t) { t.done = cb.checked; dbSet(db); }
    if (state.tab === "tasks") renderTasks(); else if (state.tab === "matters") renderMatters(); else renderOverview();
  }));
  root.querySelectorAll("[data-task-del]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this task? This cannot be undone.")) return;
    const db = dbGet(); db.tasks = db.tasks.filter((x) => x.id !== b.getAttribute("data-task-del")); dbSet(db);
    if (state.tab === "tasks") renderTasks(); else renderMatters();
  }));
}

/* ---------------- Contacts ---------------- */
function renderContacts() {
  const db = dbGet();
  let h = '<section class="panel"><h2>Contacts — the people and offices around the matters</h2>';
  if (!db.contacts.length) h += '<p class="empty-note">No contacts yet. Add the court clerks, probation officers, attorneys, and family contacts the matters depend on.</p>';
  else h += '<table class="data"><thead><tr><th>Name</th><th>Role</th><th>Organization</th><th>Phone</th><th>Email</th><th>Matter</th><th></th></tr></thead><tbody>'
    + db.contacts.map((c) => "<tr><td><strong>" + esc(c.name) + "</strong>" + (c.notes ? '<br><span class="meta">' + esc(c.notes) + "</span>" : "") + "</td><td>" + esc(c.role) + "</td><td>" + esc(c.org || "—") + "</td><td>" + esc(c.phone || "—") + "</td><td>" + esc(c.email || "—") + "</td><td>" + (c.matterId ? esc(matterName(c.matterId)) : "—") + "</td><td>" + (state.user && state.user.admin ? '<button type="button" class="btn-small btn-danger" data-contact-del="' + c.id + '">Delete</button>' : "") + "</td></tr>").join("") + "</tbody></table>";
  h += '<form id="contact-form"><div class="grid2">'
    + '<label>Name <span class="req">*</span><input type="text" id="cf-name"></label>'
    + '<label>Role<select id="cf-role">' + CFG.contactRoles.map((r) => "<option>" + esc(r) + "</option>").join("") + "</select></label>"
    + '<label>Organization<input type="text" id="cf-org"></label>'
    + '<label>Phone<input type="tel" id="cf-phone"></label>'
    + '<label>Email<input type="email" id="cf-email"></label>'
    + '<label>Tied to matter<select id="cf-matter"><option value="">— General —</option>' + db.matters.map((m) => '<option value="' + m.id + '">' + esc(m.person) + "</option>").join("") + "</select></label>"
    + "</div><label>Notes<input type=\"text\" id=\"cf-notes\"></label>"
    + '<p><button type="submit" class="btn-navy">Add contact</button></p></form></section>';
  $("view-contacts").innerHTML = h;
  wireView($("view-contacts"));
  $("contact-form").addEventListener("submit", (e) => {
    e.preventDefault(); const name = $("cf-name").value.trim(); if (!name) return;
    const db2 = dbGet(); db2.contacts.push({ id: uid(), name, role: $("cf-role").value, org: $("cf-org").value.trim(), phone: $("cf-phone").value.trim(), email: $("cf-email").value.trim(), matterId: $("cf-matter").value || null, notes: $("cf-notes").value.trim() }); dbSet(db2); renderContacts();
  });
  document.querySelectorAll("[data-contact-del]").forEach((b) => b.addEventListener("click", () => {
    if (!confirm("Delete this contact? This cannot be undone.")) return;
    const db2 = dbGet(); db2.contacts = db2.contacts.filter((x) => x.id !== b.getAttribute("data-contact-del")); dbSet(db2); renderContacts();
  }));
}

/* ---------------- Admin & Data ---------------- */
function renderAdmin() {
  const db = dbGet();
  let h = '<section class="panel"><h2>Admin &amp; Data</h2>'
    + '<p class="hint">Signed in as <strong>' + esc(state.user.name) + "</strong> — " + esc(state.user.role) + (state.user.admin ? " · <strong>Administrator</strong>: you can add, edit, and delete everything in this tracker, and manage user access from the <em>Admin — user access</em> button in the header." : ".") + "</p>"
    + '<table class="data"><tbody>'
    + "<tr><th>Matters</th><td>" + db.matters.length + " total · " + db.matters.filter(isOpen).length + " open</td></tr>"
    + "<tr><th>Tasks</th><td>" + db.tasks.length + " total · " + db.tasks.filter((t) => !t.done).length + " open</td></tr>"
    + "<tr><th>Contacts</th><td>" + db.contacts.length + "</td></tr>"
    + "<tr><th>Applications</th><td>" + (db.applications ? db.applications.length : 0) + " received in this tracker</td></tr></tbody></table>"
    + "<h3>Backup — download the tracker data</h3>"
    + '<p class="hint">The tracker\u2019s records live in this device\u2019s browser storage (Local Mode). Download a JSON copy regularly and keep it with the Legal Department records. The locked binders remain the official record.</p>'
    + '<p><button type="button" class="btn-navy" id="ad-export">Download backup (JSON)</button></p>'
    + "<h3>Restore from a backup</h3>"
    + '<p class="hint">Restoring replaces everything in the tracker on this device with the backup file\u2019s contents. This cannot be undone.</p>'
    + '<p><input type="file" id="ad-import" accept="application/json"></p>'
    + '<p class="save-status" id="ad-msg"></p></section>';
  $("view-admin").innerHTML = h;
  $("ad-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(dbGet(), null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "justice-support-tracker-backup-" + todayStr() + ".json"; a.click(); URL.revokeObjectURL(a.href);
  });
  $("ad-import").addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    file.text().then((text) => {
      try { const d = JSON.parse(text); if (!Array.isArray(d.matters) || !Array.isArray(d.tasks) || !Array.isArray(d.contacts)) throw new Error("shape"); if (!Array.isArray(d.applications)) d.applications = []; dbSet(d); $("ad-msg").textContent = "Backup restored."; renderAdmin(); }
      catch { $("ad-msg").textContent = "That file is not a tracker backup — nothing was changed."; }
    });
  });
}

/* ---------------- Shell ---------------- */
function wireView(root) {
  if (!root) return;
  root.querySelectorAll("[data-open-matter]").forEach((el) => el.addEventListener("click", () => { state.matterId = el.getAttribute("data-open-matter"); state.editingMatter = null; showTab("matters"); }));
  root.querySelectorAll("[data-goto]").forEach((el) => el.addEventListener("click", () => showTab(el.getAttribute("data-goto"))));
}
function showTab(tab) {
  state.tab = tab;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-tab") === tab));
  ["overview", "application", "matters", "calendar", "tasks", "contacts", "policies", "admin"].forEach((t) => { $("view-" + t).hidden = t !== tab; });
  if (tab === "overview") renderOverview();
  if (tab === "application") renderApplication();
  if (tab === "matters") renderMatters();
  if (tab === "calendar") renderCalendar();
  if (tab === "tasks") renderTasks();
  if (tab === "contacts") renderContacts();
  if (tab === "policies") renderPolicies();
  if (tab === "admin") renderAdmin();
}
function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = state.user.name + " · " + state.user.role + (state.user.admin ? " · Administrator" : "");
  $("tab-admin").hidden = !(state.user && state.user.admin);
  showTab("overview");
}
document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.getAttribute("data-tab"))));
$("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.justice.v1", sessionKey: "justice.user", onSignIn: (u) => { state.user = u; enterApp(); } });
const restored = CPPAuth.restoreSession(); if (restored) { state.user = restored; enterApp(); }

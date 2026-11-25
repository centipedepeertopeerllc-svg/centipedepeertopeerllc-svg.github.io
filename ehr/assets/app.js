"use strict";
/* Centipede Peer to Peer, LLC — Centipede EHR (assets/app.js).
   Built November 24, 2026 at the direction of the Chief Executive
   Officer: Centipede's own internal peer-support record system,
   modeled on the feature set of a full practice-management system
   — clients, calendar, session notes, support plans, documents,
   billing & insurance, reminders — reshaped for a NON-CLINICAL
   peer-support company.
   Staff support, coach, mentor, and navigate; notes are peer-support
   session notes in DAP format (Data / Assessment / Plan), where the
   "Assessment" is the peer worker's plain summary of where the
   person stands — never a clinical judgment of any kind.

   This is a STANDALONE system at its own webpage (Levi's direction,
   Nov 24, 2026): it is not part of the Company Portal. Sign-in uses
   the same usernames and passwords as the Portal dashboards (same
   seed pattern, same current password hashes in config.js).

   Records live in this device's browser storage (Local Mode) under
   "cpp.ehr.v1". The store seeds EMPTY — no real client information
   is ever seeded into a dashboard file. The locked client binders
   remain the official record. Billing here is tracking only: service
   log + claim status; this system does not submit claims. */
const CFG = window.EHR_CONFIG;
const DB_KEY = "cpp.ehr.v1";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const fmtDate = (s) => { if (!s) return "—"; const p = String(s).split("-"); if (p.length !== 3) return s; return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(p[1]) - 1] + " " + Number(p[2]) + ", " + p[0]; };
const daysUntil = (s) => { if (!s) return null; const a = new Date(todayStr() + "T00:00:00"); const b = new Date(s + "T00:00:00"); return Math.round((b - a) / 86400000); };
const EMPTY = () => ({ clients: [], appointments: [], notes: [], plans: [], documents: [], services: [], reminders: [], staff: [], billDocs: [], activity: [], settings: null });

const dbGet = () => { try { const d = JSON.parse(localStorage.getItem(DB_KEY)); if (d && Array.isArray(d.clients) && Array.isArray(d.appointments) && Array.isArray(d.notes) && Array.isArray(d.plans) && Array.isArray(d.documents) && Array.isArray(d.services) && Array.isArray(d.reminders)) { if (!Array.isArray(d.staff)) d.staff = []; if (!Array.isArray(d.billDocs)) d.billDocs = []; if (!Array.isArray(d.activity)) d.activity = []; if (!d.settings || typeof d.settings !== "object") d.settings = null; return d; } } catch { /* fall through */ } return EMPTY(); };
const dbSet = (d) => localStorage.setItem(DB_KEY, JSON.stringify(d));

const state = { user: null, tab: "overview", clientId: null, editing: {}, search: "", calView: "upcoming", calMode: "list", calCursor: null, checklistClient: "" };

/* Local audit trail (Admin → Activity): sign-ins and record actions
   with timestamps, kept in this browser's store only. */
function logActivity(action) {
  try {
    const d = dbGet();
    d.activity.push({ ts: new Date().toISOString(), user: state.user ? state.user.username : "", action: String(action || "") });
    if (d.activity.length > 400) d.activity = d.activity.slice(-400);
    dbSet(d);
  } catch { /* the audit trail must never break the app */ }
}
function settingsGet(d) {
  const s = (d && d.settings) || {};
  return {
    cancellationPolicy: s.cancellationPolicy || CFG.cancellationPolicies[1],
    reminderRules: Object.assign({}, CFG.reminderRuleDefaults, s.reminderRules || {})
  };
}

function clientName(id) { const c = dbGet().clients.find((x) => x.id === id); return c ? c.name : "(client removed)"; }
function dateBadge(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return "";
  if (d < 0) return ' <span class="badge badge-overdue">' + Math.abs(d) + "d overdue</span>";
  if (d === 0) return ' <span class="badge badge-overdue">TODAY</span>';
  if (d <= 14) return ' <span class="badge badge-soon">in ' + d + "d</span>";
  return "";
}
function opts(list, cur, blank) { let h = blank ? '<option value="">' + esc(blank) + "</option>" : ""; list.forEach((o) => { const v = typeof o === "string" ? o : o.code; const l = typeof o === "string" ? o : o.label; h += '<option value="' + esc(v) + '"' + (v === cur ? " selected" : "") + ">" + esc(l) + "</option>"; }); return h; }
function clientOpts(cur, blank) { const cs = dbGet().clients.slice().sort((a, b) => a.name < b.name ? -1 : 1); let h = blank ? '<option value="">' + esc(blank) + "</option>" : ""; cs.forEach((c) => { h += '<option value="' + c.id + '"' + (c.id === cur ? " selected" : "") + ">" + esc(c.name) + "</option>"; }); return h; }
function saveMsg(el) { if (el) { el.textContent = "Saved ✓ " + new Date().toLocaleTimeString(); } }

/* ---------------- Overview ---------------- */
function renderOverview() {
  const db = dbGet();
  const t = todayStr();
  const todays = db.appointments.filter((a) => a.date === t && entryKind(a) !== "ooo" && entryKind(a) !== "availability" && a.status !== "Cancelled").sort((a, b) => (a.time || "") < (b.time || "") ? -1 : 1);
  const followUps = db.reminders.filter((r) => !r.done && daysUntil(r.due) !== null && daysUntil(r.due) <= 0).sort((a, b) => a.due < b.due ? -1 : 1);
  const drafts = db.notes.filter((n) => n.status === "Draft");
  const active = db.clients.filter((c) => c.status === "Active");
  const byClaim = {}; CFG.claimStatuses.forEach((s) => { byClaim[s] = 0; });
  db.services.forEach((s) => { if (byClaim[s.claimStatus] !== undefined) byClaim[s.claimStatus]++; });
  let h = '<div class="stats">'
    + '<div class="stat"><div class="num">' + todays.length + '</div><div class="lbl">Appointments today</div></div>'
    + '<div class="stat' + (followUps.length ? " alert" : "") + '"><div class="num">' + followUps.length + '</div><div class="lbl">Clients needing follow-up (due or overdue)</div></div>'
    + '<div class="stat' + (drafts.length ? " alert" : "") + '"><div class="num">' + drafts.length + '</div><div class="lbl">Unsigned (draft) session notes</div></div>'
    + '<div class="stat"><div class="num">' + active.length + '</div><div class="lbl">Active clients</div></div>'
    + "</div>";
  h += '<section class="panel"><h2>Today\'s appointments — ' + fmtDate(t) + "</h2>";
  if (!todays.length) h += '<p class="empty-note">No appointments scheduled for today. Add one in the Calendar tab.</p>';
  else { h += '<ul class="item-list">'; todays.forEach((a) => { h += '<li><strong>' + esc(a.time || "—") + "</strong> · " + esc(entryLabel(a)) + (a.serviceType ? " · " + esc(a.serviceType) : "") + (a.location ? " · " + esc(a.location) : "") + "</li>"; }); h += "</ul>"; }
  h += "</section>";
  h += '<section class="panel"><h2>Clients needing follow-up</h2>';
  if (!followUps.length) h += '<p class="empty-note">No follow-ups due. Reminders that are due or overdue show here.</p>';
  else { h += '<ul class="item-list">'; followUps.forEach((r) => { h += '<li class="clickable" data-open-client="' + r.clientId + '"><strong>' + esc(clientName(r.clientId)) + "</strong> — " + esc(r.text) + dateBadge(r.due) + "</li>"; }); h += "</ul>"; }
  h += "</section>";
  h += '<section class="panel"><h2>Billing snapshot</h2><div class="stats">';
  CFG.claimStatuses.forEach((s) => { h += '<div class="stat"><div class="num">' + byClaim[s] + '</div><div class="lbl">Services — ' + esc(s) + "</div></div>"; });
  h += '</div><p class="hint">Billing here is tracking only — a service log with claim status. This system does not submit claims.</p></section>';
  $("view-overview").innerHTML = h;
  wireView($("view-overview"));
}

/* ---------------- Clients ---------------- */
function contactRow(ct) {
  ct = ct || {};
  return '<div class="contact-row grid2">'
    + '<div><label>Contact name</label><input type="text" class="ct-name" value="' + esc(ct.name || "") + '"></div>'
    + '<div><label>Relationship</label><input type="text" class="ct-rel" value="' + esc(ct.relationship || "") + '" placeholder="Family Member, Friend, Case Manager…"></div>'
    + '<div><label>Phone</label><input type="tel" class="ct-phone" value="' + esc(ct.phone || "") + '"></div>'
    + '<div><label>Email</label><input type="email" class="ct-email" value="' + esc(ct.email || "") + '"></div>'
    + '<div><label style="font-weight:normal;"><input type="checkbox" class="ct-rem"' + (ct.receivesReminders ? " checked" : "") + '> Receives appointment reminders</label></div>'
    + '<div><button type="button" class="btn-small ct-remove">Remove contact</button></div></div>';
}
function clientForm(c) {
  c = c || {};
  const ins = c.insurance || {};
  const comm = c.comm || {};
  const contacts = Array.isArray(c.contacts) ? c.contacts : [];
  let contactRows = "";
  contacts.forEach((ct) => { contactRows += contactRow(ct); });
  return '<form id="client-form" class="panel"><h2>' + (c.id ? "Edit client" : "Add a client") + '</h2>'
    + '<div class="grid2"><div><label>Full name <span class="req">*</span></label><input type="text" id="cf-name" value="' + esc(c.name || "") + '" required></div>'
    + '<div><label>What name do they go by?</label><input type="text" id="cf-goesby" value="' + esc(c.goesBy || "") + '"></div>'
    + '<div><label>Date of birth</label><input type="date" id="cf-dob" value="' + esc(c.dob || "") + '"></div>'
    + '<div><label>Phone</label><input type="tel" id="cf-phone" value="' + esc(c.phone || "") + '"></div>'
    + '<div><label>Email</label><input type="email" id="cf-email" value="' + esc(c.email || "") + '"></div>'
    + '<div><label>Preferred language</label><select id="cf-language">' + opts(CFG.languages, c.language || "No answer") + '</select></div></div>'
    + '<label>Address</label><input type="text" id="cf-address" value="' + esc(c.address || "") + '">'
    + '<div class="grid2"><div><label>Program</label><select id="cf-program">' + opts(CFG.programs, c.program || "Peer Support") + '</select></div>'
    + '<div><label>Status</label><select id="cf-status">' + opts(CFG.clientStatuses, c.status || "Active") + '</select></div>'
    + '<div><label>Assigned staff</label><input type="text" id="cf-staff" value="' + esc(c.staff || "") + '"></div>'
    + '<div><label>Emergency contact</label><input type="text" id="cf-emerg" value="' + esc(c.emergency || "") + '" placeholder="Name and phone"></div>'
    + '<div><label>Date first seen</label><input type="date" id="cf-firstseen" value="' + esc(c.firstSeen || "") + '"></div>'
    + '<div><label>Referred by</label><input type="text" id="cf-referred" value="' + esc(c.referredBy || "") + '"></div></div>'
    + '<div class="grid2"><div><label style="font-weight:normal;"><input type="checkbox" id="cf-waitlist"' + (c.onWaitlist ? " checked" : "") + '> On the waitlist</label></div>'
    + '<div><label style="font-weight:normal;"><input type="checkbox" id="cf-restricted"' + (c.restricted ? " checked" : "") + '> Restricted access — limit who can open this record</label></div></div>'
    + '<fieldset><legend>Contacts</legend><div id="cf-contacts">' + contactRows + '</div>'
    + '<p><button type="button" class="btn-small" id="cf-add-contact">Add a contact</button></p>'
    + '<p class="hint">Family members, friends, case managers, and others the client wants on their record.</p></fieldset>'
    + '<fieldset><legend>Communication settings</legend>'
    + '<p class="hint">Which reminders this client receives, per channel. Reminder rules themselves are set in the Reminders tab; in Local Mode reminders are tracked here, not sent automatically.</p>'
    + '<label style="font-weight:normal;"><input type="checkbox" id="cf-comm-email"' + (comm.apptEmail !== false ? " checked" : "") + '> Appointment reminders by email</label>'
    + '<label style="font-weight:normal;"><input type="checkbox" id="cf-comm-text"' + (comm.apptText !== false ? " checked" : "") + '> Appointment reminders by text</label>'
    + '<label style="font-weight:normal;"><input type="checkbox" id="cf-comm-voice"' + (comm.apptVoice ? " checked" : "") + '> Appointment reminders by voice call</label>'
    + '<label style="font-weight:normal;"><input type="checkbox" id="cf-comm-doc"' + (comm.docReminders ? " checked" : "") + '> Document reminders</label></fieldset>'
    + '<fieldset><legend>Insurance (for billing tracking)</legend><div class="grid2">'
    + '<div><label>Insurance payer</label><input type="text" id="cf-payer" value="' + esc(ins.payer || "") + '"></div>'
    + '<div><label>Member ID</label><input type="text" id="cf-member" value="' + esc(ins.memberId || "") + '"></div>'
    + '<div><label>Group number</label><input type="text" id="cf-group" value="' + esc(ins.groupId || "") + '"></div>'
    + '<div><label>Insurance notes</label><input type="text" id="cf-insnotes" value="' + esc(ins.notes || "") + '"></div></div></fieldset>'
    + '<label>General notes</label><textarea id="cf-notes" rows="3">' + esc(c.notes || "") + '</textarea>'
    + '<button type="submit" class="btn-navy">' + (c.id ? "Save changes" : "Add client") + '</button> '
    + '<button type="button" class="btn-small" id="cf-cancel">Cancel</button> <span class="save-status" id="cf-status-msg"></span></form>';
}
function renderClients() {
  const db = dbGet();
  const root = $("view-clients");
  if (state.clientId) { renderClientDetail(root, db); return; }
  if (state.editing.client) {
    const c = state.editing.client === "new" ? null : db.clients.find((x) => x.id === state.editing.client);
    root.innerHTML = clientForm(c);
    $("cf-cancel").addEventListener("click", () => { state.editing.client = null; renderClients(); });
    const wireContactRow = (row) => { const b = row.querySelector(".ct-remove"); if (b) b.addEventListener("click", () => row.remove()); };
    root.querySelectorAll(".contact-row").forEach(wireContactRow);
    $("cf-add-contact").addEventListener("click", () => { const div = document.createElement("div"); div.innerHTML = contactRow({}); const row = div.firstChild; $("cf-contacts").appendChild(row); wireContactRow(row); });
    $("client-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const contacts = Array.from(root.querySelectorAll(".contact-row")).map((row) => ({ name: row.querySelector(".ct-name").value.trim(), relationship: row.querySelector(".ct-rel").value.trim(), phone: row.querySelector(".ct-phone").value.trim(), email: row.querySelector(".ct-email").value.trim(), receivesReminders: row.querySelector(".ct-rem").checked })).filter((ct) => ct.name || ct.phone || ct.email);
      const rec = { name: $("cf-name").value.trim(), goesBy: $("cf-goesby").value.trim(), dob: $("cf-dob").value, phone: $("cf-phone").value.trim(), email: $("cf-email").value.trim(), language: $("cf-language").value, address: $("cf-address").value.trim(), program: $("cf-program").value, status: $("cf-status").value, staff: $("cf-staff").value.trim(), emergency: $("cf-emerg").value.trim(), firstSeen: $("cf-firstseen").value, referredBy: $("cf-referred").value.trim(), onWaitlist: $("cf-waitlist").checked, restricted: $("cf-restricted").checked, contacts: contacts, comm: { apptEmail: $("cf-comm-email").checked, apptText: $("cf-comm-text").checked, apptVoice: $("cf-comm-voice").checked, docReminders: $("cf-comm-doc").checked }, notes: $("cf-notes").value, insurance: { payer: $("cf-payer").value.trim(), memberId: $("cf-member").value.trim(), groupId: $("cf-group").value.trim(), notes: $("cf-insnotes").value.trim() } };
      if (!rec.name) return;
      let actMsg;
      if (c) { Object.assign(d.clients.find((x) => x.id === c.id), rec); actMsg = "Edited client " + rec.name; }
      else { rec.id = uid(); rec.createdAt = todayStr(); d.clients.push(rec); actMsg = "Added client " + rec.name; }
      dbSet(d); logActivity(actMsg); state.editing.client = null; renderClients();
    });
    return;
  }
  const q = state.search.toLowerCase();
  const list = db.clients.filter((c) => !q || c.name.toLowerCase().includes(q) || (c.program || "").toLowerCase().includes(q)).sort((a, b) => a.name < b.name ? -1 : 1);
  let h = '<section class="panel"><div class="toolbar"><label>Search clients<input type="text" id="client-search" value="' + esc(state.search) + '" placeholder="Name or program"></label>'
    + '<button type="button" class="btn-navy" id="client-add">Add a client</button></div>';
  if (!list.length) h += '<p class="empty-note">' + (db.clients.length ? "No clients match the search." : "No clients yet. Add the first client to start the roster.") + "</p>";
  else {
    h += '<table class="data"><tr><th>Name</th><th>Program</th><th>Status</th><th>Phone</th><th>Assigned staff</th></tr>';
    list.forEach((c) => { h += '<tr class="clickable" data-open-client="' + c.id + '"><td><strong>' + esc(c.name) + '</strong>' + (c.onWaitlist ? ' <span class="badge badge-soon">Waitlist</span>' : "") + (c.restricted ? ' <span class="badge badge-overdue">Restricted access</span>' : "") + '</td><td>' + esc(c.program || "—") + '</td><td>' + esc(c.status || "—") + '</td><td>' + esc(c.phone || "—") + '</td><td>' + esc(c.staff || "—") + "</td></tr>"; });
    h += "</table>";
  }
  h += "</section>";
  root.innerHTML = h;
  $("client-search").addEventListener("input", (e) => { state.search = e.target.value; const pos = e.target.selectionStart; renderClients(); const s = $("client-search"); s.focus(); s.setSelectionRange(pos, pos); });
  $("client-add").addEventListener("click", () => { state.editing.client = "new"; renderClients(); });
  wireView(root);
}
function renderClientDetail(root, db) {
  const c = db.clients.find((x) => x.id === state.clientId);
  if (!c) { state.clientId = null; renderClients(); return; }
  const ins = c.insurance || {};
  const notes = db.notes.filter((n) => n.clientId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const plans = db.plans.filter((p) => p.clientId === c.id);
  const docs = db.documents.filter((d) => d.clientId === c.id);
  const svcs = db.services.filter((s) => s.clientId === c.id).sort((a, b) => a.date < b.date ? 1 : -1);
  const rems = db.reminders.filter((r) => r.clientId === c.id && !r.done);
  const comm = c.comm || {};
  const commList = [];
  if (comm.apptEmail !== false) commList.push("Email appointment reminders");
  if (comm.apptText !== false) commList.push("Text appointment reminders");
  if (comm.apptVoice) commList.push("Voice appointment reminders");
  if (comm.docReminders) commList.push("Document reminders");
  let h = '<section class="panel"><button type="button" class="btn-small" id="back-clients">← All clients</button>'
    + "<h2>" + esc(c.name) + ' <span class="badge badge-stage">' + esc(c.status || "") + "</span>"
    + (c.onWaitlist ? ' <span class="badge badge-soon">Waitlist</span>' : "") + (c.restricted ? ' <span class="badge badge-overdue">Restricted access</span>' : "") + "</h2>"
    + '<dl class="detail-grid">'
    + "<div><dt>Program</dt><dd>" + esc(c.program || "—") + "</dd></div>"
    + (c.goesBy ? "<div><dt>Goes by</dt><dd>" + esc(c.goesBy) + "</dd></div>" : "")
    + "<div><dt>Date of birth</dt><dd>" + fmtDate(c.dob) + "</dd></div>"
    + "<div><dt>Phone</dt><dd>" + esc(c.phone || "—") + "</dd></div>"
    + "<div><dt>Email</dt><dd>" + esc(c.email || "—") + "</dd></div>"
    + "<div><dt>Preferred language</dt><dd>" + esc(c.language || "—") + "</dd></div>"
    + "<div><dt>Address</dt><dd>" + esc(c.address || "—") + "</dd></div>"
    + "<div><dt>Assigned staff</dt><dd>" + esc(c.staff || "—") + "</dd></div>"
    + "<div><dt>Emergency contact</dt><dd>" + esc(c.emergency || "—") + "</dd></div>"
    + "<div><dt>Date first seen</dt><dd>" + fmtDate(c.firstSeen) + "</dd></div>"
    + "<div><dt>Referred by</dt><dd>" + esc(c.referredBy || "—") + "</dd></div>"
    + "<div><dt>Client since</dt><dd>" + fmtDate(c.createdAt) + "</dd></div>"
    + "<div><dt>Communication settings</dt><dd>" + esc(commList.length ? commList.join(" · ") : "No reminders enabled") + "</dd></div></dl>"
    + (c.notes ? '<blockquote class="note-text">' + esc(c.notes) + "</blockquote>" : "")
    + '<p><button type="button" class="btn-small" id="edit-client">Edit client</button></p></section>';
  const contacts = Array.isArray(c.contacts) ? c.contacts : [];
  if (contacts.length) {
    h += '<section class="panel"><h2>Contacts</h2><table class="data"><tr><th>Name</th><th>Relationship</th><th>Phone</th><th>Email</th><th>Reminders</th></tr>';
    contacts.forEach((ct) => { h += "<tr><td>" + esc(ct.name || "—") + "</td><td>" + esc(ct.relationship || "—") + "</td><td>" + esc(ct.phone || "—") + "</td><td>" + esc(ct.email || "—") + "</td><td>" + (ct.receivesReminders ? "Receives reminders" : "—") + "</td></tr>"; });
    h += "</table></section>";
  }
  h += '<section class="panel"><h2>Insurance</h2><dl class="detail-grid">'
    + "<div><dt>Payer</dt><dd>" + esc(ins.payer || "—") + "</dd></div>"
    + "<div><dt>Member ID</dt><dd>" + esc(ins.memberId || "—") + "</dd></div>"
    + "<div><dt>Group number</dt><dd>" + esc(ins.groupId || "—") + "</dd></div>"
    + "<div><dt>Notes</dt><dd>" + esc(ins.notes || "—") + "</dd></div></dl></section>";
  h += '<section class="panel"><h2>Support plan</h2>';
  if (!plans.length) h += '<p class="empty-note">No support plan yet. Add one in the Support Plans tab.</p>';
  plans.forEach((p) => { h += '<p><strong>' + esc(p.status) + "</strong> · " + esc(planTemplateOf(p)) + " template · Review by " + fmtDate(p.reviewDate) + dateBadge(p.reviewDate) + "</p>" + planBodyHtml(p); });
  h += '</section><section class="panel"><h2>Recent notes</h2>';
  if (!notes.length) h += '<p class="empty-note">No notes yet.</p>';
  notes.slice(0, 5).forEach((n) => { h += '<p><strong>' + fmtDate(n.date) + "</strong> · " + esc(noteTypeOf(n) === "Chart" ? "Chart Note" : noteTypeOf(n)) + " · " + esc(n.status) + " · " + esc(n.author || "") + "</p>" + noteBodyHtml(n); });
  h += '</section><section class="panel"><h2>Documents on file (' + docs.length + ")</h2>";
  if (!docs.length) h += '<p class="empty-note">No documents tracked yet. Add them in the Documents tab.</p>';
  else { h += '<ul class="item-list">'; docs.forEach((d) => { h += "<li>" + esc(d.type) + " · " + fmtDate(d.date) + ' <span class="badge">' + esc(d.status) + "</span></li>"; }); h += "</ul>"; }
  h += '</section><section class="panel"><h2>Service log (' + svcs.length + ")</h2>";
  if (!svcs.length) h += '<p class="empty-note">No services logged yet.</p>';
  else { h += '<ul class="item-list">'; svcs.slice(0, 8).forEach((s) => { h += "<li>" + fmtDate(s.date) + " · " + esc(s.code) + " · " + esc(s.units) + ' units <span class="badge">' + esc(s.claimStatus) + "</span></li>"; }); h += "</ul>"; }
  h += '</section><section class="panel"><h2>Open reminders (' + rems.length + ")</h2>";
  if (!rems.length) h += '<p class="empty-note">No open reminders for this client.</p>';
  else { h += '<ul class="item-list">'; rems.forEach((r) => { h += "<li>" + esc(r.text) + dateBadge(r.due) + "</li>"; }); h += "</ul>"; }
  h += "</section>";
  root.innerHTML = h;
  $("back-clients").addEventListener("click", () => { state.clientId = null; renderClients(); });
  $("edit-client").addEventListener("click", () => { state.editing.client = c.id; state.clientId = null; renderClients(); });
}

/* ---------------- Calendar ---------------- */
const DAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function dateAdd(s, days) { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + days); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function entryKind(a) { return a && a.kind ? a.kind : "appointment"; }
function entryLabel(a) {
  const k = entryKind(a);
  if (k === "event") return a.title || "Event";
  if (k === "ooo") return "Out of office" + (a.staff ? " — " + a.staff : "");
  if (k === "availability") return a.title || ("Availability" + (a.staff ? " — " + a.staff : ""));
  if (Array.isArray(a.clientIds) && a.clientIds.length) return (a.title || "Group appointment") + " (" + a.clientIds.length + " clients)";
  return clientName(a.clientId);
}
function expandRecurring(baseDate, rec) {
  /* Returns the list of dates for a recurring series, base date first. */
  const out = [];
  const max = 60;
  const start = new Date(baseDate + "T00:00:00");
  const interval = Math.min(8, Math.max(1, Number(rec.interval) || 1));
  const endsCount = rec.endsType === "count" ? Math.min(max, Math.max(1, Number(rec.count) || 30)) : null;
  const until = rec.endsType === "date" && rec.until ? rec.until : null;
  const push = (dstr) => { if (until && dstr > until) return false; out.push(dstr); return !(endsCount && out.length >= endsCount); };
  if (rec.freq === "week") {
    const days = Array.isArray(rec.days) && rec.days.length ? rec.days.slice().sort((x, y) => x - y) : [start.getDay()];
    let weekStart = dateAdd(baseDate, -start.getDay());
    let guard = 0;
    while (guard++ < 120) {
      for (const wd of days) {
        const dstr = dateAdd(weekStart, wd);
        if (dstr < baseDate) continue;
        if (!push(dstr)) return out;
        if (out.length >= max) return out;
      }
      weekStart = dateAdd(weekStart, 7 * interval);
      if (until && weekStart > until) break;
    }
    return out;
  }
  if (rec.freq === "month" || rec.freq === "year") {
    let cur = baseDate;
    let guard = 0;
    while (guard++ < 120) {
      if (!push(cur)) break;
      if (out.length >= max) break;
      const d = new Date(cur + "T00:00:00");
      if (rec.freq === "month") d.setMonth(d.getMonth() + interval); else d.setFullYear(d.getFullYear() + interval);
      cur = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    }
    return out;
  }
  return [baseDate];
}
function apptForm(a) {
  a = a || {};
  const kind = entryKind(a);
  const isGroup = Array.isArray(a.clientIds) && a.clientIds.length > 0;
  const schedServices = CFG.serviceCatalog.filter((s) => s.active && s.schedulable).map((s) => ({ code: s.code, label: s.code + " — " + s.description }));
  const clients = dbGet().clients.slice().sort((x, y) => x.name < y.name ? -1 : 1);
  let groupChecks = "";
  clients.forEach((c) => { groupChecks += '<label style="display:inline-block;margin:0.15rem 0.7rem 0.15rem 0;font-weight:normal;"><input type="checkbox" class="af-gclient" value="' + c.id + '"' + (isGroup && a.clientIds.includes(c.id) ? " checked" : "") + "> " + esc(c.name) + "</label>"; });
  let dayChecks = "";
  DAY_NAMES.forEach((nm, i) => { dayChecks += '<label style="display:inline-block;margin:0.15rem 0.5rem 0.15rem 0;font-weight:normal;"><input type="checkbox" class="af-rday" value="' + i + '"> ' + nm + "</label>"; });
  return '<form id="appt-form" class="panel"><h2>' + (a.id ? "Edit calendar entry" : "Add to the calendar") + '</h2>'
    + '<label>Entry type</label><select id="af-kind">'
    + '<option value="appointment"' + (kind === "appointment" ? " selected" : "") + '>Appointment</option>'
    + '<option value="event"' + (kind === "event" ? " selected" : "") + '>Event (non-client)</option>'
    + '<option value="ooo"' + (kind === "ooo" ? " selected" : "") + '>Out of office</option>'
    + '<option value="availability"' + (kind === "availability" ? " selected" : "") + '>Availability block</option></select>'
    + '<div id="af-sec-appt"' + (kind === "appointment" ? "" : " hidden") + '>'
    + '<div class="grid2"><div><label>Individual or group</label><select id="af-mode"><option value="individual"' + (!isGroup ? " selected" : "") + '>Individual</option><option value="group"' + (isGroup ? " selected" : "") + '>Group (up to 15 clients)</option></select></div></div>'
    + '<div id="af-sec-individual"' + (isGroup ? " hidden" : "") + '><label>Client <span class="req">*</span></label><select id="af-client">' + clientOpts(a.clientId) + '</select></div>'
    + '<div id="af-sec-group"' + (isGroup ? "" : " hidden") + '><label>Group title</label><input type="text" id="af-gtitle" value="' + esc(isGroup ? (a.title || "") : "") + '" placeholder="e.g. Tuesday support group">'
    + '<fieldset><legend>Clients in the group (up to 15)</legend>' + (clients.length ? groupChecks : '<p class="hint">No clients on the roster yet.</p>') + '</fieldset></div>'
    + '<div class="grid2"><div><label>Service type</label><select id="af-type">' + opts(CFG.serviceTypes, a.serviceType || "Peer Support Session") + '</select></div>'
    + '<div><label>Service (for billing tracking)</label><select id="af-service"><option value="">(none)</option>' + opts(schedServices, a.serviceCode || "") + '</select></div>'
    + '<div><label>Status</label><select id="af-status">' + opts(CFG.appointmentStatuses, a.status || "Scheduled") + '</select></div></div></div>'
    + '<div id="af-sec-event"' + (kind === "event" ? "" : " hidden") + '><label>Event title <span class="req">*</span></label><input type="text" id="af-title" value="' + esc(kind === "event" ? (a.title || "") : "") + '" placeholder="Meetings, admin time, breaks — non-client time">'
    + '<p class="hint">Events are for non-client purposes only and are not part of any client record.</p></div>'
    + '<div id="af-sec-ooo"' + (kind === "ooo" ? "" : " hidden") + '>'
    + '<label style="font-weight:normal;"><input type="checkbox" id="af-ooo-cancel"' + (a.cancelAppts ? " checked" : "") + '> Cancel appointments during this time</label>'
    + '<label style="font-weight:normal;"><input type="checkbox" id="af-ooo-notify"' + (a.notifyClients ? " checked" : "") + '> Notify clients and contacts</label></div>'
    + '<div id="af-sec-avail"' + (kind === "availability" ? "" : " hidden") + '><label>Availability title</label><input type="text" id="af-atitle" value="' + esc(kind === "availability" ? (a.title || "") : "") + '" placeholder="e.g. Open for appointment requests"></div>'
    + '<div class="grid2"><div><label>Date <span class="req">*</span></label><input type="date" id="af-date" value="' + esc(a.date || todayStr()) + '" required></div>'
    + '<div><label>Start time</label><input type="time" id="af-time" value="' + esc(a.time || "") + '"></div>'
    + '<div><label>End time</label><input type="time" id="af-endtime" value="' + esc(a.endTime || "") + '"></div>'
    + '<div><label>Location</label><select id="af-location">' + opts(CFG.locations, a.location || "Video Office") + '</select></div></div>'
    + '<label>Staff</label><input type="text" id="af-staff" value="' + esc(a.staff || "") + '">'
    + (a.id && a.seriesId ? '<p class="hint">This entry is one occurrence of a recurring series. Editing changes this occurrence only.</p>' : "")
    + (a.id ? "" : '<fieldset><legend>Recurring</legend>'
      + '<label style="font-weight:normal;"><input type="checkbox" id="af-rec-on"> This entry repeats</label>'
      + '<div class="grid2"><div><label>Every</label><input type="text" id="af-rec-interval" inputmode="numeric" value="1"></div>'
      + '<div><label>Repeat</label><select id="af-rec-freq"><option value="week">week</option><option value="month">month</option><option value="year">year</option></select></div></div>'
      + '<div><span class="hint">On these days (weekly):</span><br>' + dayChecks + '</div>'
      + '<div class="grid2"><div><label>Ends</label><select id="af-rec-ends"><option value="count">After a number of times</option><option value="date">On a date</option></select></div>'
      + '<div><label>Number of times</label><input type="text" id="af-rec-count" inputmode="numeric" value="30"></div>'
      + '<div><label>End date</label><input type="date" id="af-rec-until"></div></div></fieldset>')
    + '<label>Memo / notes</label><textarea id="af-notes" rows="2">' + esc(a.notes || "") + '</textarea>'
    + '<p class="error" id="af-error" role="alert"></p>'
    + '<button type="submit" class="btn-navy">' + (a.id ? "Save changes" : "Add entry") + '</button> '
    + '<button type="button" class="btn-small" id="af-cancel">Cancel</button></form>';
}
function calEntryRow(a, t, showDate) {
  const k = entryKind(a);
  return "<tr" + (a.date < t && a.status === "Scheduled" ? ' class="overdue"' : "") + ">"
    + (showDate ? "<td>" + fmtDate(a.date) + dateBadge(a.date) + "</td>" : "")
    + "<td>" + esc(a.time || "—") + (a.endTime ? "–" + esc(a.endTime) : "") + "</td><td><strong>" + esc(entryLabel(a)) + "</strong>"
    + (k === "appointment" && a.clientIds && a.clientIds.length ? "<br><span class=\"hint\">" + a.clientIds.map((id) => esc(clientName(id))).join(", ") + "</span>" : "")
    + "</td><td>" + esc(k === "appointment" ? (a.serviceType || "—") : (k === "event" ? "Event" : k === "ooo" ? "Out of office" : "Availability")) + "</td><td>" + esc(a.location || "—") + "</td><td>" + esc(a.status || "—") + '</td><td><button type="button" class="btn-small" data-edit-appt="' + a.id + '">Edit</button></td></tr>';
}
function renderCalendar() {
  const db = dbGet();
  const root = $("view-calendar");
  if (state.editing.appt) {
    const a = state.editing.appt === "new" ? (state.apptPrefill ? { clientId: state.apptPrefill, date: state.calCursor || todayStr() } : null) : db.appointments.find((x) => x.id === state.editing.appt);
    root.innerHTML = apptForm(a);
    $("af-cancel").addEventListener("click", () => { state.editing.appt = null; state.apptPrefill = ""; renderCalendar(); });
    const kindSel = $("af-kind");
    const syncKind = () => {
      const k = kindSel.value;
      $("af-sec-appt").hidden = k !== "appointment";
      $("af-sec-event").hidden = k !== "event";
      $("af-sec-ooo").hidden = k !== "ooo";
      $("af-sec-avail").hidden = k !== "availability";
    };
    kindSel.addEventListener("change", syncKind);
    const modeSel = $("af-mode");
    if (modeSel) modeSel.addEventListener("change", () => { const g = modeSel.value === "group"; $("af-sec-individual").hidden = g; $("af-sec-group").hidden = !g; });
    $("appt-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const k = kindSel.value;
      const rec = { kind: k, date: $("af-date").value, time: $("af-time").value, endTime: $("af-endtime").value, location: $("af-location").value, staff: $("af-staff").value.trim(), notes: $("af-notes").value, clientId: "", clientIds: [], title: "", serviceType: "", serviceCode: "", status: "" };
      if (!rec.date) return;
      if (k === "appointment") {
        rec.serviceType = $("af-type").value; rec.serviceCode = $("af-service").value; rec.status = $("af-status").value;
        if ($("af-mode").value === "group") {
          rec.clientIds = Array.from(root.querySelectorAll(".af-gclient:checked")).map((x) => x.value);
          rec.title = $("af-gtitle").value.trim();
          if (!rec.clientIds.length) { $("af-error").textContent = "Pick at least one client for the group."; return; }
          if (rec.clientIds.length > 15) { $("af-error").textContent = "A group appointment can hold up to 15 clients."; return; }
        } else {
          rec.clientId = $("af-client").value;
          if (!rec.clientId) { $("af-error").textContent = "Pick a client."; return; }
        }
      } else if (k === "event") {
        rec.title = $("af-title").value.trim();
        if (!rec.title) { $("af-error").textContent = "Give the event a title."; return; }
      } else if (k === "ooo") {
        rec.cancelAppts = $("af-ooo-cancel").checked; rec.notifyClients = $("af-ooo-notify").checked;
      } else if (k === "availability") {
        rec.title = $("af-atitle").value.trim();
      }
      let actMsg;
      if (a && a.id) {
        Object.assign(d.appointments.find((x) => x.id === a.id), rec);
        actMsg = "Edited calendar entry (" + k + ") on " + rec.date;
        dbSet(d); logActivity(actMsg);
      } else {
        const recOn = $("af-rec-on");
        if (recOn && recOn.checked) {
          const recCfg = { freq: $("af-rec-freq").value, interval: $("af-rec-interval").value, days: Array.from(root.querySelectorAll(".af-rday:checked")).map((x) => Number(x.value)), endsType: $("af-rec-ends").value, count: $("af-rec-count").value, until: $("af-rec-until").value };
          const dates = expandRecurring(rec.date, recCfg);
          const seriesId = uid();
          dates.forEach((dstr) => { const r = Object.assign({}, rec, { id: uid(), date: dstr, seriesId: seriesId }); d.appointments.push(r); });
          actMsg = "Added recurring " + k + " series (" + dates.length + " entries from " + rec.date + ")";
        } else {
          rec.id = uid(); d.appointments.push(rec);
          actMsg = "Added calendar entry (" + k + ") on " + rec.date;
        }
        dbSet(d); logActivity(actMsg);
      }
      state.editing.appt = null; state.apptPrefill = ""; renderCalendar();
    });
    return;
  }
  const t = todayStr();
  if (!state.calCursor) state.calCursor = t;
  const cursor = state.calCursor;
  const mode = state.calMode;
  const modeBtn = (m, label) => '<button type="button" class="btn-small' + (mode === m ? " cal-mode-active" : "") + '" data-cal-mode="' + m + '">' + label + "</button>";
  let h = '<section class="panel"><div class="toolbar">'
    + '<span>' + modeBtn("day", "Day") + " " + modeBtn("week", "Week") + " " + modeBtn("month", "Month") + " " + modeBtn("list", "List") + "</span>"
    + '<span><button type="button" class="btn-small" id="cal-prev">← Prev</button> <button type="button" class="btn-small" id="cal-today">Today</button> <button type="button" class="btn-small" id="cal-next">Next →</button></span>'
    + '<label>Go to date<input type="date" id="cal-goto" value="' + esc(cursor) + '"></label>'
    + '<button type="button" class="btn-navy" id="appt-add">Add to the calendar</button></div>';
  const byDate = {};
  db.appointments.forEach((a) => { (byDate[a.date] = byDate[a.date] || []).push(a); });
  Object.values(byDate).forEach((arr) => arr.sort((x, y) => (x.time || "") < (y.time || "") ? -1 : 1));
  if (mode === "day") {
    h += "<h2>" + fmtDate(cursor) + (cursor === t ? " (today)" : "") + "</h2>";
    const list = byDate[cursor] || [];
    if (!list.length) h += '<p class="empty-note">Nothing on the calendar this day.</p>';
    else { h += '<table class="data"><tr><th>Time</th><th>Entry</th><th>Type</th><th>Location</th><th>Status</th><th></th></tr>'; list.forEach((a) => { h += calEntryRow(a, t, false); }); h += "</table>"; }
  } else if (mode === "week") {
    const start = dateAdd(cursor, -new Date(cursor + "T00:00:00").getDay());
    h += "<h2>Week of " + fmtDate(start) + "</h2>" + '<div class="cal-week">';
    for (let i = 0; i < 7; i++) {
      const dstr = dateAdd(start, i);
      const list = byDate[dstr] || [];
      h += '<div class="cal-day' + (dstr === t ? " cal-today" : "") + '"><button type="button" class="btn-small cal-day-head" data-cal-day="' + dstr + '">' + DAY_NAMES[i] + " " + fmtDate(dstr) + "</button>";
      if (!list.length) h += '<p class="hint">—</p>';
      list.forEach((a) => { h += '<div class="cal-chip" data-edit-appt="' + a.id + '">' + esc(a.time || "") + " " + esc(entryLabel(a)) + "</div>"; });
      h += "</div>";
    }
    h += "</div>";
  } else if (mode === "month") {
    const first = cursor.slice(0, 8) + "01";
    const startDow = new Date(first + "T00:00:00").getDay();
    const gridStart = dateAdd(first, -startDow);
    const monthName = ["January","February","March","April","May","June","July","August","September","October","November","December"][Number(cursor.slice(5, 7)) - 1] + " " + cursor.slice(0, 4);
    h += "<h2>" + monthName + '</h2><div class="cal-month">';
    DAY_NAMES.forEach((nm) => { h += '<div class="cal-dow">' + nm + "</div>"; });
    for (let i = 0; i < 42; i++) {
      const dstr = dateAdd(gridStart, i);
      const list = byDate[dstr] || [];
      const inMonth = dstr.slice(0, 7) === cursor.slice(0, 7);
      h += '<div class="cal-cell' + (inMonth ? "" : " cal-out") + (dstr === t ? " cal-today" : "") + '" data-cal-day="' + dstr + '"><div class="cal-cell-num">' + Number(dstr.slice(8, 10)) + "</div>";
      list.slice(0, 4).forEach((a) => { h += '<div class="cal-chip" data-edit-appt="' + a.id + '">' + esc(a.time || "") + " " + esc(entryLabel(a)) + "</div>"; });
      if (list.length > 4) h += '<div class="hint">+ ' + (list.length - 4) + " more</div>";
      h += "</div>";
    }
    h += "</div>";
  } else {
    let list = db.appointments.slice();
    if (state.calView === "today") list = list.filter((a) => a.date === t);
    else if (state.calView === "week") list = list.filter((a) => { const dd = daysUntil(a.date); return dd !== null && dd >= 0 && dd <= 7; });
    else if (state.calView === "all") list = list.slice().sort((a, b) => (a.date + (a.time || "")) > (b.date + (b.time || "")) ? -1 : 1);
    else list = list.filter((a) => daysUntil(a.date) !== null && daysUntil(a.date) >= 0);
    if (state.calView !== "all") list.sort((a, b) => (a.date + (a.time || "")) < (b.date + (b.time || "")) ? -1 : 1);
    h += '<div class="toolbar"><label>List view<select id="cal-view">'
      + '<option value="upcoming"' + (state.calView === "upcoming" ? " selected" : "") + '>Upcoming</option>'
      + '<option value="today"' + (state.calView === "today" ? " selected" : "") + '>Today</option>'
      + '<option value="week"' + (state.calView === "week" ? " selected" : "") + '>Next 7 days</option>'
      + '<option value="all"' + (state.calView === "all" ? " selected" : "") + '>All entries</option></select></label></div>';
    if (!list.length) h += '<p class="empty-note">No entries in this view.</p>';
    else {
      h += '<table class="data"><tr><th>Date</th><th>Time</th><th>Entry</th><th>Type</th><th>Location</th><th>Status</th><th></th></tr>';
      list.forEach((a) => { h += calEntryRow(a, t, true); });
      h += "</table>";
    }
  }
  h += "</section>";
  /* Waitlist */
  const waitlist = db.clients.filter((c) => c.onWaitlist || c.status === "Waitlist");
  h += '<section class="panel"><h2>Waitlist (' + waitlist.length + ")</h2>";
  if (!waitlist.length) h += '<p class="empty-note">No clients on the waitlist. Mark a client as on the waitlist on their record in the Clients tab.</p>';
  else {
    h += '<table class="data"><tr><th>Client</th><th>Program</th><th>Phone</th><th></th></tr>';
    waitlist.forEach((c) => { h += "<tr><td><strong>" + esc(c.name) + "</strong></td><td>" + esc(c.program || "—") + "</td><td>" + esc(c.phone || "—") + '</td><td><button type="button" class="btn-small" data-schedule-client="' + c.id + '">Schedule</button></td></tr>'; });
    h += "</table>";
  }
  h += "</section>";
  /* Calendar settings */
  const st = settingsGet(db);
  h += '<section class="panel"><h2>Calendar settings</h2>'
    + '<label>Cancellation policy — how far ahead a client must cancel</label>'
    + '<select id="cal-cancel-policy">' + opts(CFG.cancellationPolicies, st.cancellationPolicy) + '</select>'
    + '<p><button type="button" class="btn-navy" id="cal-settings-save">Save calendar settings</button> <span class="save-status" id="cal-settings-msg"></span></p>'
    + '<p class="hint">Appointment reminder rules (email 48 hours before, text 24 hours, voice 24 hours, video 10 minutes) are set in the Reminders tab.</p></section>';
  root.innerHTML = h;
  root.querySelectorAll("[data-cal-mode]").forEach((b) => b.addEventListener("click", () => { state.calMode = b.getAttribute("data-cal-mode"); renderCalendar(); }));
  $("cal-goto").addEventListener("change", (e) => { if (e.target.value) { state.calCursor = e.target.value; renderCalendar(); } });
  $("cal-today").addEventListener("click", () => { state.calCursor = todayStr(); renderCalendar(); });
  const shiftCursor = (dir) => {
    if (state.calMode === "month") { const d = new Date(state.calCursor + "T00:00:00"); d.setDate(1); d.setMonth(d.getMonth() + dir); state.calCursor = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-01"; }
    else state.calCursor = dateAdd(state.calCursor, dir * (state.calMode === "week" ? 7 : 1));
  };
  $("cal-prev").addEventListener("click", () => { shiftCursor(-1); renderCalendar(); });
  $("cal-next").addEventListener("click", () => { shiftCursor(1); renderCalendar(); });
  const cv = $("cal-view"); if (cv) cv.addEventListener("change", (e) => { state.calView = e.target.value; renderCalendar(); });
  $("appt-add").addEventListener("click", () => { state.editing.appt = "new"; renderCalendar(); });
  root.querySelectorAll("[data-edit-appt]").forEach((b) => b.addEventListener("click", (ev) => { ev.stopPropagation(); state.editing.appt = b.getAttribute("data-edit-appt"); renderCalendar(); }));
  root.querySelectorAll("[data-cal-day]").forEach((el) => el.addEventListener("click", () => { state.calCursor = el.getAttribute("data-cal-day"); state.calMode = "day"; renderCalendar(); }));
  root.querySelectorAll("[data-schedule-client]").forEach((b) => b.addEventListener("click", () => { state.apptPrefill = b.getAttribute("data-schedule-client"); state.editing.appt = "new"; renderCalendar(); }));
  $("cal-settings-save").addEventListener("click", () => {
    const d = dbGet();
    d.settings = settingsGet(d);
    d.settings.cancellationPolicy = $("cal-cancel-policy").value;
    dbSet(d); logActivity("Updated calendar settings (cancellation policy)");
    $("cal-settings-msg").textContent = "Saved ✓ " + new Date().toLocaleTimeString();
  });
}

/* ---------------- Session Notes (DAP / SOAP / Chart Note) ---------------- */
function noteTypeOf(n) { return n && n.noteType ? n.noteType : "DAP"; }
function noteBodyHtml(n) {
  const t = noteTypeOf(n);
  if (t === "SOAP") {
    return "<h3>Subjective</h3><blockquote class=\"note-text\">" + esc(n.subjective || "—") + "</blockquote>"
      + "<h3>Objective</h3><blockquote class=\"note-text\">" + esc(n.objective || "—") + "</blockquote>"
      + "<h3>Assessment</h3><blockquote class=\"note-text\">" + esc(n.assessment || "—") + "</blockquote>"
      + "<h3>Plan</h3><blockquote class=\"note-text\">" + esc(n.plan || "—") + "</blockquote>";
  }
  if (t === "Chart") {
    return '<blockquote class="note-text">' + esc(n.data || "—") + "</blockquote>";
  }
  return "<h3>Data</h3><blockquote class=\"note-text\">" + esc(n.data || "—") + "</blockquote>"
    + "<h3>Assessment</h3><blockquote class=\"note-text\">" + esc(n.assessment || "—") + "</blockquote>"
    + "<h3>Plan</h3><blockquote class=\"note-text\">" + esc(n.plan || "—") + "</blockquote>";
}
function noteForm(n) {
  n = n || {};
  const t = noteTypeOf(n);
  const appts = dbGet().appointments.filter((a) => (!n.clientId || a.clientId === n.clientId) && (!a.kind || a.kind === "appointment"));
  let apptOpts = '<option value="">(not tied to an appointment)</option>';
  appts.forEach((a) => { apptOpts += '<option value="' + a.id + '"' + (a.id === n.appointmentId ? " selected" : "") + ">" + fmtDate(a.date) + " — " + esc(a.serviceType || "Appointment") + "</option>"; });
  return '<form id="note-form" class="panel"><h2>' + (n.id ? "Edit note" : "Add a note") + '</h2>'
    + '<p class="hint">DAP — Data: what happened in the session. Assessment: the peer worker\'s plain summary of where the person stands. Plan: the agreed next steps. SOAP — Subjective / Objective / Assessment / Plan. Chart Note — an administrative note that is not tied to a session. Peer-support notes only.</p>'
    + '<label>Client <span class="req">*</span></label><select id="nf-client">' + clientOpts(n.clientId) + '</select>'
    + '<div class="grid2"><div><label>Note type</label><select id="nf-type">'
    + '<option value="DAP"' + (t === "DAP" ? " selected" : "") + '>DAP session note</option>'
    + '<option value="SOAP"' + (t === "SOAP" ? " selected" : "") + '>SOAP note</option>'
    + '<option value="Chart"' + (t === "Chart" ? " selected" : "") + '>Chart Note (administrative)</option></select></div>'
    + '<div><label>Date <span class="req">*</span></label><input type="date" id="nf-date" value="' + esc(n.date || todayStr()) + '" required></div></div>'
    + '<label>Appointment</label><select id="nf-appt">' + apptOpts + '</select>'
    + '<label>Status</label><select id="nf-status"><option value="Draft"' + (n.status === "Draft" || !n.status ? " selected" : "") + '>Draft (unsigned)</option><option value="Signed"' + (n.status === "Signed" ? " selected" : "") + '>Signed (final)</option></select>'
    + '<div id="nf-fields-dap"' + (t === "DAP" ? "" : " hidden") + '>'
    + '<label>Data</label><textarea id="nf-data" rows="4">' + esc(t === "DAP" ? (n.data || "") : "") + '</textarea>'
    + '<label>Assessment</label><textarea id="nf-assessment" rows="4">' + esc(t === "DAP" ? (n.assessment || "") : "") + '</textarea>'
    + '<label>Plan</label><textarea id="nf-plan" rows="3">' + esc(t === "DAP" ? (n.plan || "") : "") + '</textarea></div>'
    + '<div id="nf-fields-soap"' + (t === "SOAP" ? "" : " hidden") + '>'
    + '<label>Subjective</label><textarea id="nf-subjective" rows="3">' + esc(n.subjective || "") + '</textarea>'
    + '<label>Objective</label><textarea id="nf-objective" rows="3">' + esc(n.objective || "") + '</textarea>'
    + '<label>Assessment</label><textarea id="nf-s-assessment" rows="3">' + esc(t === "SOAP" ? (n.assessment || "") : "") + '</textarea>'
    + '<label>Plan</label><textarea id="nf-s-plan" rows="3">' + esc(t === "SOAP" ? (n.plan || "") : "") + '</textarea></div>'
    + '<div id="nf-fields-chart"' + (t === "Chart" ? "" : " hidden") + '>'
    + '<label>Chart note</label><textarea id="nf-chart" rows="4" placeholder="Administrative note — a phone call, a document received, a coordination update…">' + esc(t === "Chart" ? (n.data || "") : "") + '</textarea></div>'
    + '<button type="submit" class="btn-navy">' + (n.id ? "Save changes" : "Add note") + '</button> '
    + '<button type="button" class="btn-small" id="nf-cancel">Cancel</button></form>';
}
function renderNotes() {
  const db = dbGet();
  const root = $("view-notes");
  if (state.editing.note) {
    const n = state.editing.note === "new" ? null : db.notes.find((x) => x.id === state.editing.note);
    root.innerHTML = noteForm(n);
    $("nf-cancel").addEventListener("click", () => { state.editing.note = null; renderNotes(); });
    $("nf-type").addEventListener("change", (e) => {
      const t = e.target.value;
      $("nf-fields-dap").hidden = t !== "DAP";
      $("nf-fields-soap").hidden = t !== "SOAP";
      $("nf-fields-chart").hidden = t !== "Chart";
    });
    $("note-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const t = $("nf-type").value;
      const rec = { clientId: $("nf-client").value, appointmentId: $("nf-appt").value || "", date: $("nf-date").value, status: $("nf-status").value, noteType: t, data: "", assessment: "", plan: "", subjective: "", objective: "" };
      if (t === "DAP") { rec.data = $("nf-data").value; rec.assessment = $("nf-assessment").value; rec.plan = $("nf-plan").value; }
      else if (t === "SOAP") { rec.subjective = $("nf-subjective").value; rec.objective = $("nf-objective").value; rec.assessment = $("nf-s-assessment").value; rec.plan = $("nf-s-plan").value; }
      else { rec.data = $("nf-chart").value; }
      if (!rec.clientId || !rec.date) return;
      let actMsg;
      if (n) { Object.assign(d.notes.find((x) => x.id === n.id), rec); actMsg = "Edited " + t + " note for " + clientName(rec.clientId); }
      else { rec.id = uid(); rec.author = state.user ? state.user.name : ""; d.notes.push(rec); actMsg = "Added " + t + " note for " + clientName(rec.clientId); }
      dbSet(d); logActivity(actMsg); state.editing.note = null; renderNotes();
    });
    return;
  }
  const list = db.notes.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">DAP and SOAP session notes, plus Chart Notes for administrative entries — drafts stay unsigned until the worker signs them final.</span><button type="button" class="btn-navy" id="note-add">Add a note</button></div>';
  if (!list.length) h += '<p class="empty-note">No notes yet.</p>';
  else {
    list.forEach((n) => {
      h += '<div class="panel"><p><strong>' + esc(clientName(n.clientId)) + "</strong> · " + fmtDate(n.date) + ' <span class="badge badge-stage">' + esc(noteTypeOf(n) === "Chart" ? "Chart Note" : noteTypeOf(n)) + '</span> <span class="badge' + (n.status === "Draft" ? " badge-soon" : " badge-stage") + '">' + esc(n.status) + "</span> · " + esc(n.author || "")
        + ' <button type="button" class="btn-small" data-edit-note="' + n.id + '">Edit</button>'
        + (n.status === "Draft" ? ' <button type="button" class="btn-small" data-sign-note="' + n.id + '">Sign (mark final)</button>' : "") + "</p>"
        + noteBodyHtml(n) + "</div>";
    });
  }
  h += "</section>";
  root.innerHTML = h;
  $("note-add").addEventListener("click", () => { state.editing.note = "new"; renderNotes(); });
  root.querySelectorAll("[data-edit-note]").forEach((b) => b.addEventListener("click", () => { state.editing.note = b.getAttribute("data-edit-note"); renderNotes(); }));
  root.querySelectorAll("[data-sign-note]").forEach((b) => b.addEventListener("click", () => { const d = dbGet(); const n = d.notes.find((x) => x.id === b.getAttribute("data-sign-note")); if (n) { n.status = "Signed"; dbSet(d); logActivity("Signed " + noteTypeOf(n) + " note for " + clientName(n.clientId)); renderNotes(); } }));
}

/* ---------------- Support Plans ---------------- */
function planTemplateOf(p) { return p && p.template ? p.template : "basic"; }
function planBodyHtml(p) {
  const t = planTemplateOf(p);
  let h = "";
  if (t === "simple") {
    h += '<blockquote class="note-text">' + esc(p.planText || "—") + "</blockquote>";
    return h;
  }
  if (t === "advanced") {
    if (p.concern) h += "<h3>Presenting concern</h3><blockquote class=\"note-text\">" + esc(p.concern) + "</blockquote>";
    if (p.goals) h += "<h3>Goals</h3><blockquote class=\"note-text\">" + esc(p.goals) + "</blockquote>";
    const steps = Array.isArray(p.steps) ? p.steps : [];
    if (steps.length) {
      h += '<h3>Steps</h3><table class="data"><tr><th>Step</th><th>Who</th><th>By when</th></tr>';
      steps.forEach((s) => { h += "<tr><td>" + esc(s.step || "—") + "</td><td>" + esc(s.who || "—") + "</td><td>" + esc(s.byWhen || "—") + "</td></tr>"; });
      h += "</table>";
    }
    if (p.frequency) h += '<p><strong>Support frequency:</strong> ' + esc(p.frequency) + "</p>";
    if (p.strengths) h += "<h3>Strengths &amp; supports</h3><blockquote class=\"note-text\">" + esc(p.strengths) + "</blockquote>";
    return h || '<p class="empty-note">No plan content yet.</p>';
  }
  /* basic */
  if (p.concern) h += "<h3>Presenting concern</h3><blockquote class=\"note-text\">" + esc(p.concern) + "</blockquote>";
  h += "<h3>Goal</h3><blockquote class=\"note-text\">" + esc(p.goals || "—") + "</blockquote>"
    + "<h3>Objective</h3><blockquote class=\"note-text\">" + esc(p.objectives || "—") + "</blockquote>";
  if (p.frequency) h += '<p><strong>Support frequency:</strong> ' + esc(p.frequency) + "</p>";
  if (p.strengths) h += "<h3>Strengths &amp; supports</h3><blockquote class=\"note-text\">" + esc(p.strengths) + "</blockquote>";
  return h;
}
function planStepRow(s) {
  s = s || {};
  return '<div class="step-row grid2">'
    + '<div><label>Step</label><input type="text" class="ps-step" value="' + esc(s.step || "") + '"></div>'
    + '<div><label>Who</label><input type="text" class="ps-who" value="' + esc(s.who || "") + '"></div>'
    + '<div><label>By when</label><input type="text" class="ps-when" value="' + esc(s.byWhen || "") + '"></div>'
    + '<div><button type="button" class="btn-small ps-remove">Remove step</button></div></div>';
}
function planForm(p) {
  p = p || {};
  const t = planTemplateOf(p);
  const steps = Array.isArray(p.steps) ? p.steps : [];
  let stepRows = "";
  steps.forEach((s) => { stepRows += planStepRow(s); });
  let reviewOpts = '<option value="">Set a review date below</option>';
  CFG.planReviewOptions.forEach((dnum) => { reviewOpts += '<option value="' + dnum + '"' + (String(p.reviewAfterDays || "") === String(dnum) ? " selected" : "") + ">After " + dnum + " days</option>"; });
  return '<form id="plan-form" class="panel"><h2>' + (p.id ? "Edit support plan" : "Add a support plan") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="pf-client">' + clientOpts(p.clientId) + '</select>'
    + '<label>Plan template</label><select id="pf-template">'
    + '<option value="simple"' + (t === "simple" ? " selected" : "") + '>Simple — the whole plan in a single text box</option>'
    + '<option value="basic"' + (t === "basic" ? " selected" : "") + '>Basic — presenting concern, goal, and objective</option>'
    + '<option value="advanced"' + (t === "advanced" ? " selected" : "") + '>Advanced — step-by-step plan with multiple fields</option></select>'
    + '<div id="pf-fields-simple"' + (t === "simple" ? "" : " hidden") + '>'
    + '<label>Support plan</label><textarea id="pf-plantext" rows="6" placeholder="The person\'s plan, in one place">' + esc(p.planText || "") + '</textarea></div>'
    + '<div id="pf-fields-basic"' + (t === "basic" ? "" : " hidden") + '>'
    + '<label>Presenting concern</label><textarea id="pf-concern" rows="3" placeholder="What brings the person to support, in their own terms">' + esc(p.concern || "") + '</textarea>'
    + '<label>Goal</label><textarea id="pf-goals" rows="3" placeholder="What the person wants to work toward">' + esc(p.goals || "") + '</textarea>'
    + '<label>Objective</label><textarea id="pf-objectives" rows="3" placeholder="How progress toward the goal will show">' + esc(p.objectives || "") + '</textarea>'
    + '<label>Support frequency</label><input type="text" id="pf-frequency" value="' + esc(p.frequency || "") + '" placeholder="e.g. Weekly check-ins, twice-monthly visits">'
    + '<label>Strengths &amp; supports</label><textarea id="pf-strengths" rows="2">' + esc(p.strengths || "") + '</textarea></div>'
    + '<div id="pf-fields-advanced"' + (t === "advanced" ? "" : " hidden") + '>'
    + '<label>Presenting concern</label><textarea id="pf-a-concern" rows="2">' + esc(p.concern || "") + '</textarea>'
    + '<label>Goal</label><textarea id="pf-a-goals" rows="2">' + esc(p.goals || "") + '</textarea>'
    + '<fieldset><legend>Steps</legend><div id="pf-steps">' + stepRows + '</div><p><button type="button" class="btn-small" id="pf-add-step">Add a step</button></p></fieldset>'
    + '<label>Support frequency</label><input type="text" id="pf-a-frequency" value="' + esc(p.frequency || "") + '">'
    + '<label>Strengths &amp; supports</label><textarea id="pf-a-strengths" rows="2">' + esc(p.strengths || "") + '</textarea></div>'
    + '<div class="grid2"><div><label>Review reminder</label><select id="pf-review-after">' + reviewOpts + '</select></div>'
    + '<div><label>Review date</label><input type="date" id="pf-review" value="' + esc(p.reviewDate || "") + '"></div>'
    + '<div><label>Status</label><select id="pf-status"><option value="Active"' + (p.status === "Active" || !p.status ? " selected" : "") + '>Active</option><option value="Completed"' + (p.status === "Completed" ? " selected" : "") + '>Completed</option></select></div></div>'
    + '<button type="submit" class="btn-navy">' + (p.id ? "Save changes" : "Add plan") + '</button> '
    + '<button type="button" class="btn-small" id="pf-cancel">Cancel</button></form>';
}
function renderPlans() {
  const db = dbGet();
  const root = $("view-plans");
  if (state.editing.plan) {
    const p = state.editing.plan === "new" ? null : db.plans.find((x) => x.id === state.editing.plan);
    root.innerHTML = planForm(p);
    $("pf-cancel").addEventListener("click", () => { state.editing.plan = null; renderPlans(); });
    $("pf-template").addEventListener("change", (e) => {
      const t = e.target.value;
      $("pf-fields-simple").hidden = t !== "simple";
      $("pf-fields-basic").hidden = t !== "basic";
      $("pf-fields-advanced").hidden = t !== "advanced";
    });
    const wireStepRow = (row) => { const b = row.querySelector(".ps-remove"); if (b) b.addEventListener("click", () => row.remove()); };
    root.querySelectorAll(".step-row").forEach(wireStepRow);
    $("pf-add-step").addEventListener("click", () => { const div = document.createElement("div"); div.innerHTML = planStepRow({}); const row = div.firstChild; $("pf-steps").appendChild(row); wireStepRow(row); });
    $("plan-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const t = $("pf-template").value;
      const rec = { clientId: $("pf-client").value, template: t, status: $("pf-status").value, reviewDate: $("pf-review").value, reviewAfterDays: $("pf-review-after").value ? Number($("pf-review-after").value) : "", concern: "", goals: "", objectives: "", strengths: "", frequency: "", planText: "", steps: [] };
      if (t === "simple") { rec.planText = $("pf-plantext").value; }
      else if (t === "basic") { rec.concern = $("pf-concern").value; rec.goals = $("pf-goals").value; rec.objectives = $("pf-objectives").value; rec.frequency = $("pf-frequency").value.trim(); rec.strengths = $("pf-strengths").value; }
      else { rec.concern = $("pf-a-concern").value; rec.goals = $("pf-a-goals").value; rec.frequency = $("pf-a-frequency").value.trim(); rec.strengths = $("pf-a-strengths").value; rec.steps = Array.from(root.querySelectorAll(".step-row")).map((row) => ({ step: row.querySelector(".ps-step").value.trim(), who: row.querySelector(".ps-who").value.trim(), byWhen: row.querySelector(".ps-when").value.trim() })).filter((s) => s.step || s.who || s.byWhen); }
      if (rec.reviewAfterDays && !rec.reviewDate) { const dt = new Date(); dt.setDate(dt.getDate() + rec.reviewAfterDays); rec.reviewDate = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0"); }
      if (!rec.clientId) return;
      let actMsg;
      if (p) { Object.assign(d.plans.find((x) => x.id === p.id), rec); actMsg = "Edited support plan for " + clientName(rec.clientId); }
      else { rec.id = uid(); rec.createdAt = todayStr(); d.plans.push(rec); actMsg = "Added support plan for " + clientName(rec.clientId); }
      dbSet(d); logActivity(actMsg); state.editing.plan = null; renderPlans();
    });
    return;
  }
  const list = db.plans.slice().sort((a, b) => (a.reviewDate || "9999") < (b.reviewDate || "9999") ? -1 : 1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">Support plans hold each person\'s goals, the steps toward them, and the review date. Three templates: Simple, Basic, and Advanced.</span><button type="button" class="btn-navy" id="plan-add">Add a support plan</button></div>';
  if (!list.length) h += '<p class="empty-note">No support plans yet.</p>';
  else {
    list.forEach((p) => {
      h += '<div class="panel"><p><strong>' + esc(clientName(p.clientId)) + '</strong> <span class="badge badge-stage">' + esc(p.status) + '</span> <span class="badge">' + esc(planTemplateOf(p)) + " template</span> · Review by " + fmtDate(p.reviewDate) + dateBadge(p.reviewDate)
        + ' <button type="button" class="btn-small" data-edit-plan="' + p.id + '">Edit</button></p>'
        + planBodyHtml(p) + "</div>";
    });
  }
  h += "</section>";
  root.innerHTML = h;
  $("plan-add").addEventListener("click", () => { state.editing.plan = "new"; renderPlans(); });
  root.querySelectorAll("[data-edit-plan]").forEach((b) => b.addEventListener("click", () => { state.editing.plan = b.getAttribute("data-edit-plan"); renderPlans(); }));
}

/* ---------------- Documents ---------------- */
function docForm(d0) {
  d0 = d0 || {};
  return '<form id="doc-form" class="panel"><h2>' + (d0.id ? "Edit document record" : "Add a document record") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="df-client">' + clientOpts(d0.clientId) + '</select>'
    + '<div class="grid2"><div><label>Document type</label><select id="df-type">' + opts(CFG.documentTypes, d0.type || "Intake Packet") + '</select></div>'
    + '<div><label>Date</label><input type="date" id="df-date" value="' + esc(d0.date || todayStr()) + '"></div>'
    + '<div><label>Status</label><select id="df-status">' + opts(CFG.documentStatuses, d0.status || "On File") + '</select></div></div>'
    + '<label>Note</label><input type="text" id="df-note" value="' + esc(d0.note || "") + '" placeholder="Where the signed copy is filed, etc.">'
    + '<button type="submit" class="btn-navy">' + (d0.id ? "Save changes" : "Add document") + '</button> '
    + '<button type="button" class="btn-small" id="df-cancel">Cancel</button></form>';
}
function renderDocuments() {
  const db = dbGet();
  const root = $("view-documents");
  if (state.editing.doc) {
    const d0 = state.editing.doc === "new" ? (state.docPrefill ? { type: state.docPrefill.type, clientId: state.docPrefill.clientId } : null) : db.documents.find((x) => x.id === state.editing.doc);
    root.innerHTML = docForm(d0);
    $("df-cancel").addEventListener("click", () => { state.editing.doc = null; state.docPrefill = null; renderDocuments(); });
    $("doc-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("df-client").value, type: $("df-type").value, date: $("df-date").value, status: $("df-status").value, note: $("df-note").value.trim() };
      if (!rec.clientId) return;
      let actMsg;
      if (d0 && d0.id) { Object.assign(d.documents.find((x) => x.id === d0.id), rec); actMsg = "Edited document (" + rec.type + ") for " + clientName(rec.clientId); }
      else { rec.id = uid(); d.documents.push(rec); actMsg = "Added document (" + rec.type + ") for " + clientName(rec.clientId); }
      dbSet(d); logActivity(actMsg); state.editing.doc = null; state.docPrefill = null; renderDocuments();
    });
    return;
  }
  const list = db.documents.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  let h = '<section class="panel"><h2>Standard documents checklist</h2>'
    + '<p class="hint">The standard consent and shareable documents a complete client file carries. Pick a client to see what is on file and what is still missing.</p>'
    + '<div class="toolbar"><label>Client<select id="checklist-client">' + clientOpts(state.checklistClient, "(pick a client)") + "</select></label></div>";
  if (state.checklistClient) {
    const mine = db.documents.filter((d) => d.clientId === state.checklistClient);
    h += '<table class="data"><tr><th>Standard document</th><th>Status</th><th></th></tr>';
    CFG.consentChecklist.forEach((item) => {
      const found = mine.find((d) => d.type === item);
      h += "<tr><td>" + esc(item) + "</td><td>" + (found ? esc(found.status) + " · " + fmtDate(found.date) : '<span class="badge badge-soon">Missing</span>') + '</td><td>' + (found ? "" : '<button type="button" class="btn-small" data-checklist-add="' + esc(item) + '">Add</button>') + "</td></tr>";
    });
    h += "</table>";
  }
  h += '</section><section class="panel"><div class="toolbar"><span class="hint">Document tracking — what is on file for each client and its status. Signed copies are filed in the client\'s record.</span><button type="button" class="btn-navy" id="doc-add">Add a document</button></div>';
  if (!list.length) h += '<p class="empty-note">No documents tracked yet.</p>';
  else {
    h += '<table class="data"><tr><th>Client</th><th>Type</th><th>Date</th><th>Status</th><th>Note</th><th></th></tr>';
    list.forEach((d) => { h += "<tr><td>" + esc(clientName(d.clientId)) + "</td><td>" + esc(d.type) + "</td><td>" + fmtDate(d.date) + "</td><td>" + esc(d.status) + "</td><td>" + esc(d.note || "—") + '</td><td><button type="button" class="btn-small" data-edit-doc="' + d.id + '">Edit</button></td></tr>'; });
    h += "</table>";
  }
  h += "</section>";
  root.innerHTML = h;
  $("doc-add").addEventListener("click", () => { state.editing.doc = "new"; renderDocuments(); });
  const cc = $("checklist-client"); if (cc) cc.addEventListener("change", (e) => { state.checklistClient = e.target.value; renderDocuments(); });
  root.querySelectorAll("[data-checklist-add]").forEach((b) => b.addEventListener("click", () => { state.docPrefill = { type: b.getAttribute("data-checklist-add"), clientId: state.checklistClient }; state.editing.doc = "new"; renderDocuments(); }));
  root.querySelectorAll("[data-edit-doc]").forEach((b) => b.addEventListener("click", () => { state.editing.doc = b.getAttribute("data-edit-doc"); renderDocuments(); }));
}

/* ---------------- Billing & Insurance ---------------- */
function svcForm(s) {
  s = s || {};
  return '<form id="svc-form" class="panel"><h2>' + (s.id ? "Edit service log entry" : "Log a service") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="bf-client">' + clientOpts(s.clientId) + '</select>'
    + '<div class="grid2"><div><label>Date <span class="req">*</span></label><input type="date" id="bf-date" value="' + esc(s.date || todayStr()) + '" required></div>'
    + '<div><label>Service code</label><select id="bf-code">' + opts(CFG.serviceCatalog.map((x) => ({ code: x.code, label: x.code + " — " + x.description })), s.code || "H0038") + '</select></div>'
    + '<div><label>Units (15-min)</label><input type="text" id="bf-units" inputmode="numeric" value="' + esc(s.units || "1") + '"></div>'
    + '<div><label>Claim status</label><select id="bf-claim">' + opts(CFG.claimStatuses, s.claimStatus || "Not Submitted") + '</select></div></div>'
    + '<label>Staff</label><input type="text" id="bf-staff" value="' + esc(s.staff || "") + '">'
    + '<label>Note</label><input type="text" id="bf-note" value="' + esc(s.note || "") + '">'
    + '<button type="submit" class="btn-navy">' + (s.id ? "Save changes" : "Log service") + '</button> '
    + '<button type="button" class="btn-small" id="bf-cancel">Cancel</button></form>';
}
function billDocForm(bd) {
  bd = bd || {};
  return '<form id="billdoc-form" class="panel"><h2>' + (bd.id ? "Edit billing document" : "Add a billing document") + '</h2>'
    + '<p class="hint">Tracking only — invoices, statements, and superbills are recorded here with their status. This system does not send bills or submit claims.</p>'
    + '<label>Client <span class="req">*</span></label><select id="bd-client">' + clientOpts(bd.clientId) + '</select>'
    + '<div class="grid2"><div><label>Document</label><select id="bd-kind">' + opts(CFG.billDocKinds, bd.kind || "Invoice") + '</select></div>'
    + '<div><label>Number</label><input type="text" id="bd-number" value="' + esc(bd.number || "") + '" placeholder="e.g. INV #1"></div>'
    + '<div><label>Date <span class="req">*</span></label><input type="date" id="bd-date" value="' + esc(bd.date || todayStr()) + '" required></div>'
    + '<div><label>Amount</label><input type="text" id="bd-amount" value="' + esc(bd.amount || "") + '" placeholder="e.g. 100.00"></div>'
    + '<div><label>Status</label><select id="bd-status">' + opts(CFG.billDocStatuses, bd.status || "Draft") + '</select></div></div>'
    + '<button type="submit" class="btn-navy">' + (bd.id ? "Save changes" : "Add document") + '</button> '
    + '<button type="button" class="btn-small" id="bd-cancel">Cancel</button></form>';
}
function renderBilling() {
  const db = dbGet();
  const root = $("view-billing");
  if (state.editing.svc) {
    const s = state.editing.svc === "new" ? null : db.services.find((x) => x.id === state.editing.svc);
    root.innerHTML = svcForm(s);
    $("bf-cancel").addEventListener("click", () => { state.editing.svc = null; renderBilling(); });
    $("svc-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("bf-client").value, date: $("bf-date").value, code: $("bf-code").value, units: $("bf-units").value.trim() || "1", claimStatus: $("bf-claim").value, staff: $("bf-staff").value.trim(), note: $("bf-note").value.trim() };
      if (!rec.clientId || !rec.date) return;
      let actMsg;
      if (s) { Object.assign(d.services.find((x) => x.id === s.id), rec); actMsg = "Edited service log entry (" + rec.code + ") for " + clientName(rec.clientId); }
      else { rec.id = uid(); d.services.push(rec); actMsg = "Logged service (" + rec.code + ") for " + clientName(rec.clientId); }
      dbSet(d); logActivity(actMsg); state.editing.svc = null; renderBilling();
    });
    return;
  }
  if (state.editing.billdoc) {
    const bd = state.editing.billdoc === "new" ? null : db.billDocs.find((x) => x.id === state.editing.billdoc);
    root.innerHTML = billDocForm(bd);
    $("bd-cancel").addEventListener("click", () => { state.editing.billdoc = null; renderBilling(); });
    $("billdoc-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("bd-client").value, kind: $("bd-kind").value, number: $("bd-number").value.trim(), date: $("bd-date").value, amount: $("bd-amount").value.trim(), status: $("bd-status").value };
      if (!rec.clientId || !rec.date) return;
      let actMsg;
      if (bd) { Object.assign(d.billDocs.find((x) => x.id === bd.id), rec); actMsg = "Edited billing document (" + rec.kind + ") for " + clientName(rec.clientId); }
      else { rec.id = uid(); d.billDocs.push(rec); actMsg = "Added billing document (" + rec.kind + ") for " + clientName(rec.clientId); }
      dbSet(d); logActivity(actMsg); state.editing.billdoc = null; renderBilling();
    });
    return;
  }
  const byClaim = {}; CFG.claimStatuses.forEach((x) => { byClaim[x] = 0; });
  db.services.forEach((s) => { if (byClaim[s.claimStatus] !== undefined) byClaim[s.claimStatus]++; });
  let h = '<section class="panel"><h2>Billing snapshot</h2><div class="stats">';
  CFG.claimStatuses.forEach((x) => { h += '<div class="stat"><div class="num">' + byClaim[x] + '</div><div class="lbl">' + esc(x) + "</div></div>"; });
  h += '</div><p class="hint">Tracking only — this system keeps the service log and claim status. It does not submit claims.</p></section>';
  h += '<section class="panel"><h2>Insurance on file</h2>';
  const withIns = db.clients.filter((c) => c.insurance && (c.insurance.payer || c.insurance.memberId));
  if (!withIns.length) h += '<p class="empty-note">No insurance information recorded yet. Add it on the client\'s record in the Clients tab.</p>';
  else {
    h += '<table class="data"><tr><th>Client</th><th>Payer</th><th>Member ID</th><th>Group</th><th>Notes</th></tr>';
    withIns.forEach((c) => { h += '<tr class="clickable" data-open-client="' + c.id + '"><td>' + esc(c.name) + "</td><td>" + esc(c.insurance.payer || "—") + "</td><td>" + esc(c.insurance.memberId || "—") + "</td><td>" + esc(c.insurance.groupId || "—") + "</td><td>" + esc(c.insurance.notes || "—") + "</td></tr>"; });
    h += "</table>";
  }
  h += '</section><section class="panel"><div class="toolbar"><h2 style="margin:0">Service log</h2><button type="button" class="btn-navy" id="svc-add">Log a service</button></div>';
  const list = db.services.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  if (!list.length) h += '<p class="empty-note">No services logged yet.</p>';
  else {
    h += '<table class="data"><tr><th>Date</th><th>Client</th><th>Code</th><th>Units</th><th>Claim status</th><th></th></tr>';
    list.forEach((s) => { h += "<tr><td>" + fmtDate(s.date) + "</td><td>" + esc(clientName(s.clientId)) + "</td><td>" + esc(s.code) + "</td><td>" + esc(s.units) + "</td><td>" + esc(s.claimStatus) + '</td><td><button type="button" class="btn-small" data-edit-svc="' + s.id + '">Edit</button></td></tr>'; });
    h += "</table>";
  }
  h += "</section>";
  h += '<section class="panel"><div class="toolbar"><h2 style="margin:0">Billing documents</h2><button type="button" class="btn-navy" id="billdoc-add">Add a billing document</button></div>'
    + '<p class="hint">Invoices, statements, and superbills — tracked here by status only.</p>';
  const bdocs = db.billDocs.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  if (!bdocs.length) h += '<p class="empty-note">No billing documents tracked yet.</p>';
  else {
    h += '<table class="data"><tr><th>Date</th><th>Client</th><th>Document</th><th>Number</th><th>Amount</th><th>Status</th><th></th></tr>';
    bdocs.forEach((bd) => { h += "<tr><td>" + fmtDate(bd.date) + "</td><td>" + esc(clientName(bd.clientId)) + "</td><td>" + esc(bd.kind) + "</td><td>" + esc(bd.number || "—") + "</td><td>" + esc(bd.amount || "—") + "</td><td>" + esc(bd.status) + '</td><td><button type="button" class="btn-small" data-edit-billdoc="' + bd.id + '">Edit</button></td></tr>'; });
    h += "</table>";
  }
  h += '</section><section class="panel"><h2>Services catalog</h2>'
    + '<p class="hint">Centipede\'s peer-support codes (H0038, T1016, T1017) are the defaults. The standard CPT entries are carried for tracking only — this system does not submit claims.</p>'
    + '<table class="data"><tr><th>Code</th><th>Description</th><th>Rate</th><th>Default duration</th><th>Active</th><th>Available for scheduling</th></tr>';
  CFG.serviceCatalog.forEach((s) => { h += "<tr><td><strong>" + esc(s.code) + "</strong>" + (s.peer ? ' <span class="badge badge-stage">Centipede peer code</span>' : "") + "</td><td>" + esc(s.description) + "</td><td>" + esc(s.rate || "—") + "</td><td>" + esc(s.duration) + " min</td><td>" + (s.active ? "Yes" : "No") + "</td><td>" + (s.schedulable ? "Yes" : "No") + "</td></tr>"; });
  h += "</table></section>";
  root.innerHTML = h;
  $("svc-add").addEventListener("click", () => { state.editing.svc = "new"; renderBilling(); });
  $("billdoc-add").addEventListener("click", () => { state.editing.billdoc = "new"; renderBilling(); });
  root.querySelectorAll("[data-edit-svc]").forEach((b) => b.addEventListener("click", () => { state.editing.svc = b.getAttribute("data-edit-svc"); renderBilling(); }));
  root.querySelectorAll("[data-edit-billdoc]").forEach((b) => b.addEventListener("click", () => { state.editing.billdoc = b.getAttribute("data-edit-billdoc"); renderBilling(); }));
  wireView(root);
}

/* ---------------- Reminders ---------------- */
function remForm(r) {
  r = r || {};
  return '<form id="rem-form" class="panel"><h2>' + (r.id ? "Edit reminder" : "Add a reminder") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="rf-client">' + clientOpts(r.clientId) + '</select>'
    + '<label>Follow-up</label><input type="text" id="rf-text" value="' + esc(r.text || "") + '" placeholder="What needs following up">'
    + '<label>Due date</label><input type="date" id="rf-due" value="' + esc(r.due || todayStr()) + '">'
    + '<button type="submit" class="btn-navy">' + (r.id ? "Save changes" : "Add reminder") + '</button> '
    + '<button type="button" class="btn-small" id="rf-cancel">Cancel</button></form>';
}
function renderReminders() {
  const db = dbGet();
  const root = $("view-reminders");
  if (state.editing.rem) {
    const r = state.editing.rem === "new" ? null : db.reminders.find((x) => x.id === state.editing.rem);
    root.innerHTML = remForm(r);
    $("rf-cancel").addEventListener("click", () => { state.editing.rem = null; renderReminders(); });
    $("rem-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("rf-client").value, text: $("rf-text").value.trim(), due: $("rf-due").value };
      if (!rec.clientId || !rec.text) return;
      let actMsg;
      if (r) { Object.assign(d.reminders.find((x) => x.id === r.id), rec); actMsg = "Edited reminder for " + clientName(rec.clientId); }
      else { rec.id = uid(); rec.done = false; d.reminders.push(rec); actMsg = "Added reminder for " + clientName(rec.clientId); }
      dbSet(d); logActivity(actMsg); state.editing.rem = null; renderReminders();
    });
    return;
  }
  const open = db.reminders.filter((r) => !r.done).sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
  const done = db.reminders.filter((r) => r.done).sort((a, b) => (a.due || "") < (b.due || "") ? 1 : -1);
  const rules = settingsGet(db).reminderRules;
  const hourOpts = (cur) => CFG.reminderHourOptions.map((hh) => '<option value="' + hh + '"' + (Number(cur) === hh ? " selected" : "") + ">" + hh + " hours</option>").join("");
  let h = '<section class="panel"><h2>Appointment reminder rules</h2>'
    + '<p class="hint">Local Mode: these rules are recorded and displayed here for the team\'s reference. This browser-based system does not send reminders by itself — staff send reminders, and each client\'s own on/off choices are on their record in the Clients tab. A cancellation message goes out when an appointment is cancelled.</p>'
    + '<div class="grid2">'
    + '<div><label style="font-weight:normal;"><input type="checkbox" id="rr-email-on"' + (rules.emailOn ? " checked" : "") + '> Email reminder</label><select id="rr-email-hours">' + hourOpts(rules.emailHours) + '</select></div>'
    + '<div><label style="font-weight:normal;"><input type="checkbox" id="rr-text-on"' + (rules.textOn ? " checked" : "") + '> Text reminder</label><select id="rr-text-hours">' + hourOpts(rules.textHours) + '</select></div>'
    + '<div><label style="font-weight:normal;"><input type="checkbox" id="rr-voice-on"' + (rules.voiceOn ? " checked" : "") + '> Voice reminder</label><select id="rr-voice-hours">' + hourOpts(rules.voiceHours) + '</select></div>'
    + '<div><label style="font-weight:normal;"><input type="checkbox" id="rr-video-on"' + (rules.videoOn ? " checked" : "") + '> Extra reminder before video appointments</label><select id="rr-video-min"><option value="10"' + (Number(rules.videoMinutes) === 10 ? " selected" : "") + '>10 minutes before</option><option value="15"' + (Number(rules.videoMinutes) === 15 ? " selected" : "") + '>15 minutes before</option><option value="30"' + (Number(rules.videoMinutes) === 30 ? " selected" : "") + '>30 minutes before</option></select></div></div>'
    + '<p><button type="button" class="btn-navy" id="rr-save">Save reminder rules</button> <span class="save-status" id="rr-msg"></span></p></section>';
  h += '<section class="panel"><div class="toolbar"><span class="hint">Follow-up reminders per client. Due and overdue items also show on the Overview.</span><button type="button" class="btn-navy" id="rem-add">Add a reminder</button></div>';
  if (!open.length) h += '<p class="empty-note">No open reminders.</p>';
  else {
    h += '<ul class="item-list">';
    open.forEach((r) => { h += '<li><strong>' + esc(clientName(r.clientId)) + "</strong> — " + esc(r.text) + " · due " + fmtDate(r.due) + dateBadge(r.due) + ' <button type="button" class="btn-small" data-done-rem="' + r.id + '">Mark done</button> <button type="button" class="btn-small" data-edit-rem="' + r.id + '">Edit</button></li>'; });
    h += "</ul>";
  }
  if (done.length) { h += "<h3>Done</h3><ul class=\"item-list\">"; done.slice(0, 10).forEach((r) => { h += '<li class="task-done">' + esc(clientName(r.clientId)) + " — " + esc(r.text) + "</li>"; }); h += "</ul>"; }
  h += "</section>";
  root.innerHTML = h;
  $("rem-add").addEventListener("click", () => { state.editing.rem = "new"; renderReminders(); });
  $("rr-save").addEventListener("click", () => {
    const d = dbGet();
    d.settings = settingsGet(d);
    d.settings.reminderRules = { emailOn: $("rr-email-on").checked, emailHours: Number($("rr-email-hours").value), textOn: $("rr-text-on").checked, textHours: Number($("rr-text-hours").value), voiceOn: $("rr-voice-on").checked, voiceHours: Number($("rr-voice-hours").value), videoOn: $("rr-video-on").checked, videoMinutes: Number($("rr-video-min").value) };
    dbSet(d); logActivity("Updated appointment reminder rules");
    $("rr-msg").textContent = "Saved ✓ " + new Date().toLocaleTimeString();
  });
  root.querySelectorAll("[data-edit-rem]").forEach((b) => b.addEventListener("click", () => { state.editing.rem = b.getAttribute("data-edit-rem"); renderReminders(); }));
  root.querySelectorAll("[data-done-rem]").forEach((b) => b.addEventListener("click", () => { const d = dbGet(); const r = d.reminders.find((x) => x.id === b.getAttribute("data-done-rem")); if (r) { r.done = true; dbSet(d); logActivity("Marked reminder done for " + clientName(r.clientId)); renderReminders(); } }));
}

/* ---------------- Admin & Data ---------------- */
function renderAdmin() {
  const db = dbGet();
  const counts = [["Clients", db.clients.length], ["Appointments", db.appointments.length], ["Session notes", db.notes.length], ["Support plans", db.plans.length], ["Documents", db.documents.length], ["Service log entries", db.services.length], ["Billing documents", db.billDocs.length], ["Reminders", db.reminders.length], ["Staff profiles", db.staff.length]];
  let h = '<section class="panel"><h2>Admin &amp; Data</h2><div class="stats">';
  counts.forEach((pair) => { h += '<div class="stat"><div class="num">' + pair[1] + '</div><div class="lbl">' + pair[0] + "</div></div>"; });
  h += '</div><p class="hint">Centipede EHR is a standalone system at its own webpage — it is not part of the Company Portal. Records live in this browser\'s local storage under "' + DB_KEY + '". Download a backup copy regularly and file it with the company records; the locked client binders remain the official record.</p>'
    + '<p><button type="button" class="btn-navy" id="export-btn">Download backup (JSON)</button></p>'
    + '<p class="save-status" id="admin-msg"></p></section>';
  h += '<section class="panel"><h2>Activity</h2>'
    + '<p class="hint">Local audit trail — sign-ins and record actions in this browser, newest first. Kept in this browser\'s storage only.</p>';
  const acts = db.activity.slice().reverse();
  if (!acts.length) h += '<p class="empty-note">No activity recorded yet.</p>';
  else {
    h += '<table class="data"><tr><th>When</th><th>User</th><th>Action</th></tr>';
    acts.slice(0, 100).forEach((a) => { const when = a.ts ? new Date(a.ts).toLocaleString() : "—"; h += "<tr><td>" + esc(when) + "</td><td>" + esc(a.user || "—") + "</td><td>" + esc(a.action || "") + "</td></tr>"; });
    h += "</table>";
    if (acts.length > 100) h += '<p class="hint">Showing the most recent 100 of ' + acts.length + " entries.</p>";
  }
  h += "</section>";
  $("view-admin").innerHTML = h;
  $("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(dbGet(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "centipede-ehr-backup-" + todayStr() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $("admin-msg").textContent = "Backup downloaded ✓ " + new Date().toLocaleTimeString();
    logActivity("Downloaded a backup (JSON)");
  });
}

/* ---------------- Shell ---------------- */
function wireView(root) {
  if (!root) return;
  root.querySelectorAll("[data-open-client]").forEach((el) => el.addEventListener("click", () => { state.clientId = el.getAttribute("data-open-client"); state.editing = {}; showTab("clients"); }));
  root.querySelectorAll("[data-goto]").forEach((el) => el.addEventListener("click", () => showTab(el.getAttribute("data-goto"))));
}
const TABS = ["overview", "clients", "calendar", "notes", "plans", "documents", "billing", "reminders", "staff", "areas", "admin"];
function showTab(tab) {
  state.tab = tab;
  if (tab !== "clients") state.clientId = null;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("active", b.getAttribute("data-tab") === tab));
  TABS.forEach((t) => { $("view-" + t).hidden = t !== tab; });
  if (tab === "overview") renderOverview();
  if (tab === "clients") renderClients();
  if (tab === "calendar") renderCalendar();
  if (tab === "notes") renderNotes();
  if (tab === "plans") renderPlans();
  if (tab === "documents") renderDocuments();
  if (tab === "billing") renderBilling();
  if (tab === "reminders") renderReminders();
  if (tab === "staff") renderStaff();
  if (tab === "areas") renderAreas();
  if (tab === "admin") renderAdmin();
}
function enterApp() {
  logActivity("Signed in");
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = state.user.name + " · " + state.user.role + (state.user.admin ? " · Administrator" : "");
  $("tab-admin").hidden = !(state.user && state.user.admin);
  showTab("overview");
}
document.querySelectorAll("#tabs button").forEach((b) => b.addEventListener("click", () => showTab(b.getAttribute("data-tab"))));
$("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.ehr.v1", sessionKey: "ehr.user", onSignIn: (u) => { state.user = u; enterApp(); } });
const restored = CPPAuth.restoreSession(); if (restored) { state.user = restored; enterApp(); }

/* ---------------- Staff / Provider Profiles ---------------- */
function staffForm(s) {
  s = s || {};
  const progs = Array.isArray(s.programs) ? s.programs : [];
  let checks = "";
  CFG.programs.forEach((p) => { checks += '<label style="display:inline-block;margin:0.15rem 0.7rem 0.15rem 0;font-weight:normal;"><input type="checkbox" class="sf-prog" value="' + esc(p) + '"' + (progs.includes(p) ? " checked" : "") + "> " + esc(p) + "</label>"; });
  const lic = s.license || {};
  return '<form id="staff-form" class="panel"><h2>' + (s.id ? "Edit staff profile" : "Add a staff profile") + '</h2>'
    + '<p class="hint">Profile setup asks each person\'s specialty, the way standard practice systems do. Select the specialty that matches your own credential or role.</p>'
    + '<div class="grid2"><div><label>Full name <span class="req">*</span></label><input type="text" id="sf-name" value="' + esc(s.name || "") + '" required></div>'
    + '<div><label>Profession / specialty <span class="req">*</span></label><select id="sf-profession">' + opts(CFG.professions, s.profession || "Other") + '</select></div>'
    + '<div><label>Team role</label><select id="sf-teamrole">' + opts([""].concat(CFG.teamRoles.map((r) => r.name)), s.teamRole || "", "(not assigned)") + '</select></div>'
    + '<div><label>Credential / license type</label><input type="text" id="sf-credtype" value="' + esc(s.credentialType || "") + '" placeholder="e.g. Certified Peer Support Specialist"></div>'
    + '<div><label>Credential / license number</label><input type="text" id="sf-crednum" value="' + esc(s.credentialNumber || "") + '"></div>'
    + '<div><label>Phone</label><input type="tel" id="sf-phone" value="' + esc(s.phone || "") + '"></div>'
    + '<div><label>Email</label><input type="email" id="sf-email" value="' + esc(s.email || "") + '"></div>'
    + '<div><label>Status</label><select id="sf-status"><option value="Active"' + (s.status === "Active" || !s.status ? " selected" : "") + '>Active</option><option value="Inactive"' + (s.status === "Inactive" ? " selected" : "") + '>Inactive</option></select></div></div>'
    + '<fieldset><legend>License / degree information</legend><div class="grid2">'
    + '<div><label>Type</label><input type="text" id="sf-lictype" value="' + esc(lic.type || "") + '" placeholder="License or degree type"></div>'
    + '<div><label>License number</label><input type="text" id="sf-licnum" value="' + esc(lic.number || "") + '"></div>'
    + '<div><label>Expiration date</label><input type="date" id="sf-licexp" value="' + esc(lic.expires || "") + '"></div>'
    + '<div><label>State</label><input type="text" id="sf-licstate" value="' + esc(lic.state || "") + '" placeholder="e.g. CA"></div></div></fieldset>'
    + '<fieldset><legend>Programs</legend>' + checks + '</fieldset>'
    + '<label>Notes</label><textarea id="sf-notes" rows="2">' + esc(s.notes || "") + '</textarea>'
    + '<button type="submit" class="btn-navy">' + (s.id ? "Save changes" : "Add profile") + '</button> '
    + '<button type="button" class="btn-small" id="sf-cancel">Cancel</button></form>';
}
function renderStaff() {
  const db = dbGet();
  const root = $("view-staff");
  if (state.editing.staff) {
    const s = state.editing.staff === "new" ? null : db.staff.find((x) => x.id === state.editing.staff);
    root.innerHTML = staffForm(s);
    $("sf-cancel").addEventListener("click", () => { state.editing.staff = null; renderStaff(); });
    $("staff-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const progs = Array.from(root.querySelectorAll(".sf-prog:checked")).map((x) => x.value);
      const rec = { name: $("sf-name").value.trim(), profession: $("sf-profession").value, teamRole: $("sf-teamrole").value, credentialType: $("sf-credtype").value.trim(), credentialNumber: $("sf-crednum").value.trim(), license: { type: $("sf-lictype").value.trim(), number: $("sf-licnum").value.trim(), expires: $("sf-licexp").value, state: $("sf-licstate").value.trim() }, phone: $("sf-phone").value.trim(), email: $("sf-email").value.trim(), status: $("sf-status").value, programs: progs, notes: $("sf-notes").value };
      if (!rec.name) return;
      let actMsg;
      if (s) { Object.assign(d.staff.find((x) => x.id === s.id), rec); actMsg = "Edited staff profile for " + rec.name; }
      else { rec.id = uid(); d.staff.push(rec); actMsg = "Added staff profile for " + rec.name; }
      dbSet(d); logActivity(actMsg); state.editing.staff = null; renderStaff();
    });
    return;
  }
  const list = db.staff.slice().sort((a, b) => a.name < b.name ? -1 : 1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">Staff / provider profiles — specialty, credential, license / degree information, team role, and programs for each team member.</span><button type="button" class="btn-navy" id="staff-add">Add a staff profile</button></div>';
  if (!list.length) h += '<p class="empty-note">No staff profiles yet. Add the first profile.</p>';
  else {
    h += '<table class="data"><tr><th>Name</th><th>Profession / specialty</th><th>Team role</th><th>Credential</th><th>License / degree</th><th>Programs</th><th>Status</th><th></th></tr>';
    list.forEach((s) => { const lic = s.license || {}; h += "<tr><td><strong>" + esc(s.name) + "</strong></td><td>" + esc(s.profession || "—") + "</td><td>" + esc(s.teamRole || "—") + "</td><td>" + esc([s.credentialType, s.credentialNumber].filter(Boolean).join(" ") || "—") + "</td><td>" + esc([lic.type, lic.number, lic.state, lic.expires ? "exp " + fmtDate(lic.expires) : ""].filter(Boolean).join(" · ") || "—") + "</td><td>" + esc((s.programs || []).join(", ") || "—") + "</td><td>" + esc(s.status || "—") + '</td><td><button type="button" class="btn-small" data-edit-staff="' + s.id + '">Edit</button></td></tr>'; });
    h += "</table>";
  }
  h += '</section><section class="panel"><h2>Team roles &amp; permissions</h2>'
    + '<p class="hint">The three team role patterns, mirroring the standard practice roles — full access, biller, and scheduler — in Centipede\'s non-clinical terms. Assign a role on each staff profile.</p>';
  CFG.teamRoles.forEach((r) => {
    h += "<h3>" + esc(r.name) + '</h3><p class="hint">' + esc(r.summary) + '</p><ul class="item-list">';
    r.permissions.forEach((p) => { h += "<li>" + esc(p) + "</li>"; });
    h += "</ul>";
  });
  h += "</section>";
  root.innerHTML = h;
  $("staff-add").addEventListener("click", () => { state.editing.staff = "new"; renderStaff(); });
  root.querySelectorAll("[data-edit-staff]").forEach((b) => b.addEventListener("click", () => { state.editing.staff = b.getAttribute("data-edit-staff"); renderStaff(); }));
  root.querySelectorAll("[data-open-area]").forEach((b) => b.addEventListener("click", () => { state.area = b.getAttribute("data-open-area"); showTab("areas"); }));
}

/* ---------------- Work Areas (clickable outlines) ---------------- */
function renderAreas() {
  const root = $("view-areas");
  const areas = CFG.workAreas || [];
  if (state.area) {
    const ar = areas.find((x) => x.name === state.area);
    if (ar) {
      let h = '<section class="panel"><button type="button" class="btn-small" id="area-back">← All work areas</button>'
        + "<h2>" + esc(ar.name) + "</h2><p>" + esc(ar.summary) + "</p>"
        + "<h3>What this role works on</h3><ul>";
      ar.worksOn.forEach((w) => { h += "<li>" + esc(w) + "</li>"; });
      h += "</ul><h3>Services / support in this area</h3><ul>";
      ar.services.forEach((w) => { h += "<li>" + esc(w) + "</li>"; });
      h += "</ul><h3>What gets documented in the EHR</h3><ul>";
      ar.documents.forEach((w) => { h += "<li>" + esc(w) + "</li>"; });
      h += '</ul><p class="hint">Centipede\'s own services are non-clinical peer support. Outlines for licensed professions describe those professions generally, for reference.</p></section>';
      root.innerHTML = h;
      $("area-back").addEventListener("click", () => { state.area = null; renderAreas(); });
      return;
    }
    state.area = null;
  }
  let h = '<section class="panel"><h2>Work areas</h2><p class="hint">Click a profession or behavioral-health area to see its outline — what that role works on, the services or support in that area, and what gets documented in the EHR.</p><ul class="item-list">';
  areas.forEach((ar) => { h += '<li class="clickable" data-area="' + esc(ar.name) + '"><strong>' + esc(ar.name) + "</strong> — " + esc(ar.summary) + "</li>"; });
  h += "</ul></section>";
  root.innerHTML = h;
  root.querySelectorAll("[data-area]").forEach((el) => el.addEventListener("click", () => { state.area = el.getAttribute("data-area"); renderAreas(); }));
}

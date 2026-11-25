"use strict";
/* Centipede Peer to Peer, LLC — Centipede EHR (assets/app.js).
   Built November 24, 2026 at the direction of the Chief Executive
   Officer: Centipede's own internal peer-support record system,
   modeled on the feature set of SimplePractice — clients, calendar,
   session notes, support plans, documents, billing & insurance,
   reminders — reshaped for a NON-CLINICAL peer-support company.
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
const EMPTY = () => ({ clients: [], appointments: [], notes: [], plans: [], documents: [], services: [], reminders: [] });

const dbGet = () => { try { const d = JSON.parse(localStorage.getItem(DB_KEY)); if (d && Array.isArray(d.clients) && Array.isArray(d.appointments) && Array.isArray(d.notes) && Array.isArray(d.plans) && Array.isArray(d.documents) && Array.isArray(d.services) && Array.isArray(d.reminders)) return d; } catch { /* fall through */ } return EMPTY(); };
const dbSet = (d) => localStorage.setItem(DB_KEY, JSON.stringify(d));

const state = { user: null, tab: "overview", clientId: null, editing: {}, search: "", calView: "upcoming" };

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
  const todays = db.appointments.filter((a) => a.date === t && a.status === "Scheduled").sort((a, b) => (a.time || "") < (b.time || "") ? -1 : 1);
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
  else { h += '<ul class="item-list">'; todays.forEach((a) => { h += '<li><strong>' + esc(a.time || "—") + "</strong> · " + esc(clientName(a.clientId)) + " · " + esc(a.serviceType) + (a.location ? " · " + esc(a.location) : "") + "</li>"; }); h += "</ul>"; }
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
function clientForm(c) {
  c = c || {};
  const ins = c.insurance || {};
  return '<form id="client-form" class="panel"><h2>' + (c.id ? "Edit client" : "Add a client") + '</h2>'
    + '<div class="grid2"><div><label>Full name <span class="req">*</span></label><input type="text" id="cf-name" value="' + esc(c.name || "") + '" required></div>'
    + '<div><label>Date of birth</label><input type="date" id="cf-dob" value="' + esc(c.dob || "") + '"></div>'
    + '<div><label>Phone</label><input type="tel" id="cf-phone" value="' + esc(c.phone || "") + '"></div>'
    + '<div><label>Email</label><input type="email" id="cf-email" value="' + esc(c.email || "") + '"></div></div>'
    + '<label>Address</label><input type="text" id="cf-address" value="' + esc(c.address || "") + '">'
    + '<div class="grid2"><div><label>Program</label><select id="cf-program">' + opts(CFG.programs, c.program || "Peer Support") + '</select></div>'
    + '<div><label>Status</label><select id="cf-status">' + opts(CFG.clientStatuses, c.status || "Active") + '</select></div>'
    + '<div><label>Assigned staff</label><input type="text" id="cf-staff" value="' + esc(c.staff || "") + '"></div>'
    + '<div><label>Emergency contact</label><input type="text" id="cf-emerg" value="' + esc(c.emergency || "") + '" placeholder="Name and phone"></div></div>'
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
    $("client-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { name: $("cf-name").value.trim(), dob: $("cf-dob").value, phone: $("cf-phone").value.trim(), email: $("cf-email").value.trim(), address: $("cf-address").value.trim(), program: $("cf-program").value, status: $("cf-status").value, staff: $("cf-staff").value.trim(), emergency: $("cf-emerg").value.trim(), notes: $("cf-notes").value, insurance: { payer: $("cf-payer").value.trim(), memberId: $("cf-member").value.trim(), groupId: $("cf-group").value.trim(), notes: $("cf-insnotes").value.trim() } };
      if (!rec.name) return;
      if (c) { Object.assign(d.clients.find((x) => x.id === c.id), rec); }
      else { rec.id = uid(); rec.createdAt = todayStr(); d.clients.push(rec); }
      dbSet(d); state.editing.client = null; renderClients();
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
    list.forEach((c) => { h += '<tr class="clickable" data-open-client="' + c.id + '"><td><strong>' + esc(c.name) + '</strong></td><td>' + esc(c.program || "—") + '</td><td>' + esc(c.status || "—") + '</td><td>' + esc(c.phone || "—") + '</td><td>' + esc(c.staff || "—") + "</td></tr>"; });
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
  let h = '<section class="panel"><button type="button" class="btn-small" id="back-clients">← All clients</button>'
    + "<h2>" + esc(c.name) + ' <span class="badge badge-stage">' + esc(c.status || "") + "</span></h2>"
    + '<dl class="detail-grid">'
    + "<div><dt>Program</dt><dd>" + esc(c.program || "—") + "</dd></div>"
    + "<div><dt>Date of birth</dt><dd>" + fmtDate(c.dob) + "</dd></div>"
    + "<div><dt>Phone</dt><dd>" + esc(c.phone || "—") + "</dd></div>"
    + "<div><dt>Email</dt><dd>" + esc(c.email || "—") + "</dd></div>"
    + "<div><dt>Address</dt><dd>" + esc(c.address || "—") + "</dd></div>"
    + "<div><dt>Assigned staff</dt><dd>" + esc(c.staff || "—") + "</dd></div>"
    + "<div><dt>Emergency contact</dt><dd>" + esc(c.emergency || "—") + "</dd></div>"
    + "<div><dt>Client since</dt><dd>" + fmtDate(c.createdAt) + "</dd></div></dl>"
    + (c.notes ? '<blockquote class="note-text">' + esc(c.notes) + "</blockquote>" : "")
    + '<p><button type="button" class="btn-small" id="edit-client">Edit client</button></p></section>';
  h += '<section class="panel"><h2>Insurance</h2><dl class="detail-grid">'
    + "<div><dt>Payer</dt><dd>" + esc(ins.payer || "—") + "</dd></div>"
    + "<div><dt>Member ID</dt><dd>" + esc(ins.memberId || "—") + "</dd></div>"
    + "<div><dt>Group number</dt><dd>" + esc(ins.groupId || "—") + "</dd></div>"
    + "<div><dt>Notes</dt><dd>" + esc(ins.notes || "—") + "</dd></div></dl></section>";
  h += '<section class="panel"><h2>Support plan</h2>';
  if (!plans.length) h += '<p class="empty-note">No support plan yet. Add one in the Support Plans tab.</p>';
  plans.forEach((p) => { h += '<p><strong>' + esc(p.status) + "</strong> · Review by " + fmtDate(p.reviewDate) + dateBadge(p.reviewDate) + "</p><blockquote class=\"note-text\">Goals: " + esc(p.goals) + "</blockquote>"; });
  h += '</section><section class="panel"><h2>Recent session notes</h2>';
  if (!notes.length) h += '<p class="empty-note">No session notes yet.</p>';
  notes.slice(0, 5).forEach((n) => { h += '<p><strong>' + fmtDate(n.date) + "</strong> · " + esc(n.status) + " · " + esc(n.author || "") + '</p><blockquote class="note-text">' + esc(n.data) + "</blockquote>"; });
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
function apptForm(a) {
  a = a || {};
  return '<form id="appt-form" class="panel"><h2>' + (a.id ? "Edit appointment" : "Add an appointment") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="af-client">' + clientOpts(a.clientId) + '</select>'
    + '<div class="grid2"><div><label>Date <span class="req">*</span></label><input type="date" id="af-date" value="' + esc(a.date || todayStr()) + '" required></div>'
    + '<div><label>Time</label><input type="time" id="af-time" value="' + esc(a.time || "") + '"></div>'
    + '<div><label>Service type</label><select id="af-type">' + opts(CFG.serviceTypes, a.serviceType || "Peer Support Session") + '</select></div>'
    + '<div><label>Status</label><select id="af-status">' + opts(CFG.appointmentStatuses, a.status || "Scheduled") + '</select></div></div>'
    + '<label>Location</label><input type="text" id="af-location" value="' + esc(a.location || "") + '">'
    + '<label>Staff</label><input type="text" id="af-staff" value="' + esc(a.staff || "") + '">'
    + '<label>Notes</label><textarea id="af-notes" rows="2">' + esc(a.notes || "") + '</textarea>'
    + '<button type="submit" class="btn-navy">' + (a.id ? "Save changes" : "Add appointment") + '</button> '
    + '<button type="button" class="btn-small" id="af-cancel">Cancel</button></form>';
}
function renderCalendar() {
  const db = dbGet();
  const root = $("view-calendar");
  if (state.editing.appt) {
    const a = state.editing.appt === "new" ? null : db.appointments.find((x) => x.id === state.editing.appt);
    root.innerHTML = apptForm(a);
    $("af-cancel").addEventListener("click", () => { state.editing.appt = null; renderCalendar(); });
    $("appt-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("af-client").value, date: $("af-date").value, time: $("af-time").value, serviceType: $("af-type").value, status: $("af-status").value, location: $("af-location").value.trim(), staff: $("af-staff").value.trim(), notes: $("af-notes").value };
      if (!rec.clientId || !rec.date) return;
      if (a) Object.assign(d.appointments.find((x) => x.id === a.id), rec);
      else { rec.id = uid(); d.appointments.push(rec); }
      dbSet(d); state.editing.appt = null; renderCalendar();
    });
    return;
  }
  const t = todayStr();
  let list = db.appointments.slice();
  if (state.calView === "today") list = list.filter((a) => a.date === t);
  else if (state.calView === "week") list = list.filter((a) => { const dd = daysUntil(a.date); return dd !== null && dd >= 0 && dd <= 7; });
  else list = list.filter((a) => daysUntil(a.date) !== null && daysUntil(a.date) >= 0);
  list.sort((a, b) => (a.date + (a.time || "")) < (b.date + (b.time || "")) ? -1 : 1);
  let h = '<section class="panel"><div class="toolbar"><label>View<select id="cal-view">'
    + '<option value="upcoming"' + (state.calView === "upcoming" ? " selected" : "") + '>Upcoming</option>'
    + '<option value="today"' + (state.calView === "today" ? " selected" : "") + '>Today</option>'
    + '<option value="week"' + (state.calView === "week" ? " selected" : "") + '>Next 7 days</option>'
    + '<option value="all"' + (state.calView === "all" ? " selected" : "") + '>All appointments</option></select></label>'
    + '<button type="button" class="btn-navy" id="appt-add">Add an appointment</button></div>';
  if (state.calView === "all") { list = db.appointments.slice().sort((a, b) => (a.date + (a.time || "")) > (b.date + (b.time || "")) ? -1 : 1); }
  if (!list.length) h += '<p class="empty-note">No appointments in this view.</p>';
  else {
    h += '<table class="data"><tr><th>Date</th><th>Time</th><th>Client</th><th>Service</th><th>Location</th><th>Status</th><th></th></tr>';
    list.forEach((a) => { h += "<tr" + (a.date < t && a.status === "Scheduled" ? ' class="overdue"' : "") + "><td>" + fmtDate(a.date) + dateBadge(a.date) + "</td><td>" + esc(a.time || "—") + "</td><td>" + esc(clientName(a.clientId)) + "</td><td>" + esc(a.serviceType) + "</td><td>" + esc(a.location || "—") + "</td><td>" + esc(a.status) + '</td><td><button type="button" class="btn-small" data-edit-appt="' + a.id + '">Edit</button></td></tr>'; });
    h += "</table>";
  }
  h += "</section>";
  root.innerHTML = h;
  $("cal-view").addEventListener("change", (e) => { state.calView = e.target.value; renderCalendar(); });
  $("appt-add").addEventListener("click", () => { state.editing.appt = "new"; renderCalendar(); });
  root.querySelectorAll("[data-edit-appt]").forEach((b) => b.addEventListener("click", () => { state.editing.appt = b.getAttribute("data-edit-appt"); renderCalendar(); }));
}

/* ---------------- Session Notes (DAP) ---------------- */
function noteForm(n) {
  n = n || {};
  const appts = dbGet().appointments.filter((a) => !n.clientId || a.clientId === n.clientId);
  let apptOpts = '<option value="">(not tied to an appointment)</option>';
  appts.forEach((a) => { apptOpts += '<option value="' + a.id + '"' + (a.id === n.appointmentId ? " selected" : "") + ">" + fmtDate(a.date) + " — " + esc(a.serviceType) + "</option>"; });
  return '<form id="note-form" class="panel"><h2>' + (n.id ? "Edit session note" : "Add a session note") + '</h2>'
    + '<p class="hint">DAP format — Data: what happened in the session. Assessment: the peer worker\'s plain summary of where the person stands. Plan: the agreed next steps. Peer-support notes only.</p>'
    + '<label>Client <span class="req">*</span></label><select id="nf-client">' + clientOpts(n.clientId) + '</select>'
    + '<label>Appointment</label><select id="nf-appt">' + apptOpts + '</select>'
    + '<div class="grid2"><div><label>Date <span class="req">*</span></label><input type="date" id="nf-date" value="' + esc(n.date || todayStr()) + '" required></div>'
    + '<div><label>Status</label><select id="nf-status"><option value="Draft"' + (n.status === "Draft" || !n.status ? " selected" : "") + '>Draft (unsigned)</option><option value="Signed"' + (n.status === "Signed" ? " selected" : "") + '>Signed (final)</option></select></div></div>'
    + '<label>Data</label><textarea id="nf-data" rows="4">' + esc(n.data || "") + '</textarea>'
    + '<label>Assessment</label><textarea id="nf-assessment" rows="4">' + esc(n.assessment || "") + '</textarea>'
    + '<label>Plan</label><textarea id="nf-plan" rows="3">' + esc(n.plan || "") + '</textarea>'
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
    $("note-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("nf-client").value, appointmentId: $("nf-appt").value || "", date: $("nf-date").value, status: $("nf-status").value, data: $("nf-data").value, assessment: $("nf-assessment").value, plan: $("nf-plan").value };
      if (!rec.clientId || !rec.date) return;
      if (n) Object.assign(d.notes.find((x) => x.id === n.id), rec);
      else { rec.id = uid(); rec.author = state.user ? state.user.name : ""; d.notes.push(rec); }
      dbSet(d); state.editing.note = null; renderNotes();
    });
    return;
  }
  const list = db.notes.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">DAP session notes — drafts stay unsigned until the worker signs them final.</span><button type="button" class="btn-navy" id="note-add">Add a session note</button></div>';
  if (!list.length) h += '<p class="empty-note">No session notes yet.</p>';
  else {
    list.forEach((n) => {
      h += '<div class="panel"><p><strong>' + esc(clientName(n.clientId)) + "</strong> · " + fmtDate(n.date) + ' <span class="badge' + (n.status === "Draft" ? " badge-soon" : " badge-stage") + '">' + esc(n.status) + "</span> · " + esc(n.author || "")
        + ' <button type="button" class="btn-small" data-edit-note="' + n.id + '">Edit</button>'
        + (n.status === "Draft" ? ' <button type="button" class="btn-small" data-sign-note="' + n.id + '">Sign (mark final)</button>' : "") + "</p>"
        + "<h3>Data</h3><blockquote class=\"note-text\">" + esc(n.data || "—") + "</blockquote>"
        + "<h3>Assessment</h3><blockquote class=\"note-text\">" + esc(n.assessment || "—") + "</blockquote>"
        + "<h3>Plan</h3><blockquote class=\"note-text\">" + esc(n.plan || "—") + "</blockquote></div>";
    });
  }
  h += "</section>";
  root.innerHTML = h;
  $("note-add").addEventListener("click", () => { state.editing.note = "new"; renderNotes(); });
  root.querySelectorAll("[data-edit-note]").forEach((b) => b.addEventListener("click", () => { state.editing.note = b.getAttribute("data-edit-note"); renderNotes(); }));
  root.querySelectorAll("[data-sign-note]").forEach((b) => b.addEventListener("click", () => { const d = dbGet(); const n = d.notes.find((x) => x.id === b.getAttribute("data-sign-note")); if (n) { n.status = "Signed"; dbSet(d); renderNotes(); } }));
}

/* ---------------- Support Plans ---------------- */
function planForm(p) {
  p = p || {};
  return '<form id="plan-form" class="panel"><h2>' + (p.id ? "Edit support plan" : "Add a support plan") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="pf-client">' + clientOpts(p.clientId) + '</select>'
    + '<label>Goals</label><textarea id="pf-goals" rows="3" placeholder="What the person wants to work toward">' + esc(p.goals || "") + '</textarea>'
    + '<label>Objectives / steps</label><textarea id="pf-objectives" rows="3" placeholder="The steps toward each goal, and who does what">' + esc(p.objectives || "") + '</textarea>'
    + '<label>Strengths &amp; supports</label><textarea id="pf-strengths" rows="2">' + esc(p.strengths || "") + '</textarea>'
    + '<div class="grid2"><div><label>Review date</label><input type="date" id="pf-review" value="' + esc(p.reviewDate || "") + '"></div>'
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
    $("plan-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("pf-client").value, goals: $("pf-goals").value, objectives: $("pf-objectives").value, strengths: $("pf-strengths").value, reviewDate: $("pf-review").value, status: $("pf-status").value };
      if (!rec.clientId) return;
      if (p) Object.assign(d.plans.find((x) => x.id === p.id), rec);
      else { rec.id = uid(); rec.createdAt = todayStr(); d.plans.push(rec); }
      dbSet(d); state.editing.plan = null; renderPlans();
    });
    return;
  }
  const list = db.plans.slice().sort((a, b) => (a.reviewDate || "9999") < (b.reviewDate || "9999") ? -1 : 1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">Support plans hold each person\'s goals, the steps toward them, and the review date.</span><button type="button" class="btn-navy" id="plan-add">Add a support plan</button></div>';
  if (!list.length) h += '<p class="empty-note">No support plans yet.</p>';
  else {
    list.forEach((p) => {
      h += '<div class="panel"><p><strong>' + esc(clientName(p.clientId)) + '</strong> <span class="badge badge-stage">' + esc(p.status) + "</span> · Review by " + fmtDate(p.reviewDate) + dateBadge(p.reviewDate)
        + ' <button type="button" class="btn-small" data-edit-plan="' + p.id + '">Edit</button></p>'
        + "<h3>Goals</h3><blockquote class=\"note-text\">" + esc(p.goals || "—") + "</blockquote>"
        + "<h3>Objectives / steps</h3><blockquote class=\"note-text\">" + esc(p.objectives || "—") + "</blockquote>"
        + (p.strengths ? "<h3>Strengths &amp; supports</h3><blockquote class=\"note-text\">" + esc(p.strengths) + "</blockquote>" : "") + "</div>";
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
    const d0 = state.editing.doc === "new" ? null : db.documents.find((x) => x.id === state.editing.doc);
    root.innerHTML = docForm(d0);
    $("df-cancel").addEventListener("click", () => { state.editing.doc = null; renderDocuments(); });
    $("doc-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const d = dbGet();
      const rec = { clientId: $("df-client").value, type: $("df-type").value, date: $("df-date").value, status: $("df-status").value, note: $("df-note").value.trim() };
      if (!rec.clientId) return;
      if (d0) Object.assign(d.documents.find((x) => x.id === d0.id), rec);
      else { rec.id = uid(); d.documents.push(rec); }
      dbSet(d); state.editing.doc = null; renderDocuments();
    });
    return;
  }
  const list = db.documents.slice().sort((a, b) => a.date < b.date ? 1 : -1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">Document tracking — what is on file for each client and its status. Signed copies are filed in the client\'s record.</span><button type="button" class="btn-navy" id="doc-add">Add a document</button></div>';
  if (!list.length) h += '<p class="empty-note">No documents tracked yet.</p>';
  else {
    h += '<table class="data"><tr><th>Client</th><th>Type</th><th>Date</th><th>Status</th><th>Note</th><th></th></tr>';
    list.forEach((d) => { h += "<tr><td>" + esc(clientName(d.clientId)) + "</td><td>" + esc(d.type) + "</td><td>" + fmtDate(d.date) + "</td><td>" + esc(d.status) + "</td><td>" + esc(d.note || "—") + '</td><td><button type="button" class="btn-small" data-edit-doc="' + d.id + '">Edit</button></td></tr>'; });
    h += "</table>";
  }
  h += "</section>";
  root.innerHTML = h;
  $("doc-add").addEventListener("click", () => { state.editing.doc = "new"; renderDocuments(); });
  root.querySelectorAll("[data-edit-doc]").forEach((b) => b.addEventListener("click", () => { state.editing.doc = b.getAttribute("data-edit-doc"); renderDocuments(); }));
}

/* ---------------- Billing & Insurance ---------------- */
function svcForm(s) {
  s = s || {};
  return '<form id="svc-form" class="panel"><h2>' + (s.id ? "Edit service log entry" : "Log a service") + '</h2>'
    + '<label>Client <span class="req">*</span></label><select id="bf-client">' + clientOpts(s.clientId) + '</select>'
    + '<div class="grid2"><div><label>Date <span class="req">*</span></label><input type="date" id="bf-date" value="' + esc(s.date || todayStr()) + '" required></div>'
    + '<div><label>Service code</label><select id="bf-code">' + opts(CFG.serviceCodes, s.code || "H0038") + '</select></div>'
    + '<div><label>Units (15-min)</label><input type="text" id="bf-units" inputmode="numeric" value="' + esc(s.units || "1") + '"></div>'
    + '<div><label>Claim status</label><select id="bf-claim">' + opts(CFG.claimStatuses, s.claimStatus || "Not Submitted") + '</select></div></div>'
    + '<label>Staff</label><input type="text" id="bf-staff" value="' + esc(s.staff || "") + '">'
    + '<label>Note</label><input type="text" id="bf-note" value="' + esc(s.note || "") + '">'
    + '<button type="submit" class="btn-navy">' + (s.id ? "Save changes" : "Log service") + '</button> '
    + '<button type="button" class="btn-small" id="bf-cancel">Cancel</button></form>';
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
      if (s) Object.assign(d.services.find((x) => x.id === s.id), rec);
      else { rec.id = uid(); d.services.push(rec); }
      dbSet(d); state.editing.svc = null; renderBilling();
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
  root.innerHTML = h;
  $("svc-add").addEventListener("click", () => { state.editing.svc = "new"; renderBilling(); });
  root.querySelectorAll("[data-edit-svc]").forEach((b) => b.addEventListener("click", () => { state.editing.svc = b.getAttribute("data-edit-svc"); renderBilling(); }));
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
      if (r) Object.assign(d.reminders.find((x) => x.id === r.id), rec);
      else { rec.id = uid(); rec.done = false; d.reminders.push(rec); }
      dbSet(d); state.editing.rem = null; renderReminders();
    });
    return;
  }
  const open = db.reminders.filter((r) => !r.done).sort((a, b) => (a.due || "9999") < (b.due || "9999") ? -1 : 1);
  const done = db.reminders.filter((r) => r.done).sort((a, b) => (a.due || "") < (b.due || "") ? 1 : -1);
  let h = '<section class="panel"><div class="toolbar"><span class="hint">Follow-up reminders per client. Due and overdue items also show on the Overview.</span><button type="button" class="btn-navy" id="rem-add">Add a reminder</button></div>';
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
  root.querySelectorAll("[data-edit-rem]").forEach((b) => b.addEventListener("click", () => { state.editing.rem = b.getAttribute("data-edit-rem"); renderReminders(); }));
  root.querySelectorAll("[data-done-rem]").forEach((b) => b.addEventListener("click", () => { const d = dbGet(); const r = d.reminders.find((x) => x.id === b.getAttribute("data-done-rem")); if (r) { r.done = true; dbSet(d); renderReminders(); } }));
}

/* ---------------- Admin & Data ---------------- */
function renderAdmin() {
  const db = dbGet();
  const counts = [["Clients", db.clients.length], ["Appointments", db.appointments.length], ["Session notes", db.notes.length], ["Support plans", db.plans.length], ["Documents", db.documents.length], ["Service log entries", db.services.length], ["Reminders", db.reminders.length]];
  let h = '<section class="panel"><h2>Admin &amp; Data</h2><div class="stats">';
  counts.forEach((pair) => { h += '<div class="stat"><div class="num">' + pair[1] + '</div><div class="lbl">' + pair[0] + "</div></div>"; });
  h += '</div><p class="hint">Centipede EHR is a standalone system at its own webpage — it is not part of the Company Portal. Records live in this browser\'s local storage under "' + DB_KEY + '". Download a backup copy regularly and file it with the company records; the locked client binders remain the official record.</p>'
    + '<p><button type="button" class="btn-navy" id="export-btn">Download backup (JSON)</button></p>'
    + '<p class="save-status" id="admin-msg"></p></section>';
  $("view-admin").innerHTML = h;
  $("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(dbGet(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "centipede-ehr-backup-" + todayStr() + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    $("admin-msg").textContent = "Backup downloaded ✓ " + new Date().toLocaleTimeString();
  });
}

/* ---------------- Shell ---------------- */
function wireView(root) {
  if (!root) return;
  root.querySelectorAll("[data-open-client]").forEach((el) => el.addEventListener("click", () => { state.clientId = el.getAttribute("data-open-client"); state.editing = {}; showTab("clients"); }));
  root.querySelectorAll("[data-goto]").forEach((el) => el.addEventListener("click", () => showTab(el.getAttribute("data-goto"))));
}
const TABS = ["overview", "clients", "calendar", "notes", "plans", "documents", "billing", "reminders", "admin"];
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
CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.ehr.v1", sessionKey: "ehr.user", onSignIn: (u) => { state.user = u; enterApp(); } });
const restored = CPPAuth.restoreSession(); if (restored) { state.user = restored; enterApp(); }

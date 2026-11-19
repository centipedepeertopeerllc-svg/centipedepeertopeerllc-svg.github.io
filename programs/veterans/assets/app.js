"use strict";
/* Program dashboard — Centipede Peer to Peer, LLC. Same sign-in as every
   dashboard. Justice mode carries the full case register; Veterans mode
   carries the veteran register; every mode carries DAP-style notes. */
const CFG = window.PROGRAM_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { localStorage.setItem(k, JSON.stringify(v)); } };
const RKEY = "cpp.prog." + CFG.slug + ".records.v1";
const NKEY = "cpp.prog." + CFG.slug + ".notes.v1";
const state = { user: null };
function fields() {
  if (CFG.mode === "justice") return [["client","Member / client name"],["clientId","Client ID"],["court","Court"],["dept","Department"],["judge","Judge"],["docket","Docket number"],["caseno","Case number"],["type","Case type / charges"],["attorney","Attorney of record"],["attyContact","Attorney phone / email"],["po","Probation / parole officer"],["nextDate","Next court date"],["deadlines","Key deadlines"],["status","Case status"],["actions","Support actions taken"]];
  if (CFG.mode === "veterans") return [["vet","Veteran name"],["clientId","Client ID"],["branch","Branch of service"],["status","Veteran status"],["vic","Veteran ID Card (Yes / No / In progress)"],["base","Base / command stationed at"],["era","Service era / years"],["living","Living situation (homeless / housed / shelter / traveling / transitional)"],["phone","Best contact number"],["va","VA healthcare enrolled (Yes / No)"],["dd214","DD-214 on file (Yes / No / In progress)"],["benefits","Benefits status (receiving / applied / not applied)"],["needs","Needs & goals"],["actions","Support actions taken"]];
  return [["title","Title"],["detail","Details"],["status","Status"]];
}
function renderRecords() {
  const recs = store.get(RKEY, []);
  $("records-list").innerHTML = recs.length ? recs.map((r) => {
    const head = r.client || r.vet || r.title || "Record";
    const lines = fields().map(([k, label]) => r[k] ? `<br><span class="hint">${esc(label)}:</span> ${esc(r[k])}` : "").join("");
    return `<li><strong>${esc(r.id)} — ${esc(head)}</strong>${lines}<br><button type="button" data-del="${esc(r.id)}">Remove</button></li>`;
  }).join("") : '<li class="hint">No records yet.</li>';
  document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { store.set(RKEY, store.get(RKEY, []).filter((x) => x.id !== b.dataset.del)); renderRecords(); }));
}
function renderNotes() {
  const notes = store.get(NKEY, []);
  $("notes-list").innerHTML = notes.length ? notes.map((n) =>
    `<li><strong>${esc(n.id)}</strong> — ${esc(n.at)} · about ${esc(n.about)}<br><span class="hint">Data:</span> ${esc(n.data)}<br><span class="hint">Assessment:</span> ${esc(n.assessment)}<br><span class="hint">Plan:</span> ${esc(n.plan)}<br><span class="hint">By ${esc(n.by)}</span></li>`).join("")
    : '<li class="hint">No DAP notes yet.</li>';
}
function buildForms() {
  $("record-form").innerHTML = fields().map(([k, label]) => `<label>${esc(label)} <input id="rf-${k}" type="text"></label>`).join("") + '<button type="submit">Save record</button> <span id="rec-msg" class="hint" role="status"></span>';
  $("record-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const recs = store.get(RKEY, []);
    const r = { id: (CFG.mode === "justice" ? "CASE" : CFG.mode === "veterans" ? "VET" : "REC") + "-" + String(recs.length + 1).padStart(4, "0") };
    fields().forEach(([k]) => { r[k] = $("rf-" + k).value.trim(); });
    recs.unshift(r); store.set(RKEY, recs); e.target.reset(); renderRecords();
    $("rec-msg").textContent = "Saved as " + r.id + ".";
  });
  $("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const notes = store.get(NKEY, []);
    const n = { id: "DAP-" + String(notes.length + 1).padStart(4, "0"), at: new Date().toLocaleString(), about: $("nf-about").value.trim(), data: $("nf-data").value.trim(), assessment: $("nf-assessment").value.trim(), plan: $("nf-plan").value.trim(), by: state.user.name };
    if (!n.data && !n.plan) { $("note-msg").textContent = "Write the note in DAP form — what was said and seen, then the plan."; return; }
    notes.unshift(n); store.set(NKEY, notes); e.target.reset(); renderNotes();
    $("note-msg").textContent = "Note saved as " + n.id + ".";
  });
}
/* -------- client appointments \u2014 this program's book in the shared calendar --------
   One shared store for the Portal and every program dashboard
   (cpp.portal.cal.v1), so an appointment entered anywhere shows everywhere
   on this device. Scheduling and record only: nothing here notifies anyone;
   "Text this appointment" opens the phone's own Messages app. */
const AKEY = "cpp.portal.cal.v1";
const PROG_ALIASES = { "hygiene-outreach": ["Hygiene"], "homeless-shelter": ["Shelter \u2014 Stockton"] };
function myPrograms() { return [CFG.name].concat(PROG_ALIASES[CFG.slug] || []); }
const fmtT = (t) => { if (!t) return ""; const p = t.split(":").map(Number); const ap = p[0] >= 12 ? "PM" : "AM"; return (p[0] % 12 || 12) + ":" + String(p[1] || 0).padStart(2, "0") + " " + ap; };
const fmtDay = (d) => { if (!d) return ""; try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };
const smsHref = (x) => {
  const lines = ["Centipede Peer to Peer \u2014 Client Appointment", "Client: " + (x.client || "")];
  if (x.purpose) lines.push("For: " + x.purpose);
  lines.push("When: " + fmtDay(x.date) + (x.start ? " \u00b7 " + fmtT(x.start) + (x.end ? "\u2013" + fmtT(x.end) : "") : ""));
  lines.push("Program: " + (x.program || ""));
  if (x.staff) lines.push("Staff: " + x.staff);
  if (x.location) lines.push("Location: " + x.location);
  return "sms:2098713939?&body=" + encodeURIComponent(lines.join("\n"));
};
let editAptId = null;
function exitAptEdit() { editAptId = null; $("apt-form").reset(); $("apt-submit").textContent = "Add client appointment"; $("apt-cancel").hidden = true; $("apt-del").hidden = true; }
function renderAppts() {
  if (editAptId && !store.get(AKEY, []).some((x) => x.id === editAptId)) exitAptEdit();
  const items = store.get(AKEY, []).filter((x) => myPrograms().includes(x.program)).sort((x, y) => (x.when || "").localeCompare(y.when || ""));
  $("apt-list").innerHTML = items.length ? items.map((x) => x.type === "client-appointment"
    ? `<li class="appt-item"><span class="badge badge-appt">Client Appointment</span><span class="appt-when">${esc(fmtDay(x.date))}${x.start ? " \u00b7 " + fmtT(x.start) + (x.end ? "\u2013" + fmtT(x.end) : "") : ""}</span><br><span class="appt-client">Client: <strong>${esc(x.client)}</strong></span> \u00b7 With: ${esc(x.staff || "")}${x.purpose ? `<br>For: ${esc(x.purpose)}` : ""}${x.location ? `<br>Location: ${esc(x.location)}` : ""}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)}${x.editedBy ? " \u00b7 edited by " + esc(x.editedBy) : ""})</span><div class="appt-actions"><a class="btn-small" href="${esc(smsHref(x))}">Text this appointment</a><button type="button" class="btn-small" data-aedit="${esc(x.id)}">Edit</button><button type="button" class="btn-small" data-adel="${esc(x.id)}">Remove</button></div></li>`
    : `<li><strong>${esc(x.when)}</strong><br>Client: ${esc(x.client)} \u00b7 With: ${esc(x.with || "")}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)}${x.editedBy ? " \u00b7 edited by " + esc(x.editedBy) : ""})</span><div class="appt-actions"><button type="button" class="btn-small" data-adel="${esc(x.id)}">Remove</button></div></li>`).join("")
    : '<li class="hint">No client appointments scheduled.</li>';
  document.querySelectorAll("[data-adel]").forEach((b) => b.addEventListener("click", () => { store.set(AKEY, store.get(AKEY, []).filter((x) => x.id !== b.dataset.adel)); renderAppts(); }));
  document.querySelectorAll("[data-aedit]").forEach((b) => b.addEventListener("click", () => {
    const x = store.get(AKEY, []).find((y) => y.id === b.dataset.aedit); if (!x) return;
    editAptId = x.id;
    $("apt-client").value = x.client || ""; $("apt-staff").value = x.staff || "";
    $("apt-date").value = x.date || ""; $("apt-start").value = x.start || ""; $("apt-end").value = x.end || "";
    $("apt-location").value = x.location || ""; $("apt-purpose").value = x.purpose || ""; $("apt-note").value = x.note || "";
    $("apt-submit").textContent = "Save changes"; $("apt-cancel").hidden = false; $("apt-del").hidden = false;
    $("apt-msg").textContent = "Editing this appointment \u2014 change the fields and Save changes, or Cancel.";
    $("apt-form").scrollIntoView();
  }));
}
function initAppts() {
  $("apt-prog").textContent = CFG.name;
  $("apt-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = $("apt-date").value, start = $("apt-start").value, end = $("apt-end").value;
    const items = store.get(AKEY, []);
    if (editAptId) {
      const x = items.find((y) => y.id === editAptId);
      if (x) { x.client = $("apt-client").value.trim(); x.staff = $("apt-staff").value.trim(); x.date = date; x.start = start; x.end = end; x.when = date + "T" + (start || "00:00"); x.location = $("apt-location").value.trim(); x.purpose = $("apt-purpose").value.trim(); x.note = $("apt-note").value.trim(); x.editedBy = state.user.name; store.set(AKEY, items); }
      exitAptEdit(); renderAppts();
      $("apt-msg").textContent = "Client appointment updated.";
    } else {
      items.unshift({ id: "CAPT-" + Date.now(), type: "client-appointment", program: CFG.name, client: $("apt-client").value.trim(), staff: $("apt-staff").value.trim(), date: date, start: start, end: end, when: date + "T" + (start || "00:00"), location: $("apt-location").value.trim(), purpose: $("apt-purpose").value.trim(), note: $("apt-note").value.trim(), by: state.user.name });
      store.set(AKEY, items); e.target.reset(); renderAppts();
      $("apt-msg").textContent = "Client appointment added to the shared calendar \u2014 scheduling record only; it does not notify anyone.";
    }
  });
  $("apt-cancel").addEventListener("click", () => { exitAptEdit(); $("apt-msg").textContent = "Edit cancelled."; });
  $("apt-del").addEventListener("click", () => { if (editAptId) { store.set(AKEY, store.get(AKEY, []).filter((x) => x.id !== editAptId)); exitAptEdit(); renderAppts(); $("apt-msg").textContent = "Client appointment deleted."; } });
  renderAppts();
}



/* -------- appointment requests queue — this program's website requests --------
   One shared store (cpp.portal.apptreq.v1) for the Portal and every program
   dashboard, on this device. Requests from the website's Request an Appointment
   form arrive in the company inbox; staff enter them here or in the Portal.
   This panel shows this program's requests. Accept converts a request into a
   client appointment in the shared calendar store (cpp.portal.cal.v1);
   Decline records the outcome on the entry and closes it. */
const QKEY = "cpp.portal.apptreq.v1";
function renderReqs() {
  const all = store.get(QKEY, []);
  const open = all.filter((r) => r.status === "new" && myPrograms().includes(r.program));
  const done = all.filter((r) => r.status !== "new" && myPrograms().includes(r.program)).length;
  $("req-list").innerHTML = open.length ? open.map((r) => `<li class="appt-item"><span class="badge badge-appt">Appointment Request</span><br><span class="appt-client">From: <strong>${esc(r.name)}</strong></span> \u00b7 Program: ${esc(r.program)}<br>For: ${esc(r.purpose)}<br>Phone: ${esc(r.phone || "")}${r.email ? " \u00b7 Email: " + esc(r.email) : ""}<br>Preferred: ${esc(r.preferred || "")} \u00b7 Meet: ${esc(r.meet || "")}<br><span class="hint">Entered by ${esc(r.by)} \u2014 a request only; not confirmed until the office confirms with the person.</span><div class="appt-actions"><label>Date <input type="date" id="acc-date-${esc(r.id)}"></label> <label>Start <input type="time" id="acc-start-${esc(r.id)}"></label> <label>End <input type="time" id="acc-end-${esc(r.id)}"></label> <button type="button" class="btn-small" data-accept="${esc(r.id)}">Accept \u2014 add to calendar</button> <button type="button" class="btn-small" data-decline="${esc(r.id)}">Decline</button></div></li>`).join("")
    : '<li class="hint">No appointment requests waiting for this program.</li>';
  $("req-count").textContent = done ? done + " closed request" + (done === 1 ? "" : "s") + " for this program kept on record in the store (accepted and declined, with who decided and when)." : "";
  document.querySelectorAll("[data-accept]").forEach((b) => b.addEventListener("click", () => {
    const r = store.get(QKEY, []).find((x) => x.id === b.dataset.accept); if (!r) return;
    const date = $("acc-date-" + r.id).value, start = $("acc-start-" + r.id).value, end = $("acc-end-" + r.id).value;
    if (!date) { $("req-msg").textContent = "Set the appointment date first \u2014 the office confirms the day with the person, then accept."; return; }
    const items = store.get(AKEY, []);
    const appt = { id: "CAPT-" + Date.now(), type: "client-appointment", program: r.program, client: r.name, staff: "", date: date, start: start, end: end, when: date + "T" + (start || "00:00"), location: r.meet === "In person" ? "" : (r.meet || ""), purpose: r.purpose, note: "Accepted from a website appointment request. Phone: " + (r.phone || "") + (r.email ? " \u00b7 Email: " + r.email : "") + (r.preferred ? " \u00b7 Preferred: " + r.preferred : "") + " \u00b7 Meet: " + (r.meet || ""), source: "website-request", by: state.user.name };
    items.unshift(appt); store.set(AKEY, items);
    const reqs = store.get(QKEY, []); const q = reqs.find((x) => x.id === r.id);
    if (q) { q.status = "accepted"; q.outcomeBy = state.user.name; q.outcomeAt = new Date().toLocaleString(); q.apptId = appt.id; store.set(QKEY, reqs); }
    renderReqs(); renderAppts();
    $("req-msg").textContent = "Accepted \u2014 " + r.name + " is on the shared calendar. The office still confirms with the person directly.";
  }));
  document.querySelectorAll("[data-decline]").forEach((b) => b.addEventListener("click", () => {
    const reqs = store.get(QKEY, []); const q = reqs.find((x) => x.id === b.dataset.decline); if (!q) return;
    q.status = "declined"; q.outcomeBy = state.user.name; q.outcomeAt = new Date().toLocaleString(); store.set(QKEY, reqs); renderReqs();
    $("req-msg").textContent = "Request declined and kept on record.";
  }));
}
function initReqs() {
  $("req-prog").textContent = CFG.name;
  $("req-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const reqs = store.get(QKEY, []);
    reqs.unshift({ id: "REQ-" + Date.now(), status: "new", name: $("req-name").value.trim(), phone: $("req-phone").value.trim(), email: $("req-email").value.trim(), purpose: $("req-purpose").value.trim(), program: CFG.name, preferred: $("req-preferred").value.trim(), meet: $("req-meet").value, by: state.user.name, at: new Date().toLocaleString() });
    store.set(QKEY, reqs); e.target.reset(); renderReqs();
    $("req-msg").textContent = "Request entered in the queue.";
  });
  renderReqs();
}

function enterApp() {
  $("login-screen").hidden = true; $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = CFG.name + " — " + CFG.status + ". Program lead: " + CFG.lead + ". The binders stay the official record.";
  $("prog-head").innerHTML = `<h2>${esc(CFG.name)}</h2><p class="hint">Status: ${esc(CFG.status)} · Lead: ${esc(CFG.lead)}</p>
    <p><a href="${esc(CFG.driveUrl)}" target="_blank" rel="noopener"><strong>Open this program's Google Drive folder</strong></a> · <a href="https://centipedepeertopeerllc-svg.github.io/portal/">Back to the Company Portal (shared calendar &amp; appointments)</a></p>
    ${CFG.guardrail ? `<p class="hint">${esc(CFG.guardrail)}</p>` : ""}`;
  buildForms(); renderRecords(); renderNotes(); initAppts(); initReqs();
  if (window.CPPMail) CPPMail.mount($("email-panel"), {});
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}
(function boot() {
  CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.prog." + CFG.slug + ".v1", sessionKey: "prog." + CFG.slug + ".user", onSignIn: (u) => { state.user = u; enterApp(); } });
  const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); }
})();

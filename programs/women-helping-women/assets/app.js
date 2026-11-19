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
  if (CFG.mode === "veterans") return [["vet","Veteran name"],["clientId","Client ID"],["branch","Branch of service"],["status","Veteran status"],["vic","Veteran ID Card (Yes / No / In progress)"],["base","Base / command stationed at"],["era","Service era / years"],["needs","Needs & goals"],["actions","Support actions taken"]];
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
/* -------- client appointments — this program's book in the shared calendar --------
   Same store as the Portal calendar (cpp.portal.cal.v1), so an appointment
   booked here shows in the Portal and the other way around. Scheduling and
   record only: nothing here notifies anyone. */
const AKEY = "cpp.portal.cal.v1";
const PROG_ALIASES = { "hygiene-outreach": ["Hygiene"], "homeless-shelter": ["Shelter \u2014 Stockton"] };
function myPrograms() { return [CFG.name].concat(PROG_ALIASES[CFG.slug] || []); }
function renderAppts() {
  const items = store.get(AKEY, []).filter((x) => myPrograms().includes(x.program)).sort((x, y) => (x.when || "").localeCompare(y.when || ""));
  const fmtT = (t) => { if (!t) return ""; const p = t.split(":").map(Number); const ap = p[0] >= 12 ? "PM" : "AM"; return (p[0] % 12 || 12) + ":" + String(p[1] || 0).padStart(2, "0") + " " + ap; };
  $("apt-list").innerHTML = items.length ? items.map((x) => x.type === "client-appointment"
    ? `<li class="appt-item"><span class="badge badge-appt">Client Appointment</span> <strong>${esc(x.date || "")}${x.start ? " · " + fmtT(x.start) + (x.end ? "–" + fmtT(x.end) : "") : ""}</strong><br>Client: <strong>${esc(x.client)}</strong> · With: ${esc(x.staff || "")}${x.location ? `<br>Location: ${esc(x.location)}` : ""}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)})</span> <button type="button" data-adel="${esc(x.id)}">Remove</button></li>`
    : `<li><strong>${esc(x.when)}</strong><br>Client: ${esc(x.client)} · With: ${esc(x.with || "")}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)})</span> <button type="button" data-adel="${esc(x.id)}">Remove</button></li>`).join("")
    : '<li class="hint">No appointments for this program yet.</li>';
  document.querySelectorAll("[data-adel]").forEach((b) => b.addEventListener("click", () => { store.set(AKEY, store.get(AKEY, []).filter((x) => x.id !== b.dataset.adel)); renderAppts(); }));
}
function initAppts() {
  $("apt-prog").textContent = CFG.name;
  $("apt-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = $("apt-date").value, start = $("apt-start").value, end = $("apt-end").value;
    const items = store.get(AKEY, []);
    items.unshift({ id: "CAPT-" + Date.now(), type: "client-appointment", program: CFG.name, client: $("apt-client").value.trim(), staff: $("apt-staff").value.trim(), date: date, start: start, end: end, when: date + "T" + (start || "00:00"), location: $("apt-location").value.trim(), note: $("apt-note").value.trim(), by: state.user.name });
    store.set(AKEY, items); e.target.reset(); renderAppts();
    $("apt-msg").textContent = "Client appointment added to the shared calendar — scheduling record only; it does not notify anyone.";
  });
  renderAppts();
}

function enterApp() {
  $("login-screen").hidden = true; $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = CFG.name + " — " + CFG.status + ". Program lead: " + CFG.lead + ". The binders stay the official record.";
  $("prog-head").innerHTML = `<h2>${esc(CFG.name)}</h2><p class="hint">Status: ${esc(CFG.status)} · Lead: ${esc(CFG.lead)}</p>
    <p><a href="${esc(CFG.driveUrl)}" target="_blank" rel="noopener"><strong>Open this program's Google Drive folder</strong></a> · <a href="https://centipedepeertopeerllc-svg.github.io/portal/">Back to the Company Portal (shared calendar &amp; appointments)</a></p>
    ${CFG.guardrail ? `<p class="hint">${esc(CFG.guardrail)}</p>` : ""}`;
  buildForms(); renderRecords(); renderNotes(); initAppts();
  if (window.CPPMail) CPPMail.mount($("email-panel"), {});
  initDV();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}
(function boot() {
  CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.prog." + CFG.slug + ".v1", sessionKey: "prog." + CFG.slug + ".user", onSignIn: (u) => { state.user = u; enterApp(); } });
  const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); }
})();

/* ---------------- domestic violence support notes ---------------- */
const DVKEY = "cpp.prog.women-helping-women.dv.v1";
function renderDV() {
  const items = store.get(DVKEY, []);
  $("dv-list").innerHTML = items.length ? items.map((x) =>
    `<li><strong>${esc(x.date)}</strong> — ${esc(x.member)}<br>${esc(x.shared)}${x.steps ? `<br><span class="hint">Support:</span> ${esc(x.steps)}` : ""}${x.referrals ? `<br><span class="hint">Referrals:</span> ${esc(x.referrals)}` : ""}${x.followup ? `<br><span class="hint">Follow-up:</span> ${esc(x.followup)}` : ""}<br><span class="hint">DV-${esc(x.id)} · entered by ${esc(x.by)}</span></li>`).join("")
    : '<li class="hint">No domestic violence notes yet.</li>';
}
function initDV() {
  $("dv-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const items = store.get(DVKEY, []);
    const n = items.length + 1;
    items.unshift({ id: String(n).padStart(4, "0"), date: $("dv-date").value, member: $("dv-member").value.trim(), shared: $("dv-shared").value.trim(), steps: $("dv-steps").value.trim(), referrals: $("dv-referrals").value.trim(), followup: $("dv-followup").value.trim(), by: state.user.name });
    store.set(DVKEY, items); e.target.reset(); renderDV();
    $("dv-msg").textContent = "DV note saved — confidential to this program.";
  });
  renderDV();
}

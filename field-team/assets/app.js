"use strict";
/* Centipede Peer to Peer, LLC — Field Team Dashboard (assets/app.js).
   The field team's staff workspace: today's assignments, field notes,
   supplies & needs, a quick-log into the Portal's shared Program
   Activity log, the company email app, the documents the team works
   from, and the Jarvis panel. Built Nov 19, 2026 at the CEO's
   direction. All stores are per-device localStorage, the same
   architecture as every Portal app.

   FIELD NOTES RULE (printed on the panel): no client names, no case
   details, no health information — client records live in the client
   binders. General areas, counts, and needs only. */
const CFG = window.FIELDTEAM_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { user: null };
const fmtDay = (d) => { if (!d) return ""; try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };
const today = () => new Date().toISOString().slice(0, 10);
const storeOf = (key) => ({
  get() { try { const v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : []; } catch { return []; } },
  set(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full/blocked — the panel still renders for this session */ } }
});

/* ---------------- Today's Assignments (cpp.fieldteam.assign.v1) ---------------- */
const assignStore = storeOf("cpp.fieldteam.assign.v1");
function drawAssigns() {
  const items = assignStore.get().slice().sort((a, b) => ((b.date || "") + (b.id || "")).localeCompare((a.date || "") + (a.id || "")));
  $("assign-list").innerHTML = items.length ? items.map((x) =>
    `<li><span class="badge badge-appt">${esc(x.status || "Assigned")}</span><span class="appt-when">${esc(fmtDay(x.date))}</span> — <strong>${esc(x.who)}</strong><br>${esc(x.work)}${x.area ? `<br><span class="hint">Area: ${esc(x.area)}</span>` : ""}<br><span class="hint">Posted by ${esc(x.by || "")}</span><div class="appt-actions"><button type="button" class="btn-small" data-adel="${esc(x.id)}">Remove</button></div></li>`).join("")
    : '<li class="hint">No assignments posted yet.</li>';
  document.querySelectorAll("[data-adel]").forEach((b) => b.addEventListener("click", () => { assignStore.set(assignStore.get().filter((x) => x.id !== b.dataset.adel)); drawAssigns(); }));
}
function wireAssigns() {
  $("assign-date").value = today();
  $("assign-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const who = $("assign-who").value.trim(), work = $("assign-work").value.trim();
    if (!who || !work || !$("assign-date").value) { $("assign-msg").textContent = "Who, the work, and a date are required."; return; }
    const items = assignStore.get();
    items.unshift({ id: "ASG-" + Date.now(), date: $("assign-date").value, who: who, area: $("assign-area").value.trim(), work: work, status: $("assign-status").value, by: state.user.name });
    assignStore.set(items);
    e.target.reset(); $("assign-date").value = today(); drawAssigns();
    $("assign-msg").textContent = "Assignment posted.";
  });
  drawAssigns();
}

/* ---------------- Field Notes (cpp.fieldteam.notes.v1) ---------------- */
const notesStore = storeOf("cpp.fieldteam.notes.v1");
function drawNotes() {
  const items = notesStore.get().slice().sort((a, b) => String(b.id).localeCompare(String(a.id)));
  $("note-list").innerHTML = items.length ? items.map((x) =>
    `<li><span class="appt-when">${esc(fmtDay(x.date))}</span> — <strong>${esc(x.author)}</strong><br>${esc(x.text)}<div class="appt-actions"><button type="button" class="btn-small" data-ndel="${esc(x.id)}">Remove</button></div></li>`).join("")
    : '<li class="hint">No field notes yet.</li>';
  document.querySelectorAll("[data-ndel]").forEach((b) => b.addEventListener("click", () => { notesStore.set(notesStore.get().filter((x) => x.id !== b.dataset.ndel)); drawNotes(); }));
}
function wireNotes() {
  $("note-date").value = today();
  $("note-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("note-text").value.trim();
    if (!text) { $("note-msg").textContent = "Write the note first."; return; }
    const items = notesStore.get();
    items.unshift({ id: "NOTE-" + Date.now(), date: $("note-date").value || today(), author: state.user.name, text: text });
    notesStore.set(items);
    e.target.reset(); $("note-date").value = today(); drawNotes();
    $("note-msg").textContent = "Field note saved.";
  });
  drawNotes();
}

/* ---------------- Supplies & Needs (cpp.fieldteam.supplies.v1) ---------------- */
const suppliesStore = storeOf("cpp.fieldteam.supplies.v1");
const SUPPLY_STATUSES = ["On Hand", "Running Low", "Needed", "Ordered"];
function drawSupplies() {
  const items = suppliesStore.get().slice().sort((a, b) => String(b.id).localeCompare(String(a.id)));
  $("supply-list").innerHTML = items.length ? items.map((x) =>
    `<li><strong>${esc(x.item)}</strong>${x.qty ? ` — ${esc(x.qty)}` : ""}<br><span class="hint">Logged by ${esc(x.by || "")} · ${esc(fmtDay(x.date))}</span><div class="appt-actions"><label class="hint">Status <select data-sstatus="${esc(x.id)}">${SUPPLY_STATUSES.map((s) => `<option${s === x.status ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></label><button type="button" class="btn-small" data-sdel="${esc(x.id)}">Remove</button></div></li>`).join("")
    : '<li class="hint">No supplies or needs logged yet.</li>';
  document.querySelectorAll("[data-sdel]").forEach((b) => b.addEventListener("click", () => { suppliesStore.set(suppliesStore.get().filter((x) => x.id !== b.dataset.sdel)); drawSupplies(); }));
  document.querySelectorAll("[data-sstatus]").forEach((sel) => sel.addEventListener("change", () => {
    const items = suppliesStore.get(); const x = items.find((y) => y.id === sel.dataset.sstatus);
    if (x) { x.status = sel.value; suppliesStore.set(items); }
  }));
}
function wireSupplies() {
  $("supply-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const item = $("supply-item").value.trim();
    if (!item) { $("supply-msg").textContent = "Name the item first."; return; }
    const items = suppliesStore.get();
    items.unshift({ id: "SUP-" + Date.now(), item: item, qty: $("supply-qty").value.trim(), status: $("supply-status").value, by: state.user.name, date: today() });
    suppliesStore.set(items);
    e.target.reset(); drawSupplies();
    $("supply-msg").textContent = "Logged.";
  });
  drawSupplies();
}

/* ---------------- Program Activity quick-log (shared cpp.portal.progact.v1) ----------------
   Entry shape matches portal/program-activity exactly:
   {id, program (slug), kind: done|updated|coming, date, text, by, at}. */
const progactStore = storeOf("cpp.portal.progact.v1");
const KINDS = { done: "Done", updated: "Updated", coming: "Coming Up" };
const progName = (slug) => (CFG.programs.find((p) => p.slug === slug) || {}).name || slug;
function drawRecentActivity() {
  const items = progactStore.get().slice().sort((a, b) => ((b.date || "") + String(b.id)).localeCompare((a.date || "") + String(a.id))).slice(0, 5);
  $("activity-recent").innerHTML = items.length ? items.map((e) =>
    `<li><span class="badge badge-appt">${esc(KINDS[e.kind] || e.kind)}</span><span class="appt-when">${esc(fmtDay(e.date))}</span> — ${esc(progName(e.program))}<br>${esc(e.text)}<br><span class="hint">Entered by ${esc(e.by || "")}</span></li>`).join("")
    : '<li class="hint">No activity entries on this device yet — the full log lives on the Program Activity page.</li>';
}
function wireActivity() {
  $("act-program").innerHTML = CFG.programs.map((p) => `<option value="${esc(p.slug)}"${p.slug === "homeless-outreach" ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  $("act-date").value = today();
  $("act-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("act-text").value.trim();
    if (!text) { $("act-msg").textContent = "Write the entry first — what was done, what changed, or what is coming up."; return; }
    const entries = progactStore.get();
    entries.unshift({ id: "ACT-" + Date.now(), program: $("act-program").value, kind: $("act-kind").value, date: $("act-date").value || today(), text: text, by: state.user.name, at: new Date().toLocaleString() });
    progactStore.set(entries);
    e.target.reset(); $("act-program").value = "homeless-outreach"; $("act-date").value = today(); drawRecentActivity();
    $("act-msg").textContent = "Entry added to the shared Program Activity log.";
  });
  drawRecentActivity();
}

/* ---------------- Documents ---------------- */
function renderDocs() {
  $("doc-list").innerHTML = CFG.documents.map((d) =>
    `<li><strong><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)}</a></strong><br><span class="hint">${esc(d.note)}</span></li>`).join("");
}

/* ---------------- enter ---------------- */
function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "The field team's workspace — today's assignments, field notes, supplies and needs, and the shared program activity log. Client records stay in the Client Dashboard and the locked binders, which are the official record.";
  wireAssigns();
  wireNotes();
  wireSupplies();
  wireActivity();
  renderDocs();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() {
  CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.fieldteam.v1", sessionKey: "fieldteam.user", onSignIn: (u) => { state.user = u; enterApp(); } });
  const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); }
})();

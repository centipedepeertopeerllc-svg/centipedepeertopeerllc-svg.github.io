"use strict";
/* Centipede Peer to Peer, LLC — Program Activity (assets/app.js).
   The Portal's program-by-program activity log (CPP-POL-2026-058):
   for every program — what we have done, what has been updated, and
   what is coming up. One shared store (cpp.portal.progact.v1) on this
   device, seeded from the record as it stood on November 19, 2026.
   PROGRAM-LEVEL INFORMATION ONLY: no client names, no client records,
   no case detail ever goes in this log. Built Nov 19, 2026 at the
   CEO's direction. */
const CFG = window.PROGACT_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { user: null, filter: "" };

const KEY = "cpp.portal.progact.v1";
const KINDS = { done: "Done", updated: "Updated", coming: "Coming Up" };
const progName = (slug) => (CFG.programs.find((p) => p.slug === slug) || {}).name || slug;
const fmtDay = (d) => { if (!d) return ""; try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };

function getEntries() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) { const v = JSON.parse(raw); if (Array.isArray(v)) return v; }
  } catch { /* fall through to seed */ }
  const seed = CFG.seedEntries.map((e, i) => ({ id: "SEED-" + (i + 1), program: e.program, kind: e.kind, date: e.date, text: e.text, by: e.by, at: e.date }));
  setEntries(seed);
  return seed;
}
function setEntries(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full/blocked — the log still renders for this session */ } }

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.progact.v1",
    sessionKey: "progact.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}

function renderPrograms() {
  const entries = getEntries();
  $("program-cards").innerHTML = CFG.programs.map((p) => {
    const mine = entries.filter((e) => e.program === p.slug);
    const latest = mine.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
    return `<div class="tile" style="display:block;padding:14px;border:1px solid #ccc;border-radius:10px;margin:0 0 12px 0;">
      <div style="display:flex;gap:14px;align-items:center;">
        <img src="${esc(p.seal)}" alt="${esc(p.name)} seal" width="64" height="64" style="border-radius:50%;">
        <span><strong style="font-size:1.08rem;">${esc(p.name)}</strong><br><span class="badge">${esc(p.status)}</span><br>
        <span class="hint">${mine.length} log entr${mine.length === 1 ? "y" : "ies"}${latest ? " · latest: " + esc(fmtDay(latest.date)) : ""}</span></span>
      </div>
      <div class="appt-actions">
        <button type="button" class="btn-small" data-view="${esc(p.slug)}">See this program's log</button>
        <a class="btn-small" href="${esc(p.url)}" target="_blank" rel="noopener">Open the program dashboard</a>
      </div>
    </div>`;
  }).join("");
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    state.filter = b.dataset.view;
    $("log-filter").value = state.filter;
    renderLog();
    $("log-panel").scrollIntoView();
  }));
}

function renderLog() {
  const entries = getEntries()
    .filter((e) => !state.filter || e.program === state.filter)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || String(b.id).localeCompare(String(a.id)));
  $("log-list").innerHTML = entries.length ? entries.map((e) =>
    `<li class="appt-item"><span class="badge badge-appt">${esc(KINDS[e.kind] || e.kind)}</span><span class="appt-when">${esc(fmtDay(e.date))}</span> — ${esc(progName(e.program))}<br>${esc(e.text)}<br><span class="hint">Entered by ${esc(e.by || "")}</span></li>`).join("")
    : '<li class="hint">No entries yet for this view.</li>';
  $("log-heading").textContent = state.filter ? "Activity log — " + progName(state.filter) : "Activity log — all programs";
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "Program by program: what we have done, what has been updated, and what is coming up. Add an entry the same day the work happens.";
  $("entry-program").innerHTML = CFG.programs.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join("");
  $("log-filter").innerHTML = '<option value="">All programs</option>' + CFG.programs.map((p) => `<option value="${esc(p.slug)}">${esc(p.name)}</option>`).join("");
  $("entry-date").value = new Date().toISOString().slice(0, 10);
  $("log-filter").addEventListener("change", () => { state.filter = $("log-filter").value; renderLog(); renderPrograms(); });
  $("entry-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("entry-text").value.trim();
    if (!text) { $("entry-msg").textContent = "Write the entry first — what was done, what changed, or what is coming up."; return; }
    const entries = getEntries();
    entries.unshift({ id: "ACT-" + Date.now(), program: $("entry-program").value, kind: $("entry-kind").value, date: $("entry-date").value, text: text, by: state.user.name, at: new Date().toLocaleString() });
    setEntries(entries);
    e.target.reset();
    $("entry-date").value = new Date().toISOString().slice(0, 10);
    state.filter = "";
    $("log-filter").value = "";
    renderPrograms(); renderLog();
    $("entry-msg").textContent = "Entry added to the log.";
  });
  renderPrograms();
  renderLog();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() { initLogin(); const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); } })();

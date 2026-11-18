"use strict";
/* Centipede Peer to Peer, LLC — IT Department Dashboard (assets/app.js).
   Maintenance, infrastructure, computers, cell phones, the use of Jarvis,
   and everything else that goes with IT — plus the company Email Center.
   Built Nov 18, 2026 at the CEO's direction. */
const CFG = window.IT_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const state = { user: null };

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.it.v1",
    sessionKey: "itdash.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}

function renderList(id, items) {
  $(id).innerHTML = items.map((x) =>
    `<li><strong>${esc(x.name || x.what)}</strong>${x.status ? " — " + esc(x.status) : ""}${x.when ? " — " + esc(x.when) : ""}<br><span class="hint">${esc(x.note || "")}</span></li>`).join("");
}

function renderLog() {
  const log = store.get("cpp.it.log.v1", []);
  $("log-list").innerHTML = log.length ? log.map((e) =>
    `<li><strong>${esc(e.id)}</strong> — ${esc(e.at)} · ${esc(e.area)}<br>${esc(e.text)}<br><span class="hint">Logged by ${esc(e.by)}</span></li>`).join("")
    : '<li class="hint">No maintenance entries yet.</li>';
}

function wireLogForm() {
  $("log-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const log = store.get("cpp.it.log.v1", []);
    const entry = { id: "IT-" + String(log.length + 1).padStart(4, "0"), at: new Date().toLocaleString(), area: $("log-area").value, text: $("log-text").value.trim(), by: state.user.name };
    if (!entry.text) { $("log-msg").textContent = "Write what was done, and it will be logged."; return; }
    log.unshift(entry); store.set("cpp.it.log.v1", log);
    $("log-msg").textContent = "Logged as " + entry.id + ".";
    e.target.reset(); renderLog();
  });
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "The IT Department's own dashboard — maintenance, infrastructure, computers, phones, and the company email center. The IT Department binder stays the official record.";
  renderList("systems-list", CFG.systems);
  renderList("devices-list", CFG.devices);
  renderList("jarvis-list", CFG.jarvis);
  renderList("maint-list", CFG.maintenance.map((m) => ({ name: m.when, note: m.what })));
  wireLogForm(); renderLog();
  if (window.CPPMail) CPPMail.mount($("email-center"), { addresses: CFG.addresses });
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() { initLogin(); const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); } })();

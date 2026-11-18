"use strict";
/* Centipede Peer to Peer, LLC — Board Dashboard (assets/app.js).
   The Board's own dashboard: the company files register, and program
   changes the Board may make — each change waits for the program lead's
   confirmation, and the lead's notification is written here the moment a
   change is entered or moved. Built Nov 18, 2026 at the CEO's direction. */
const CFG = window.BOARD_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const state = { user: null };
const CH_KEY = "cpp.board.changes.v1";
const NT_KEY = "cpp.board.notices.v1";

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.board.v1",
    sessionKey: "board.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}

function notify(lead, text) {
  const n = store.get(NT_KEY, []);
  n.unshift({ id: "NT-" + Date.now(), at: new Date().toLocaleString(), lead, text });
  store.set(NT_KEY, n);
}

function renderFiles() {
  $("file-list").innerHTML = CFG.files.map((f) =>
    `<li><strong>${esc(f.name)}</strong> — ${esc(f.where)}<br><span class="hint">${esc(f.note)}</span></li>`).join("");
}

function renderChanges() {
  const changes = store.get(CH_KEY, []);
  $("change-list").innerHTML = changes.length ? changes.map((c) =>
    `<li><strong>${esc(c.id)} · ${esc(c.program)}</strong> — ${esc(c.status)}<br>
     What changed: ${esc(c.changed)}<br>What needs to be fixed: ${esc(c.fix)}<br>What needs to go on: ${esc(c.goon)}<br>
     <span class="hint">Proposed by ${esc(c.by)} · Program lead: ${esc(c.lead)}${c.confirmedBy ? " · Confirmed by " + esc(c.confirmedBy) : ""}</span><br>
     ${c.status !== "Done" ? `<button data-confirm="${esc(c.id)}" type="button">Program lead confirms</button> <button data-done="${esc(c.id)}" type="button">Mark done</button>` : ""}
    </li>`).join("") : '<li class="hint">No program changes yet.</li>';
  document.querySelectorAll("[data-confirm]").forEach((b) => b.addEventListener("click", () => moveChange(b.dataset.confirm, "Confirmed by program lead")));
  document.querySelectorAll("[data-done]").forEach((b) => b.addEventListener("click", () => moveChange(b.dataset.done, "Done")));
  const notices = store.get(NT_KEY, []);
  $("notice-list").innerHTML = notices.length ? notices.map((n) =>
    `<li><strong>For ${esc(n.lead)}</strong> — ${esc(n.at)}<br>${esc(n.text)}</li>`).join("") : '<li class="hint">No notifications yet.</li>';
}

function moveChange(id, status) {
  const changes = store.get(CH_KEY, []);
  const c = changes.find((x) => x.id === id);
  if (!c) return;
  c.status = status;
  if (status.startsWith("Confirmed")) c.confirmedBy = state.user.name;
  store.set(CH_KEY, changes);
  notify(c.lead, id + " · " + c.program + " — status: " + status + ". What changed: " + c.changed + " What needs to be fixed: " + c.fix + " What needs to go on: " + c.goon);
  renderChanges();
}

function wireChangeForm() {
  $("program-select").innerHTML = CFG.programs.map((p) => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join("");
  $("change-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const prog = CFG.programs.find((p) => p.name === $("program-select").value);
    const changes = store.get(CH_KEY, []);
    const c = {
      id: "CHG-" + String(changes.length + 1).padStart(4, "0"),
      program: prog.name, lead: prog.lead,
      changed: $("f-changed").value.trim(), fix: $("f-fix").value.trim(), goon: $("f-goon").value.trim(),
      by: state.user.name, status: "Proposed — awaiting program lead confirmation", confirmedBy: ""
    };
    if (!c.changed) { $("change-msg").textContent = "Say what changed, and the change will be entered."; return; }
    changes.unshift(c); store.set(CH_KEY, changes);
    notify(c.lead, c.id + " · " + c.program + " — a change was proposed by " + c.by + ". What changed: " + c.changed + " What needs to be fixed: " + (c.fix || "—") + " What needs to go on: " + (c.goon || "—") + " The change waits for your confirmation.");
    $("change-msg").textContent = "Change " + c.id + " entered. The program lead's notification is written below, and the change waits for the lead's confirmation.";
    e.target.reset();
    renderChanges();
  });
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "The Board's own dashboard. Changes to a program wait for the program lead's confirmation — and the lead is notified here of what changed, what needs to be fixed, and what needs to go on.";
  renderFiles(); wireChangeForm(); renderChanges();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() { initLogin(); const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); } })();

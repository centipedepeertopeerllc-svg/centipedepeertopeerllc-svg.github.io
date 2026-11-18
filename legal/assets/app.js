"use strict";
/* Centipede Peer to Peer, LLC — Legal Department Portal (assets/app.js).
   Set up like the other company portals: the same sign-in (assets/auth.js),
   the same styles. Access: the CEO and Amber Bellante only (assets/config.js).
   Purpose (CEO direction, Nov 18, 2026): things can be SENT to the Legal
   Department and DOCUMENTED. An intake submission is documented here with
   a queue number and waits in the filing queue until the Record Keeper
   carries it into the Legal Binder (CPP-BND-2026-001) and marks it filed.
   The binder is the official record. Local Mode: until the Supabase step,
   queue entries live in this browser's local storage on this device. */
const CFG = window.LEGAL_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const QUEUE_KEY = "cpp.legal.queue.v1";
const state = { user: null };

function loadQueue() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch { return []; } }
function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
function nextId(q) { return "LEG-" + String(q.length + 1).padStart(4, "0"); }

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.legal.v1",
    sessionKey: "legaldash.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "Local Mode — this portal documents what is sent to the Legal Department and holds it in the filing queue on this device until the Record Keeper files it into the Legal Binder (CPP-BND-2026-001), which remains the official record.";
  renderRegister();
  renderQueue();
}

function renderRegister() {
  $("register-list").innerHTML = CFG.register.map((r) =>
    `<li><strong>${esc(r.tab)} — ${esc(r.title)}</strong><br><span class="hint">${esc(r.note)}</span></li>`).join("");
}

function renderQueue() {
  const q = loadQueue();
  if (!q.length) { $("queue-list").innerHTML = "<p class='hint'>Nothing has been sent yet. Submissions will be documented here.</p>"; return; }
  $("queue-list").innerHTML = q.slice().reverse().map((e) => `
    <article class="note-full">
      <div class="row-between"><strong>${esc(e.id)} — ${esc(e.matter)}</strong><span class="meta">${esc(e.status)}</span></div>
      <p class="meta">Sent by ${esc(e.from)} · ${esc(e.when)}</p>
      <p>${esc(e.description)}</p>
      ${e.docRef ? `<p class="meta">Document / reference: ${esc(e.docRef)}</p>` : ""}
      ${e.filedNote ? `<p class="meta">Filed: ${esc(e.filedNote)}</p>` : ""}
      ${(state.user.admin && e.status.startsWith("Queued")) ? `<button type="button" class="btn-small" data-file-id="${esc(e.id)}">Mark filed into the Legal Binder</button>` : ""}
    </article>`).join("");
  document.querySelectorAll("[data-file-id]").forEach((b) => b.addEventListener("click", () => markFiled(b.getAttribute("data-file-id"))));
}

function markFiled(id) {
  const q = loadQueue();
  const e = q.find((x) => x.id === id);
  if (!e) return;
  e.status = "Filed";
  e.filedNote = "Carried into the Legal Binder by the Record Keeper — " + new Date().toLocaleString();
  saveQueue(q); renderQueue();
}

function initIntake() {
  $("intake-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const q = loadQueue();
    const entry = {
      id: nextId(q),
      from: state.user ? state.user.name : "Unknown",
      when: new Date().toLocaleString(),
      matter: $("i-matter").value.trim(),
      description: $("i-desc").value.trim(),
      docRef: $("i-ref").value.trim(),
      status: "Queued — awaiting filing into the Legal Binder"
    };
    if (!entry.matter || !entry.description) return;
    q.push(entry); saveQueue(q);
    $("intake-form").reset();
    $("save-status").textContent = "Documented as " + entry.id + " and placed in the filing queue.";
    renderQueue();
  });
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() { initLogin(); initIntake(); const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); } })();

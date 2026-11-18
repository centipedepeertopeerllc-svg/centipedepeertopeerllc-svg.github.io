"use strict";
/* Centipede Peer to Peer, LLC — Clients Without Insurance Dashboard. */
const CFG = window.UNINSURED_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }, set(k, v) { localStorage.setItem(k, JSON.stringify(v)); } };
const state = { user: null };
function render() {
  const items = store.get("cpp.uninsured.v1", []);
  $("u-list").innerHTML = items.length ? items.map((x) =>
    `<li><strong>${esc(x.id)} — ${esc(x.client)}</strong> (${esc(x.clientId)}) · ${esc(x.program)}<br><span class="hint">Why no coverage:</span> ${esc(x.why)}<br><span class="hint">Coverage goal:</span> ${esc(x.goal)} · <span class="hint">Application:</span> ${esc(x.appStatus)} ${esc(x.appDate)}<br><span class="hint">Next step:</span> ${esc(x.next)} · <span class="hint">Worker:</span> ${esc(x.worker)}<br><span class="hint">Entered by ${esc(x.by)}</span> <button type="button" data-del="${esc(x.id)}">Remove</button></li>`).join("")
    : '<li class="hint">No clients entered yet.</li>';
  document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { store.set("cpp.uninsured.v1", store.get("cpp.uninsured.v1", []).filter((x) => x.id !== b.dataset.del)); render(); }));
}
function enterApp() {
  $("login-screen").hidden = true; $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "Clients without insurance — kept separate from the Insurance Dashboard so the coverage work stays clear. There are no payments and no billing for the clients on this dashboard: they are handled here, and the work is getting them covered. Client information stays under the client-records rule.";
  $("u-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const items = store.get("cpp.uninsured.v1", []);
    items.unshift({ id: "UNI-" + String(items.length + 1).padStart(4, "0"), client: $("u-client").value.trim(), clientId: $("u-clientid").value.trim(), program: $("u-program").value.trim(), why: $("u-why").value.trim(), goal: $("u-goal").value, appStatus: $("u-appstatus").value, appDate: $("u-appdate").value, next: $("u-next").value.trim(), worker: $("u-worker").value.trim(), by: state.user.name });
    store.set("cpp.uninsured.v1", items); e.target.reset(); render();
    $("u-msg").textContent = "Client added to the coverage list.";
  });
  render();
  if (window.CPPMail) CPPMail.mount($("email-panel"), {});
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}
(function boot() {
  CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.uninsured.v1", sessionKey: "uninsdash.user", onSignIn: (u) => { state.user = u; enterApp(); } });
  const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); }
})();

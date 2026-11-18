"use strict";
/* Centipede Peer to Peer, LLC — Company Portal (assets/app.js).
   One company-wide front door: sign in once (same username, password, and
   2FA as the dashboards) and every dashboard is one tap away, app-style.
   Built Nov 18, 2026 at the CEO's direction. */
const CFG = window.PORTAL_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { user: null };

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.portal.v1",
    sessionKey: "portal.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}


function renderCalendar() {
  const KEY = "cpp.portal.cal.v1";
  const get = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const set = (v) => localStorage.setItem(KEY, JSON.stringify(v));
  const sel = $("cal-program");
  sel.innerHTML = '<option value="">All programs — shared view</option>' + CFG.programs.map((p) => `<option>${esc(p.name)}</option>`).join("");
  $("cal-book").innerHTML = CFG.programs.map((p) => `<option>${esc(p.name)}</option>`).join("");
  const draw = () => {
    const f = sel.value;
    const items = get().filter((x) => !f || x.program === f).sort((x, y) => (x.when || "").localeCompare(y.when || ""));
    $("cal-list").innerHTML = items.length ? items.map((x) =>
      `<li><strong>${esc(x.when)}</strong> — ${esc(x.program)}<br>Client: ${esc(x.client)} · With: ${esc(x.with)}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)})</span> <button type="button" data-del="${esc(x.id)}">Remove</button></li>`).join("")
      : '<li class="hint">No appointments on this calendar yet.</li>';
    document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { set(get().filter((x) => x.id !== b.dataset.del)); draw(); }));
  };
  sel.addEventListener("change", draw);
  $("cal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const items = get();
    items.unshift({ id: "APT-" + Date.now(), program: $("cal-book").value, client: $("cal-client").value.trim(), when: $("cal-when").value, with: $("cal-with").value.trim(), note: $("cal-note").value.trim(), by: state.user.name });
    set(items); e.target.reset(); draw();
    $("cal-msg").textContent = "Appointment added — every employee can see it and make changes.";
  });
  draw();
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "One front door for the whole company. Your sign-in here is the same username, password, and two-factor authentication as the dashboards.";
  if (state.user.admin) {
    $("admin-note").hidden = false;
    $("admin-note").innerHTML = "<strong>Administrator — all dashboards.</strong> You are the administrator of every Centipede dashboard. User access controls live inside each dashboard under \"Admin — user access\" when you sign in there with this same sign-in.";
  }
  $("tiles").innerHTML = CFG.tiles.filter((t) => !t.adminOnly || state.user.admin).map((t) =>
    `<a class="tile" href="${esc(t.url)}" style="display:block;padding:18px;border:1px solid #ccc;border-radius:10px;text-decoration:none;margin:0 0 12px 0;">
       <strong style="font-size:1.15rem;">${esc(t.name)}</strong><br><span class="hint">${esc(t.note)}</span>
     </a>`).join("");
  $("program-list").innerHTML = CFG.programs.map((p) =>
    `<a class="tile" href="${esc(p.url)}" style="display:flex;gap:14px;align-items:center;padding:12px;border:1px solid #ccc;border-radius:10px;text-decoration:none;margin:0 0 12px 0;">
       <img src="${esc(p.seal)}" alt="${esc(p.name)} seal" width="72" height="72" style="border-radius:50%;">
       <span><strong style="font-size:1.1rem;">${esc(p.name)}</strong><br><span class="hint">${esc(p.status)}</span></span>
     </a>`).join("");
  renderCalendar();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() { initLogin(); const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); } })();

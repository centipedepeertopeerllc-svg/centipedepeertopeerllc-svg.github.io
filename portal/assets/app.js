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
  sel.innerHTML = '<option value="">All programs \u2014 shared view</option>' + CFG.programs.map((p) => `<option>${esc(p.name)}</option>`).join("");
  $("cal-book").innerHTML = CFG.programs.map((p) => `<option>${esc(p.name)}</option>`).join("");
  $("appt-program").innerHTML = CFG.programs.map((p) => `<option>${esc(p.name)}</option>`).join("");
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
  let editCalId = null, editApptId = null;
  const setEditUI = (form, on, submitId, cancelId, delId, addLabel) => {
    $(submitId).textContent = on ? "Save changes" : addLabel;
    $(cancelId).hidden = !on; $(delId).hidden = !on;
  };
  const exitCalEdit = () => { editCalId = null; $("cal-form").reset(); setEditUI(null, false, "cal-submit", "cal-cancel", "cal-del", "Add appointment"); };
  const exitApptEdit = () => { editApptId = null; $("appt-form").reset(); setEditUI(null, false, "appt-submit", "appt-cancel", "appt-del", "Add client appointment"); };
  const draw = () => {
    if (editCalId && !get().some((x) => x.id === editCalId)) exitCalEdit();
    if (editApptId && !get().some((x) => x.id === editApptId)) exitApptEdit();
    const f = sel.value;
    const items = get().filter((x) => !f || x.program === f).sort((x, y) => (x.when || "").localeCompare(y.when || ""));
    $("cal-list").innerHTML = items.length ? items.map((x) => x.type === "client-appointment"
      ? `<li class="appt-item"><span class="badge badge-appt">Client Appointment</span><span class="appt-when">${esc(fmtDay(x.date))}${x.start ? " \u00b7 " + fmtT(x.start) + (x.end ? "\u2013" + fmtT(x.end) : "") : ""}</span> \u2014 ${esc(x.program)}<br><span class="appt-client">Client: <strong>${esc(x.client)}</strong></span> \u00b7 With: ${esc(x.staff || "")}${x.purpose ? `<br>For: ${esc(x.purpose)}` : ""}${x.location ? `<br>Location: ${esc(x.location)}` : ""}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)}${x.editedBy ? " \u00b7 edited by " + esc(x.editedBy) : ""})</span><div class="appt-actions"><a class="btn-small" href="${esc(smsHref(x))}">Text this appointment</a><button type="button" class="btn-small" data-aedit="${esc(x.id)}">Edit</button><button type="button" class="btn-small" data-del="${esc(x.id)}">Remove</button></div></li>`
      : `<li><strong>${esc(x.when)}</strong> \u2014 ${esc(x.program)}<br>Client: ${esc(x.client)} \u00b7 With: ${esc(x.with)}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by)}${x.editedBy ? " \u00b7 edited by " + esc(x.editedBy) : ""})</span><div class="appt-actions"><button type="button" class="btn-small" data-edit="${esc(x.id)}">Edit</button><button type="button" class="btn-small" data-del="${esc(x.id)}">Remove</button></div></li>`).join("")
      : '<li class="hint">No appointments on this calendar yet.</li>';
    document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { set(get().filter((x) => x.id !== b.dataset.del)); draw(); }));
    document.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => {
      const x = get().find((y) => y.id === b.dataset.edit); if (!x) return;
      editCalId = x.id;
      $("cal-book").value = x.program || ""; $("cal-client").value = x.client || ""; $("cal-when").value = x.when || ""; $("cal-with").value = x.with || ""; $("cal-note").value = x.note || "";
      setEditUI(null, true, "cal-submit", "cal-cancel", "cal-del", "Add appointment");
      $("cal-msg").textContent = "Editing this entry \u2014 change the fields and Save changes, or Cancel.";
      $("cal-form").scrollIntoView();
    }));
    document.querySelectorAll("[data-aedit]").forEach((b) => b.addEventListener("click", () => {
      const x = get().find((y) => y.id === b.dataset.aedit); if (!x) return;
      editApptId = x.id;
      $("appt-client").value = x.client || ""; $("appt-program").value = x.program || ""; $("appt-staff").value = x.staff || "";
      $("appt-date").value = x.date || ""; $("appt-start").value = x.start || ""; $("appt-end").value = x.end || "";
      $("appt-location").value = x.location || ""; $("appt-purpose").value = x.purpose || ""; $("appt-note").value = x.note || "";
      setEditUI(null, true, "appt-submit", "appt-cancel", "appt-del", "Add client appointment");
      $("appt-msg").textContent = "Editing this appointment \u2014 change the fields and Save changes, or Cancel.";
      $("appt-form").scrollIntoView();
    }));
  };
  sel.addEventListener("change", draw);
  $("cal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const items = get();
    if (editCalId) {
      const x = items.find((y) => y.id === editCalId);
      if (x) { x.program = $("cal-book").value; x.client = $("cal-client").value.trim(); x.when = $("cal-when").value; x.with = $("cal-with").value.trim(); x.note = $("cal-note").value.trim(); x.editedBy = state.user.name; set(items); }
      exitCalEdit(); draw();
      $("cal-msg").textContent = "Appointment updated.";
    } else {
      items.unshift({ id: "APT-" + Date.now(), program: $("cal-book").value, client: $("cal-client").value.trim(), when: $("cal-when").value, with: $("cal-with").value.trim(), note: $("cal-note").value.trim(), by: state.user.name });
      set(items); e.target.reset(); draw();
      $("cal-msg").textContent = "Appointment added \u2014 every employee can see it and make changes.";
    }
  });
  $("cal-cancel").addEventListener("click", () => { exitCalEdit(); $("cal-msg").textContent = "Edit cancelled."; });
  $("cal-del").addEventListener("click", () => { if (editCalId) { set(get().filter((x) => x.id !== editCalId)); exitCalEdit(); draw(); $("cal-msg").textContent = "Entry deleted."; } });
  $("appt-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = $("appt-date").value, start = $("appt-start").value, end = $("appt-end").value;
    const items = get();
    if (editApptId) {
      const x = items.find((y) => y.id === editApptId);
      if (x) { x.program = $("appt-program").value; x.client = $("appt-client").value.trim(); x.staff = $("appt-staff").value.trim(); x.date = date; x.start = start; x.end = end; x.when = date + "T" + (start || "00:00"); x.location = $("appt-location").value.trim(); x.purpose = $("appt-purpose").value.trim(); x.note = $("appt-note").value.trim(); x.editedBy = state.user.name; set(items); }
      exitApptEdit(); draw();
      $("appt-msg").textContent = "Client appointment updated.";
    } else {
      items.unshift({ id: "CAPT-" + Date.now(), type: "client-appointment", program: $("appt-program").value, client: $("appt-client").value.trim(), staff: $("appt-staff").value.trim(), date: date, start: start, end: end, when: date + "T" + (start || "00:00"), location: $("appt-location").value.trim(), purpose: $("appt-purpose").value.trim(), note: $("appt-note").value.trim(), by: state.user.name });
      set(items); e.target.reset(); draw();
      $("appt-msg").textContent = "Client appointment added \u2014 scheduling record only; it does not notify anyone.";
    }
  });
  $("appt-cancel").addEventListener("click", () => { exitApptEdit(); $("appt-msg").textContent = "Edit cancelled."; });
  $("appt-del").addEventListener("click", () => { if (editApptId) { set(get().filter((x) => x.id !== editApptId)); exitApptEdit(); draw(); $("appt-msg").textContent = "Client appointment deleted."; } });
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

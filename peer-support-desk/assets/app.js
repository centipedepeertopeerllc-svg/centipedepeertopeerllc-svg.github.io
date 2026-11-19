"use strict";
/* Centipede Peer to Peer, LLC — Peer Support Dashboard (assets/app.js).
   Tom Clark's staff workspace: what he needs before his start, his client
   assignments (assignment-level only), his client appointments, the
   documents he works from, and the Jarvis panel. Built Nov 19, 2026 at
   the CEO's direction (CPP-POL-2026-056).

   Appointments: this desk reads and writes the SAME shared appointment
   store as the Portal and the program dashboards (cpp.portal.cal.v1),
   filtered to appointments whose staff is Tom. Add, edit, delete, and
   "Text this appointment" behave exactly as in the Portal calendar
   (CPP-POL-2026-054 governs). Sharing scope is the local-mode scope:
   across the apps on the same device and browser. */
const CFG = window.PEER_DESK_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { user: null };

function renderSeedList(id, items) {
  $(id).innerHTML = items.map((x) =>
    `<li><strong>${esc(x.name)}</strong><br><span class="hint">${esc(x.note)}</span>${x.url ? `<br><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.linkText || "Open")}</a>` : ""}</li>`).join("");
}
function renderDocs() {
  $("doc-list").innerHTML = CFG.documents.map((d) =>
    `<li><strong><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)}</a></strong><br><span class="hint">${esc(d.note)}</span></li>`).join("");
}

/* ---------------- Tom's client appointments (shared store) ---------------- */
const CAL_KEY = "cpp.portal.cal.v1";
const calGet = () => { try { return JSON.parse(localStorage.getItem(CAL_KEY)) || []; } catch { return []; } };
const calSet = (v) => localStorage.setItem(CAL_KEY, JSON.stringify(v));
const isToms = (x) => x && x.type === "client-appointment" && /tom|clark/i.test(x.staff || "");
const fmtT = (t) => { if (!t) return ""; const p = t.split(":").map(Number); const ap = p[0] >= 12 ? "PM" : "AM"; return (p[0] % 12 || 12) + ":" + String(p[1] || 0).padStart(2, "0") + " " + ap; };
const fmtDay = (d) => { if (!d) return ""; try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }); } catch { return d; } };
function smsHref(x) {
  const lines = ["Centipede Peer to Peer — Client Appointment", "Client: " + (x.client || "")];
  if (x.purpose) lines.push("For: " + x.purpose);
  lines.push("When: " + fmtDay(x.date) + (x.start ? " · " + fmtT(x.start) + (x.end ? "–" + fmtT(x.end) : "") : ""));
  lines.push("Program: " + (x.program || ""));
  if (x.staff) lines.push("Staff: " + x.staff);
  if (x.location) lines.push("Location: " + x.location);
  return "sms:2098713939?&body=" + encodeURIComponent(lines.join("\n"));
}
let editApptId = null;
function setApptEditUI(on) {
  $("appt-submit").textContent = on ? "Save changes" : "Add client appointment";
  $("appt-cancel").hidden = !on; $("appt-del").hidden = !on;
}
function exitApptEdit() { editApptId = null; $("appt-form").reset(); $("appt-staff").value = "Tom Clark"; setApptEditUI(false); }
function drawAppts() {
  if (editApptId && !calGet().some((x) => x.id === editApptId)) exitApptEdit();
  const items = calGet().filter(isToms).sort((a, b) => ((a.date || "") + (a.start || "")).localeCompare((b.date || "") + (b.start || "")));
  $("appt-list").innerHTML = items.length ? items.map((x) =>
    `<li class="appt-item"><span class="badge badge-appt">Client Appointment</span><span class="appt-when">${esc(fmtDay(x.date))}${x.start ? " · " + fmtT(x.start) + (x.end ? "–" + fmtT(x.end) : "") : ""}</span> — ${esc(x.program)}<br><span class="appt-client">Client: <strong>${esc(x.client)}</strong></span> · With: ${esc(x.staff || "")}${x.purpose ? `<br>For: ${esc(x.purpose)}` : ""}${x.location ? `<br>Location: ${esc(x.location)}` : ""}<br><span class="hint">${esc(x.note || "")} (entered by ${esc(x.by || "")}${x.editedBy ? " · edited by " + esc(x.editedBy) : ""})</span><div class="appt-actions"><a class="btn-small" href="${esc(smsHref(x))}">Text this appointment</a><button type="button" class="btn-small" data-aedit="${esc(x.id)}">Edit</button><button type="button" class="btn-small" data-del="${esc(x.id)}">Remove</button></div></li>`).join("")
    : '<li class="hint">No client appointments scheduled.</li>';
  document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => { calSet(calGet().filter((x) => x.id !== b.dataset.del)); drawAppts(); }));
  document.querySelectorAll("[data-aedit]").forEach((b) => b.addEventListener("click", () => {
    const x = calGet().find((y) => y.id === b.dataset.aedit); if (!x) return;
    editApptId = x.id;
    $("appt-client").value = x.client || ""; $("appt-program").value = x.program || "1-on-1 Peer Support"; $("appt-staff").value = x.staff || "Tom Clark";
    $("appt-date").value = x.date || ""; $("appt-start").value = x.start || ""; $("appt-end").value = x.end || "";
    $("appt-location").value = x.location || ""; $("appt-purpose").value = x.purpose || ""; $("appt-note").value = x.note || "";
    setApptEditUI(true);
    $("appt-msg").textContent = "Editing this appointment — change the fields and Save changes, or Cancel.";
    $("appt-form").scrollIntoView();
  }));
}
function wireAppts() {
  $("appt-program").innerHTML = CFG.programs.map((p) => `<option>${esc(p)}</option>`).join("");
  $("appt-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const items = calGet();
    const read = () => ({
      client: $("appt-client").value.trim(), program: $("appt-program").value, staff: $("appt-staff").value.trim() || "Tom Clark",
      date: $("appt-date").value, start: $("appt-start").value, end: $("appt-end").value,
      location: $("appt-location").value.trim(), purpose: $("appt-purpose").value.trim(), note: $("appt-note").value.trim()
    });
    if (editApptId) {
      const x = items.find((y) => y.id === editApptId);
      if (x) { Object.assign(x, read()); x.editedBy = state.user.name; calSet(items); }
      exitApptEdit(); drawAppts();
      $("appt-msg").textContent = "Appointment updated.";
    } else {
      const v = read();
      if (!v.client || !v.date) { $("appt-msg").textContent = "A client name and a date are required."; return; }
      items.unshift(Object.assign({ id: "APT-" + Date.now(), type: "client-appointment", by: state.user.name }, v));
      calSet(items); e.target.reset(); $("appt-staff").value = "Tom Clark"; drawAppts();
      $("appt-msg").textContent = "Appointment added — it is on the shared calendar in the Portal and the program dashboard too.";
    }
  });
  $("appt-cancel").addEventListener("click", () => { exitApptEdit(); $("appt-msg").textContent = "Edit cancelled."; });
  $("appt-del").addEventListener("click", () => { if (editApptId) { calSet(calGet().filter((x) => x.id !== editApptId)); exitApptEdit(); drawAppts(); $("appt-msg").textContent = "Appointment deleted."; } });
  drawAppts();
}

/* ---------------- enter ---------------- */
function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "Tom Clark's staff workspace — his clients, his appointments, his documents, and Jarvis. Client records themselves stay in the Client Dashboard and the locked binders, which are the official record.";
  renderSeedList("needs-list", CFG.needsTom);
  renderSeedList("client-list", CFG.myClients);
  renderDocs();
  wireAppts();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() {
  CPPAuth.mount({ seedUsers: CFG.users, storeKey: "cpp.auth.peerdesk.v1", sessionKey: "peerdesk.user", onSignIn: (u) => { state.user = u; enterApp(); } });
  const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); }
})();

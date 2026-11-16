"use strict";
/* Centipede Peer to Peer, LLC — HR Dashboard.
   Pattern follows the DAP Noting Dashboard exactly:
   - No HR data renders before login; the pre-login page holds only the
     login card.
   - Member-view rule: a signed-in user sees ONLY their own record
     (filtered on their employeeId). Users with seeAll (the CEO,
     employeeId 2001, and Jarvis as HR administrator) see every record.
   - Saved records are never edited or deleted in this UI. Corrections
     are new, dated addendum rows pointing at the original.
   - Every row carries author + timestamps (source-traced).
   - Saves are serialized through one queue; the queue flushes on
     pagehide / visibilitychange, and data refreshes on focus / open. */
const CFG = window.HR_CONFIG;
const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  mode: "local",            // "supabase" once the hr_records table answers
  records: [],              // all rows loaded for the signed-in session
  selectedEmployeeId: null,
  saveChain: Promise.resolve(),
  outbox: []                // rows waiting to reach Supabase
};

const LS_RECORDS = "hrdash.records.v1";
const LS_OUTBOX = "hrdash.outbox.v1";

/* ---------------- utilities ---------------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
const fmtDT = (iso) => { try { return new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }); } catch { return iso || ""; } };
const fmtD = (iso) => { try { return new Date(iso + (iso && iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }); } catch { return iso || ""; } };
async function sha256Hex(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return sha256Pure(text); // fallback for non-secure contexts (no crypto.subtle)
}
/* Compact pure-JS SHA-256 (public-domain style implementation), used only
   when WebCrypto is unavailable. Access codes are low-value page gates;
   the database policies are the real wall — see README. */
function sha256Pure(ascii) {
  function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
  const maxWord = Math.pow(2, 32);
  let result = "";
  const words = [], asciiBitLength = ascii.length * 8;
  let hash = (sha256Pure.h = sha256Pure.h || []), k = (sha256Pure.k = sha256Pure.k || []);
  let primeCounter = k.length, isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (let i = 0; i < ascii.length; i++) {
    const code = ascii.charCodeAt(i);
    if (code >> 8) return sha256Pure(new TextEncoder().encode(ascii).reduce((s, b) => s + String.fromCharCode(b), ""));
    words[i >> 2] |= code << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16)), oldHash = hash;
    hash = hash.slice(0, 8);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = i < 16 ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}
function setStatus(msg) { const el = $("save-status"); if (el) el.textContent = msg; }

/* ---------------- member-view rule ---------------- */
function visiblePeople() {
  if (state.user && state.user.seeAll) return CFG.people;
  return CFG.people.filter((p) => state.user && p.employeeId === state.user.employeeId);
}
function canSee(employeeId) {
  return visiblePeople().some((p) => p.employeeId === employeeId);
}
function visibleRecords() {
  // Rows for people this user may not see are never rendered.
  return state.records.filter((r) => canSee(r.employee_id));
}

/* ---------------- Supabase REST layer (publishable key only) ---------------- */
function sbHeaders(extra = {}) {
  return Object.assign({
    apikey: CFG.supabasePublishableKey,
    Authorization: "Bearer " + CFG.supabasePublishableKey,
    "Content-Type": "application/json"
  }, extra);
}
async function sbFetchRecords() {
  const res = await fetch(`${CFG.supabaseUrl}/rest/v1/${CFG.table}?select=*&order=created_at.desc`, { headers: sbHeaders() });
  if (!res.ok) throw new Error("Supabase records fetch failed: " + res.status);
  return res.json();
}
async function sbInsertRecord(row) {
  const res = await fetch(`${CFG.supabaseUrl}/rest/v1/${CFG.table}`, {
    method: "POST",
    headers: sbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify(row)
  });
  if (!res.ok) throw new Error("Supabase insert failed: " + res.status + " " + (await res.text()).slice(0, 200));
  const data = await res.json();
  return data[0] || row;
}

/* ---------------- local store ---------------- */
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_RECORDS) || "[]"); } catch { return []; }
}
function saveLocal(records) { localStorage.setItem(LS_RECORDS, JSON.stringify(records)); }
function loadOutbox() { try { return JSON.parse(localStorage.getItem(LS_OUTBOX) || "[]"); } catch { return []; } }
function saveOutbox() { localStorage.setItem(LS_OUTBOX, JSON.stringify(state.outbox)); }

/* ---------------- data loading ---------------- */
async function refreshRecords(quiet = false) {
  let remote = null;
  try { remote = await sbFetchRecords(); } catch { remote = null; }
  if (remote) {
    state.mode = "supabase";
    const remoteIds = new Set(remote.map((r) => r.id));
    const localOnly = loadLocal().filter((r) => !remoteIds.has(r.id));
    state.records = [...remote, ...localOnly].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    saveLocal(state.records);
  } else {
    state.mode = "local";
    state.records = loadLocal().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  renderBanner();
  renderPeople();
  renderPerson();
  if (!quiet) setStatus("");
}

/* ---------------- serialized save queue ---------------- */
function enqueueSave(row) {
  state.saveChain = state.saveChain.then(() => persistRow(row)).catch(() => persistRow(row));
  return state.saveChain;
}
async function persistRow(row) {
  setStatus("Saving…");
  // Always keep a local copy first, so nothing is lost if the network drops.
  const local = loadLocal();
  if (!local.some((r) => r.id === row.id)) { local.unshift(row); saveLocal(local); }
  state.records = [row, ...state.records.filter((r) => r.id !== row.id)];
  if (state.mode === "supabase") {
    try {
      const saved = await sbInsertRecord(row);
      const idx = state.records.findIndex((r) => r.id === row.id);
      if (idx >= 0) state.records[idx] = saved;
      saveLocal(state.records);
      setStatus("Saved ✓ " + fmtDT(saved.created_at || row.created_at));
    } catch {
      state.outbox.push(row); saveOutbox();
      setStatus("Saved on this device — will send to the database when it answers. Do not clear browser data.");
    }
  } else {
    state.outbox.push(row); saveOutbox();
    setStatus("Saved on this device (database table not connected yet — see README).");
  }
  renderPerson();
}
async function flushOutbox() {
  if (!state.outbox.length) return;
  try { await sbFetchRecords(); } catch { return; } // database still unreachable
  const pending = [...state.outbox];
  state.outbox = []; saveOutbox();
  for (const row of pending) {
    try { await sbInsertRecord(row); }
    catch { state.outbox.push(row); saveOutbox(); }
  }
  if (!state.outbox.length) { state.mode = "supabase"; await refreshRecords(true); }
}

/* ---------------- login ---------------- */
function initLogin() {
  const sel = $("login-user");
  sel.innerHTML = CFG.users.map((u) => `<option value="${esc(u.name)}">${esc(u.name)} — ${esc(u.role)}</option>`).join("");
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = CFG.users.find((u) => u.name === sel.value);
    const hash = await sha256Hex($("login-pin").value.trim());
    if (!user || hash !== user.accessCodeSha256) {
      $("login-error").textContent = "That name and access code do not match. Check the code and try once more, carefully.";
      return;
    }
    state.user = user;
    sessionStorage.setItem("hrdash.user", user.name);
    enterApp();
  });
}
async function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  buildApp();
  state.outbox = loadOutbox();
  await refreshRecords();
  flushOutbox();
}

/* ---------------- app build ---------------- */
function buildApp() {
  const people = visiblePeople();
  state.selectedEmployeeId = people.length ? people[0].employeeId : null;
  $("people-scope").textContent = state.user.seeAll
    ? "You can see every record (HR administrator view)."
    : "You can see only your own record.";

  const pol = $("p-policy");
  pol.innerHTML = CFG.policies.map((p) => `<option>${esc(p)}</option>`).join("");

  $("refresh-btn").addEventListener("click", () => refreshRecords());
  $("logout-btn").addEventListener("click", () => { sessionStorage.removeItem("hrdash.user"); location.reload(); });
  $("time-form").addEventListener("submit", onSaveTime);
  $("doc-form").addEventListener("submit", onSaveDoc);
  $("policy-form").addEventListener("submit", onSavePolicy);
  $("addendum-form").addEventListener("submit", onSaveAddendum);
  $("addendum-cancel").addEventListener("click", () => { $("addendum-form").hidden = true; });

  // Save-reliability standard: flush on leave, refresh on return.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOutbox();
    if (document.visibilityState === "visible") refreshRecords(true);
  });
  window.addEventListener("pagehide", () => flushOutbox());
  window.addEventListener("focus", () => refreshRecords(true));
}

function renderBanner() {
  const b = $("mode-banner");
  if (state.mode === "supabase") {
    b.className = "banner ok";
    b.textContent = "Connected to the Centipede database (Supabase). HR records save to the database and are source-traced to their author.";
  } else {
    b.className = "banner warn";
    b.textContent = "LOCAL MODE: the database table (hr_records) is not connected yet, so records are stored only on this device. Run the one-step SQL in the supabase folder (see README) to connect the database — do not enter real HR records until Levi confirms the database is connected.";
  }
}

/* ---------------- people list & person view ---------------- */
function renderPeople() {
  const wrap = $("people-list");
  wrap.innerHTML = "";
  for (const p of visiblePeople()) {
    const div = document.createElement("div");
    div.className = "person-card" + (p.employeeId === state.selectedEmployeeId ? " active" : "");
    div.innerHTML = `<strong>${esc(p.name)}</strong>
      <div class="meta">Employee ID ${esc(p.employeeId)} · ${esc(p.role)}</div>
      ${p.startDate ? `<div class="meta">Start date: ${esc(p.startDate)}</div>` : ""}`;
    div.addEventListener("click", () => {
      state.selectedEmployeeId = p.employeeId;
      $("time-form").hidden = true; $("doc-form").hidden = true; $("policy-form").hidden = true; $("addendum-form").hidden = true;
      renderPeople(); renderPerson();
    });
    wrap.appendChild(div);
  }
}

function recordsFor(employeeId, type) {
  return visibleRecords().filter((r) => r.employee_id === employeeId && r.record_type === type)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
function addendaFor(parentId) {
  return visibleRecords().filter((r) => r.record_type === "addendum" && r.payload && r.payload.parent_record_id === parentId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}
function recordLine(r, mainHtml) {
  const adds = addendaFor(r.id);
  return `<li><strong>${mainHtml}</strong>
    <div class="meta">By ${esc(r.author)} · entered ${esc(fmtDT(r.created_at))}</div>
    ${adds.map((a) => `<div class="meta">Addendum ${esc(fmtDT(a.created_at))} — ${esc(a.author)}: ${esc(a.payload.text || "")}</div>`).join("")}
    <div><button class="btn-small btn-addendum" type="button" data-id="${esc(r.id)}">Add a dated correction / addendum</button></div></li>`;
}

function renderPerson() {
  const view = $("person-view");
  const person = visiblePeople().find((p) => p.employeeId === state.selectedEmployeeId);
  if (!person) { view.innerHTML = "<p>No record available.</p>"; return; }

  const times = recordsFor(person.employeeId, "time_entry");
  const docs = recordsFor(person.employeeId, "document");
  const acks = recordsFor(person.employeeId, "policy_ack");
  const seedDocs = CFG.documentsSeed.filter((d) => d.employeeId === person.employeeId);

  const totalHours = times.reduce((sum, r) => sum + (parseFloat(r.payload && r.payload.hours) || 0), 0);

  view.innerHTML = `
    <h2>${esc(person.name)}</h2>
    <p class="meta">Employee ID ${esc(person.employeeId)} · ${esc(person.role)}${person.startDate ? " · Start date: " + esc(person.startDate) : ""}</p>
    <p class="no-print">
      <button class="btn-small" id="btn-show-time" type="button">Add a time entry</button>
      <button class="btn-small" id="btn-show-doc" type="button">Add a register entry</button>
      <button class="btn-small" id="btn-show-policy" type="button">Acknowledge a policy</button>
      <button class="btn-small" id="btn-print" type="button">Print this record</button>
    </p>

    <h3 class="section-head">Time Entries</h3>
    ${times.length ? `<p class="meta">Total hours recorded: ${esc(totalHours.toFixed(2))}</p>
    <ul class="record-list">${times.map((r) => recordLine(r, `${esc(fmtD(r.payload.date || r.created_at))} — ${esc(r.payload.hours)} hours — ${esc(r.payload.description || "")}`)).join("")}</ul>`
      : "<p>No time entries recorded yet.</p>"}

    <h3 class="section-head">Documents Register</h3>
    ${seedDocs.length || docs.length ? `<table><thead><tr><th>Document</th><th>Type</th><th>Register note</th><th>Source</th></tr></thead><tbody>
      ${seedDocs.map((d) => `<tr><td>${esc(d.title)}</td><td>—</td><td>${esc(d.note)}</td><td>Register seed (config)</td></tr>`).join("")}
      ${docs.map((r) => `<tr><td>${esc(r.payload.title || "")}</td><td>${esc(r.payload.doc_type || "—")}</td><td>${esc(r.payload.note || "")}</td><td>${esc(r.author)}, ${esc(fmtDT(r.created_at))}</td></tr>`).join("")}
      </tbody></table>
      ${docs.length ? `<ul class="record-list">${docs.map((r) => recordLine(r, esc(r.payload.title || "Register entry"))).join("")}</ul>` : ""}`
      : "<p>No documents registered yet.</p>"}

    <h3 class="section-head">Policies Acknowledgment</h3>
    ${acks.length ? `<ul class="record-list">${acks.map((r) => recordLine(r, `${esc(r.payload.policy || "")} — acknowledged ${esc(fmtD(r.payload.acknowledged_at || r.created_at))}`)).join("")}</ul>`
      : "<p>No policy acknowledgments recorded yet.</p>"}`;

  $("btn-show-time").addEventListener("click", () => {
    $("doc-form").hidden = true; $("policy-form").hidden = true; $("addendum-form").hidden = true;
    $("time-form").hidden = false;
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    $("t-date").value = now.toISOString().slice(0, 10);
    $("t-desc").focus();
  });
  $("btn-show-doc").addEventListener("click", () => {
    $("time-form").hidden = true; $("policy-form").hidden = true; $("addendum-form").hidden = true;
    $("doc-form").hidden = false;
    $("d-title").focus();
  });
  $("btn-show-policy").addEventListener("click", () => {
    $("time-form").hidden = true; $("doc-form").hidden = true; $("addendum-form").hidden = true;
    $("policy-form").hidden = false;
  });
  $("btn-print").addEventListener("click", () => window.print());
  view.querySelectorAll(".btn-addendum").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rec = state.records.find((r) => r.id === btn.dataset.id);
      if (!rec) return;
      $("addendum-target").textContent = "Addendum to the record above (entered " + fmtDT(rec.created_at) + ", by " + rec.author + "). The original will not be changed.";
      $("addendum-form").hidden = false;
      $("addendum-form").dataset.parent = rec.id;
      $("addendum-form").dataset.employee = rec.employee_id;
      $("a-text").focus();
    });
  });
}

/* ---------------- saves ---------------- */
function baseRow(recordType, payload) {
  return {
    id: uuid(),
    employee_id: state.selectedEmployeeId,
    record_type: recordType,
    payload: payload,
    author: state.user.name,
    created_at: new Date().toISOString()
  };
}
async function onSaveTime(e) {
  e.preventDefault();
  const hours = $("t-hours").value.trim();
  if (!hours || isNaN(parseFloat(hours))) { alert("Enter the hours worked as a number, e.g. 4.5."); return; }
  const row = baseRow("time_entry", {
    date: $("t-date").value,
    hours: hours,
    description: $("t-desc").value.trim()
  });
  await enqueueSave(row);
  e.target.reset();
  $("time-form").hidden = true;
}
async function onSaveDoc(e) {
  e.preventDefault();
  const row = baseRow("document", {
    title: $("d-title").value.trim(),
    doc_type: $("d-type").value.trim(),
    note: $("d-note").value.trim()
  });
  await enqueueSave(row);
  e.target.reset();
  $("doc-form").hidden = true;
}
async function onSavePolicy(e) {
  e.preventDefault();
  if (!$("p-read").checked) { alert("Check the box confirming you have read and understand the policy before saving the acknowledgment."); return; }
  const row = baseRow("policy_ack", {
    policy: $("p-policy").value,
    acknowledged: true,
    acknowledged_at: new Date().toISOString()
  });
  await enqueueSave(row);
  e.target.reset();
  $("policy-form").hidden = true;
}
async function onSaveAddendum(e) {
  e.preventDefault();
  const parentId = $("addendum-form").dataset.parent;
  const parent = state.records.find((r) => r.id === parentId);
  if (!parent) return;
  const row = {
    id: uuid(),
    employee_id: parent.employee_id,
    record_type: "addendum",
    payload: { parent_record_id: parentId, text: $("a-text").value.trim() },
    author: state.user.name,
    created_at: new Date().toISOString()
  };
  await enqueueSave(row);
  $("addendum-form").hidden = true;
  $("a-text").value = "";
  renderPerson();
}

/* ---------------- boot ---------------- */
(function boot() {
  initLogin();
  const saved = sessionStorage.getItem("hrdash.user");
  if (saved) {
    const user = CFG.users.find((u) => u.name === saved);
    if (user) { state.user = user; enterApp(); }
  }
})();

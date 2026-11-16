"use strict";
/* Centipede Peer to Peer, LLC — Client Dashboard (standalone website).
   Mirrors the DAP Noting Dashboard pattern:
   - No client names render before login (names live only in config.js).
   - Saved entries are never edited or deleted in this UI. Corrections are
     new, dated addendum rows pointing at the original.
   - Every row carries author + timestamps (source-traced).
   - Saves are serialized through one queue; a local copy is kept first,
     the queue flushes on pagehide / visibilitychange, and data refreshes
     on focus / open.
   - Storage: Supabase REST (table client_records) when it answers;
     otherwise Local Mode with localStorage and a yellow banner.
   Record shape stored in client_records:
     { id, client_code, record_type, payload, author, created_at }
   record_type is one of: encounter | referral | enrollment | addendum.
   The full entry lives in payload (jsonb) so sections stay flexible. */
const CFG = window.CLIENT_CONFIG;
const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  mode: "local",
  records: [],
  selectedClient: null,
  saveChain: Promise.resolve(),
  outbox: []
};

const LS_RECORDS = "clientdash.records.v1";
const LS_OUTBOX = "clientdash.outbox.v1";

/* ---------------- utilities ---------------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
const fmtDT = (iso) => { try { return new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }); } catch { return iso || ""; } };
const fmtD = (s) => { if (!s) return "Not stated"; try { return new Date(s.length <= 10 ? s + "T12:00:00" : s).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }); } catch { return s; } };
async function sha256Hex(text) {
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return sha256Pure(text);
}
/* Compact pure-JS SHA-256, used only when WebCrypto is unavailable.
   Copied from the DAP dashboard app.js fallback approach. */
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
function clientByCode(code) { return CFG.clients.find((c) => c.code === code) || null; }
function isSelectable(code) { const c = clientByCode(code); return !!c && !c.missing; }

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
  if (!res.ok) throw new Error("Supabase fetch failed: " + res.status);
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
function loadLocal() { try { return JSON.parse(localStorage.getItem(LS_RECORDS) || "[]"); } catch { return []; } }
function saveLocal(rows) { localStorage.setItem(LS_RECORDS, JSON.stringify(rows)); }
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
  renderClientList();
  if (state.selectedClient) renderClientView();
  if (!quiet) setStatus(state.records.length ? "" : "No records loaded yet.");
}

/* ---------------- serialized save queue ---------------- */
function enqueueSave(row) {
  state.saveChain = state.saveChain.then(() => persistRow(row)).catch(() => persistRow(row));
  return state.saveChain;
}
async function persistRow(row) {
  setStatus("Saving…");
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
  renderClientList();
  renderClientView();
}
async function flushOutbox() {
  if (!state.outbox.length) return;
  try { await sbFetchRecords(); } catch { return; }
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
    sessionStorage.setItem("clientdash.user", user.name);
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
function fillSelect(id, items, selected) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = items.map((v) => `<option ${v === selected ? "selected" : ""}>${esc(v)}</option>`).join("");
}
function buildApp() {
  for (const id of ["e-author", "r-author", "en-author"]) {
    const el = $(id);
    if (el) el.innerHTML = CFG.authors.map((a) => `<option ${a === state.user.name ? "selected" : ""}>${esc(a)}</option>`).join("");
  }
  fillSelect("e-location", CFG.locationTypes, "Office");
  fillSelect("e-service", CFG.services, "Peer support");
  fillSelect("r-type", CFG.referralTypes, "Shelter");
  fillSelect("r-status", CFG.referralStatuses, "Referred");
  fillSelect("en-program", CFG.programs, "Peer Support");
  fillSelect("en-status", CFG.enrollmentStatuses, "Active");

  const first = CFG.clients.find((c) => !c.missing);
  state.selectedClient = first ? first.code : CFG.clients[0].code;

  $("refresh-btn").addEventListener("click", () => refreshRecords());
  $("logout-btn").addEventListener("click", () => { sessionStorage.removeItem("clientdash.user"); location.reload(); });
  $("encounter-form").addEventListener("submit", onSaveEncounter);
  $("referral-form").addEventListener("submit", onSaveReferral);
  $("enrollment-form").addEventListener("submit", onSaveEnrollment);
  $("addendum-form").addEventListener("submit", onSaveAddendum);
  $("addendum-cancel").addEventListener("click", () => { $("addendum-form").hidden = true; });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOutbox();
    if (document.visibilityState === "visible") refreshRecords(true);
  });
  window.addEventListener("pagehide", () => flushOutbox());
  window.addEventListener("focus", () => refreshRecords(true));

  renderClientList();
  renderClientView();
}

function renderBanner() {
  const b = $("mode-banner");
  if (!b) return;
  if (state.mode === "supabase") {
    b.className = "banner ok";
    b.textContent = "Connected to the Centipede database (Supabase). Records save to the database and are source-traced to their author.";
  } else {
    b.className = "banner warn";
    b.textContent = "Local Mode — entries stored on this device only. The database table (client_records) is not connected yet: run the one-step SQL in the supabase folder (see README) to connect it. Do not enter real client records until the CEO confirms the database is connected.";
  }
}

/* ---------------- client list & per-client view ---------------- */
function recordsFor(code, type) {
  return state.records.filter((r) => r.client_code === code && (!type || r.record_type === type))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
function renderClientList() {
  const ul = $("client-list");
  if (!ul) return;
  ul.innerHTML = "";
  for (const c of CFG.clients) {
    const li = document.createElement("li");
    if (c.code === state.selectedClient) li.className = "active";
    const counts = c.missing ? "" : `<div class="meta">${recordsFor(c.code, "encounter").length} encounter(s) · ${recordsFor(c.code, "referral").length} referral(s) · ${recordsFor(c.code, "enrollment").length} enrollment(s)</div>`;
    li.innerHTML = `<strong>${esc(c.label)}</strong>${c.missing ? `<div class="meta" style="color:#9c2b2b;font-weight:bold">Record missing from dashboard — restore pending with CEO; do not use</div>` : counts}`;
    li.addEventListener("click", () => {
      state.selectedClient = c.code;
      hideForms();
      renderClientList();
      renderClientView();
    });
    ul.appendChild(li);
  }
}
function hideForms() {
  for (const id of ["encounter-form", "referral-form", "enrollment-form", "addendum-form", "packet-view"]) {
    const el = $(id); if (el) el.hidden = true;
  }
}
function payloadOf(r) { return r.payload || {}; }
function addendaFor(parentId) {
  return state.records.filter((r) => r.record_type === "addendum" && payloadOf(r).parent_record_id === parentId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}
function recordCard(r, title, bodyHtml) {
  const adds = addendaFor(r.id);
  const addsHtml = adds.length
    ? `<h4>Addenda (dated corrections — originals stand as written)</h4>` + adds.map((a) => `<blockquote><strong>${esc(fmtDT(a.created_at))} — ${esc(a.author)}:</strong>\n${esc(payloadOf(a).text || "")}</blockquote>`).join("")
    : "";
  return `<div class="note-full" style="border:1px solid var(--line);border-radius:8px;padding:.7rem;margin-bottom:.6rem">
    <strong>${esc(title)}</strong>
    <div class="meta">Author: ${esc(r.author)} · Entered: ${esc(fmtDT(r.created_at))}</div>
    ${bodyHtml}${addsHtml}
    <p class="no-print"><button class="btn-small btn-addendum" type="button" data-id="${esc(r.id)}">Add a dated correction / addendum</button></p>
  </div>`;
}
function renderClientView() {
  const view = $("client-view");
  if (!view) return;
  const c = clientByCode(state.selectedClient);
  if (!c) { view.innerHTML = "<p>Select a client.</p>"; return; }
  if (c.missing) {
    view.innerHTML = `<h2>${esc(c.label)}</h2>
      <p class="banner warn" style="border:1px solid var(--gold)">Record missing from dashboard — restore pending with CEO; do not use. This entry is a flagged placeholder only. No record has been recreated from assumption, and no new entries can be added for this client until the restore is completed with the CEO.</p>`;
    return;
  }
  const enc = recordsFor(c.code, "encounter");
  const ref = recordsFor(c.code, "referral");
  const enr = recordsFor(c.code, "enrollment");
  const encHtml = enc.length ? enc.map((r) => {
    const p = payloadOf(r);
    return recordCard(r, `Encounter — ${fmtDT(p.occurred_at || r.created_at)}`,
      `<p class="meta">Location: ${esc(p.location_type || "Not stated")} · Service: ${esc(p.service_provided || "Not stated")} · Needs: ${esc(p.needs || "Not stated")} · Follow-up: ${esc(p.follow_up_date ? fmtD(p.follow_up_date) : "None")}</p>
       ${p.data_text ? `<h4>Data</h4><blockquote>${esc(p.data_text)}</blockquote>` : ""}
       ${p.assessment_text ? `<h4>Assessment (peer observation)</h4><blockquote>${esc(p.assessment_text)}</blockquote>` : ""}
       ${p.plan_text ? `<h4>Plan</h4><blockquote>${esc(p.plan_text)}</blockquote>` : ""}`);
  }).join("") : "<p>No encounters yet for this client.</p>";
  const refHtml = ref.length ? ref.map((r) => {
    const p = payloadOf(r);
    return recordCard(r, `Referral — ${esc(p.referral_type || "Referral")} (${esc(p.status || "Referred")})`,
      `<p class="meta">Provider: ${esc(p.provider || "Not stated")} · Referred: ${esc(p.referred_date ? fmtD(p.referred_date) : "Not stated")}</p>
       ${p.notes ? `<blockquote>${esc(p.notes)}</blockquote>` : ""}`);
  }).join("") : "<p>No referrals yet for this client.</p>";
  const enrHtml = enr.length ? enr.map((r) => {
    const p = payloadOf(r);
    return recordCard(r, `Enrollment — ${esc(p.program_name || "Program")} [${esc(p.status || "Active")}]`,
      `<p class="meta">Enrolled: ${esc(p.enrolled_date ? fmtD(p.enrolled_date) : "Not stated")}</p>
       ${p.notes ? `<blockquote>${esc(p.notes)}</blockquote>` : ""}`);
  }).join("") : "<p>No enrollments yet for this client.</p>";

  view.innerHTML = `
    <h2>${esc(c.label)}</h2>
    <p class="no-print">
      <button class="btn-small" id="btn-new-enc" type="button">+ New encounter</button>
      <button class="btn-small" id="btn-new-ref" type="button">+ New referral</button>
      <button class="btn-small" id="btn-new-enr" type="button">+ New enrollment</button>
      <button class="btn-small" id="btn-packet" type="button">Referral Packet (print)</button>
    </p>
    <h3>Enrollments</h3>${enrHtml}
    <h3>Encounters</h3>${encHtml}
    <h3>Referrals</h3>${refHtml}`;
  $("btn-new-enc").addEventListener("click", () => { hideForms(); $("packet-view").hidden = true; $("encounter-form").hidden = false; const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); $("e-occurred-at").value = now.toISOString().slice(0, 16); });
  $("btn-new-ref").addEventListener("click", () => { hideForms(); $("referral-form").hidden = false; $("r-date").value = new Date().toISOString().slice(0, 10); });
  $("btn-new-enr").addEventListener("click", () => { hideForms(); $("enrollment-form").hidden = false; $("en-date").value = new Date().toISOString().slice(0, 10); });
  $("btn-packet").addEventListener("click", () => showPacket(c));
  view.querySelectorAll(".btn-addendum").forEach((btn) => btn.addEventListener("click", () => {
    const parent = state.records.find((r) => r.id === btn.dataset.id);
    if (!parent) return;
    hideForms();
    $("addendum-target").textContent = "Addendum to the " + parent.record_type + " entered " + fmtDT(parent.created_at) + " by " + parent.author + ". The original will not be changed.";
    $("addendum-form").hidden = false;
    $("addendum-form").dataset.parent = parent.id;
    $("a-text").focus();
  }));
}

/* ---------------- Referral Packet export (print view) ---------------- */
function showPacket(c) {
  hideForms();
  const ref = recordsFor(c.code, "referral");
  const enr = recordsFor(c.code, "enrollment");
  const enc = recordsFor(c.code, "encounter");
  const pv = $("packet-view");
  pv.hidden = false;
  pv.innerHTML = `
    <h2>Referral Packet — ${esc(c.name)} (${esc(c.code)})</h2>
    <p class="meta">Centipede Peer to Peer, LLC · LIC: 0714781 · 717 E. Longview Ave., Stockton, CA 95207</p>
    <p class="meta">Prepared: ${esc(fmtDT(new Date().toISOString()))} · Prepared by: ${esc(state.user.name)} · Source: Client Dashboard entries (author + timestamp on each record). Locked client binders remain the official record.</p>
    <h3>Enrollments</h3>
    ${enr.length ? enr.map((r) => { const p = payloadOf(r); return `<p><strong>${esc(p.program_name || "")}</strong> [${esc(p.status || "")}] — enrolled ${esc(p.enrolled_date ? fmtD(p.enrolled_date) : "Not stated")}${p.notes ? " — " + esc(p.notes) : ""}</p>`; }).join("") : "<p>None recorded.</p>"}
    <h3>Referrals</h3>
    ${ref.length ? ref.map((r) => { const p = payloadOf(r); return `<p><strong>${esc(p.referral_type || "Referral")}</strong> — ${esc(p.provider || "Provider not stated")} · Status: ${esc(p.status || "")} · Referred: ${esc(p.referred_date ? fmtD(p.referred_date) : "Not stated")}${p.notes ? "<br>" + esc(p.notes) : ""}</p>`; }).join("") : "<p>None recorded.</p>"}
    <h3>Recent encounters (summary)</h3>
    ${enc.length ? enc.slice(0, 10).map((r) => { const p = payloadOf(r); return `<p><strong>${esc(fmtDT(p.occurred_at || r.created_at))}</strong> — ${esc(p.service_provided || "")} · ${esc(p.location_type || "")}${p.data_text ? "<br>" + esc(p.data_text) : ""}</p>`; }).join("") : "<p>None recorded.</p>"}
    <p class="meta">Non-clinical peer support only — not medical, psychiatric, or legal advice. In an emergency, call 911. Client information is confidential; share only with a signed release of information or a judge-signed court order, per company practice.</p>
    <p class="no-print"><button class="btn-small" id="btn-print-packet" type="button">Print this packet</button>
    <button class="btn-small" id="btn-close-packet" type="button">Close packet</button></p>`;
  $("btn-print-packet").addEventListener("click", () => window.print());
  $("btn-close-packet").addEventListener("click", () => { pv.hidden = true; });
  pv.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------------- saves ---------------- */
function baseRow(recordType, payload, author) {
  const c = clientByCode(state.selectedClient);
  return {
    id: uuid(),
    client_code: c.code,
    record_type: recordType,
    payload: Object.assign({ client_name: c.label }, payload),
    author: author || state.user.name,
    created_at: new Date().toISOString()
  };
}
function guardSelectable() {
  if (isSelectable(state.selectedClient)) return true;
  alert("This client's record is missing from the dashboard and is flagged do-not-use. No new entries can be added until the restore is completed with the CEO.");
  return false;
}
async function onSaveEncounter(e) {
  e.preventDefault();
  if (!guardSelectable()) return;
  const row = baseRow("encounter", {
    occurred_at: new Date($("e-occurred-at").value).toISOString(),
    location_type: $("e-location").value,
    service_provided: $("e-service").value,
    needs: $("e-needs").value.trim(),
    follow_up_date: $("e-followup").value,
    data_text: $("e-data").value.trim(),
    assessment_text: $("e-assessment").value.trim(),
    plan_text: $("e-plan").value.trim()
  }, $("e-author").value);
  await enqueueSave(row);
  e.target.reset();
  $("encounter-form").hidden = true;
  renderClientView();
}
async function onSaveReferral(e) {
  e.preventDefault();
  if (!guardSelectable()) return;
  const row = baseRow("referral", {
    referral_type: $("r-type").value,
    status: $("r-status").value,
    provider: $("r-provider").value.trim(),
    referred_date: $("r-date").value,
    notes: $("r-notes").value.trim()
  }, $("r-author").value);
  await enqueueSave(row);
  e.target.reset();
  $("referral-form").hidden = true;
  renderClientView();
}
async function onSaveEnrollment(e) {
  e.preventDefault();
  if (!guardSelectable()) return;
  const row = baseRow("enrollment", {
    program_name: $("en-program").value,
    status: $("en-status").value,
    enrolled_date: $("en-date").value,
    notes: $("en-notes").value.trim()
  }, $("en-author").value);
  await enqueueSave(row);
  e.target.reset();
  $("enrollment-form").hidden = true;
  renderClientView();
}
async function onSaveAddendum(e) {
  e.preventDefault();
  const parentId = $("addendum-form").dataset.parent;
  const parent = state.records.find((r) => r.id === parentId);
  if (!parent) return;
  const c = clientByCode(parent.client_code);
  const row = {
    id: uuid(),
    client_code: parent.client_code,
    record_type: "addendum",
    payload: { client_name: c ? c.label : parent.client_code, parent_record_id: parentId, parent_record_type: parent.record_type, text: $("a-text").value.trim() },
    author: state.user.name,
    created_at: new Date().toISOString()
  };
  await enqueueSave(row);
  $("addendum-form").hidden = true;
  $("a-text").value = "";
  renderClientView();
}

/* ---------------- boot ---------------- */
(function boot() {
  initLogin();
  const saved = sessionStorage.getItem("clientdash.user");
  if (saved) {
    const user = CFG.users.find((u) => u.name === saved);
    if (user) { state.user = user; enterApp(); }
  }
})();

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
   record_type is one of: encounter | referral | enrollment | addendum |
   document | form_completion | filing_status.
   The full entry lives in payload (jsonb) so sections stay flexible.
   - document: a document on the client's record (metadata + optional
     attached file). The locked binder stays the official record; the
     payload names where the original is filed.
   - form_completion: a client paperwork form completed in this
     dashboard (assets/forms.js). Its filled PDF is regenerated on
     demand from the stored field values (assets/pdfgen.js).
   - filing_status: append-only status rows for the binder filing
     queue; a form_completion is "filed" when a filing_status row
     points at it. Nothing is ever written to binder folders from
     this page — Jarvis carries completed documents into the locked
     binders and the daily dashboard<->binder sync reconciles. */
const CFG = window.CLIENT_CONFIG;
const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  mode: "local",
  records: [],
  selectedClient: null,
  saveChain: Promise.resolve(),
  outbox: [],
  paperworkLoaded: false,
  viewerUrl: null,
  viewerName: ""
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
  renderQueue();
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
  renderQueue();
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
  loadPaperworkAssets();
  state.outbox = loadOutbox();
  await refreshRecords();
  flushOutbox();
}

/* ---------------- paperwork assets (loaded only after login) ----------------
   forms.js (blank form templates) and pdfgen.js are fetched only after a
   successful sign-in, so no form or document content exists in the page
   before login. */
function loadPaperworkAssets() {
  if (state.paperworkLoaded) return;
  state.paperworkLoaded = true;
  const add = (src) => new Promise((res) => {
    const sc = document.createElement("script");
    sc.src = src; sc.onload = res; sc.onerror = res;
    document.body.appendChild(sc);
  });
  Promise.all([add("assets/forms.js"), add("assets/pdfgen.js")]).then(() => {
    renderClientList();
    if (state.selectedClient) renderClientView();
  });
}
function formById(id) { return (window.CLIENT_FORMS || []).find((f) => f.id === id) || null; }

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
  fillSelect("d-type", DOC_TYPES, "Signed form (paper original)");

  const first = CFG.clients.find((c) => !c.missing);
  state.selectedClient = first ? first.code : CFG.clients[0].code;

  $("refresh-btn").addEventListener("click", () => refreshRecords());
  $("logout-btn").addEventListener("click", () => { sessionStorage.removeItem("clientdash.user"); location.reload(); });
  $("encounter-form").addEventListener("submit", onSaveEncounter);
  $("referral-form").addEventListener("submit", onSaveReferral);
  $("enrollment-form").addEventListener("submit", onSaveEnrollment);
  $("addendum-form").addEventListener("submit", onSaveAddendum);
  $("addendum-cancel").addEventListener("click", () => { $("addendum-form").hidden = true; });
  $("document-form").addEventListener("submit", onSaveDocument);
  $("document-cancel").addEventListener("click", () => { $("document-form").hidden = true; });
  $("paperwork-form").addEventListener("submit", onCompletePaperwork);
  $("queue-btn").addEventListener("click", () => { hideForms(); $("queue-view").hidden = false; renderQueue(); $("queue-view").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("viewer-close").addEventListener("click", closeViewer);
  $("viewer-download").addEventListener("click", () => {
    if (!state.viewerUrl) return;
    const a = document.createElement("a");
    a.href = state.viewerUrl; a.download = state.viewerName || "document";
    document.body.appendChild(a); a.click(); a.remove();
  });

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
    const counts = c.missing ? "" : `<div class="meta">${recordsFor(c.code, "encounter").length} encounter(s) · ${recordsFor(c.code, "referral").length} referral(s) · ${recordsFor(c.code, "enrollment").length} enrollment(s) · ${recordsFor(c.code, "document").length + recordsFor(c.code, "form_completion").length} document(s)</div>`;
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
  for (const id of ["encounter-form", "referral-form", "enrollment-form", "addendum-form", "packet-view", "paperwork-form", "document-form", "queue-view"]) {
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

  const docs = [...recordsFor(c.code, "form_completion"), ...recordsFor(c.code, "document")]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const docHtml = docs.length ? docs.map((r) => {
    const p = payloadOf(r);
    if (r.record_type === "form_completion") {
      const filed = isFiled(r.id);
      return recordCard(r, `Completed form — ${esc(p.form_title || "Form")}`,
        `<p class="meta">Client: ${esc(p.client_name || c.label)} · Completed by: ${esc(r.author)} · ${esc(fmtDT(r.created_at))}</p>
         <p class="meta">Binder filing: <strong>${filed ? "Filed to binder (marked " + esc(fmtDT(filed.created_at)) + " by " + esc(filed.author) + ")" : "Queued for binder filing — Jarvis carries this into the locked binder"}</strong></p>
         <p class="no-print"><button class="btn-small btn-view-pdf" type="button" data-id="${esc(r.id)}">View filled PDF</button>
         <button class="btn-small btn-dl-pdf" type="button" data-id="${esc(r.id)}">Download PDF (for filing / printing)</button></p>`);
    }
    const att = p.attachment;
    return recordCard(r, `Document — ${esc(p.title || "Untitled document")}`,
      `<p class="meta">Type: ${esc(p.doc_type || "Other")} · Document date: ${esc(p.doc_date ? fmtD(p.doc_date) : "Not stated")} · Entered by: ${esc(r.author)} · ${esc(fmtDT(r.created_at))}</p>
       ${p.description ? `<blockquote>${esc(p.description)}</blockquote>` : ""}
       <p class="meta">Original filed at: ${esc(p.source_location || "Not stated")}</p>
       ${att ? `<p class="no-print"><button class="btn-small btn-view-att" type="button" data-id="${esc(r.id)}">View attached file</button>
       <button class="btn-small btn-dl-att" type="button" data-id="${esc(r.id)}">Download attached file</button></p>`
             : `<p class="meta">No file attached in the dashboard — view the original where it is filed (above). The locked binder is the official record.</p>`}`);
  }).join("") : "<p>No documents yet for this client. Completed paperwork forms and added documents will appear here.</p>";

  const forms = window.CLIENT_FORMS || [];
  const catalog = window.CLIENT_FORM_CATALOG || [];
  const formsHtml = forms.length ? `
    <p class="hint">Blank Centipede paperwork, filled in right here in the dashboard. When a form is completed it saves to this client's Documents above as a filled PDF and joins the binder filing queue. Fields mirror the paper originals exactly; no Social Security number or ID number is ever typed into these forms.</p>
    ${forms.map((f) => `<div class="note-full" style="border:1px solid var(--line);border-radius:8px;padding:.7rem;margin-bottom:.6rem">
      <strong>${esc(f.title)}</strong> <span class="badge">${esc(f.status)}</span>
      <div class="meta">${esc(f.source)}</div>
      <p class="no-print"><button class="btn-small btn-fill-form" type="button" data-form="${esc(f.id)}">Fill in this form for ${esc(c.name)}</button></p>
    </div>`).join("")}
    ${catalog.map((f) => `<div class="note-full" style="border:1px dashed var(--line);border-radius:8px;padding:.7rem;margin-bottom:.6rem">
      <strong>${esc(f.title)}</strong> <span class="badge">${esc(f.status)}</span>
      <div class="meta">${esc(f.source)}</div>
      <p class="hint">${esc(f.reason)}</p>
    </div>`).join("")}` : "<p>Paperwork forms are loading… if this message stays, reload the page.</p>";

  view.innerHTML = `
    <h2>${esc(c.label)}</h2>
    <p class="no-print">
      <button class="btn-small" id="btn-new-enc" type="button">+ New encounter</button>
      <button class="btn-small" id="btn-new-ref" type="button">+ New referral</button>
      <button class="btn-small" id="btn-new-enr" type="button">+ New enrollment</button>
      <button class="btn-small" id="btn-new-doc" type="button">+ Add document</button>
      <button class="btn-small" id="btn-packet" type="button">Referral Packet (print)</button>
    </p>
    <h3>Enrollments</h3>${enrHtml}
    <h3>Encounters</h3>${encHtml}
    <h3>Referrals</h3>${refHtml}
    <h3>Documents</h3>${docHtml}
    <h3>Paperwork forms</h3>${formsHtml}`;
  $("btn-new-enc").addEventListener("click", () => { hideForms(); $("packet-view").hidden = true; $("encounter-form").hidden = false; const now = new Date(); now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); $("e-occurred-at").value = now.toISOString().slice(0, 16); });
  $("btn-new-ref").addEventListener("click", () => { hideForms(); $("referral-form").hidden = false; $("r-date").value = new Date().toISOString().slice(0, 10); });
  $("btn-new-enr").addEventListener("click", () => { hideForms(); $("enrollment-form").hidden = false; $("en-date").value = new Date().toISOString().slice(0, 10); });
  $("btn-new-doc").addEventListener("click", () => { hideForms(); $("document-form").hidden = false; $("d-date").value = new Date().toISOString().slice(0, 10); });
  $("btn-packet").addEventListener("click", () => showPacket(c));
  view.querySelectorAll(".btn-fill-form").forEach((btn) => btn.addEventListener("click", () => openPaperworkForm(btn.dataset.form)));
  view.querySelectorAll(".btn-view-pdf").forEach((btn) => btn.addEventListener("click", () => viewCompletionPdf(btn.dataset.id, false)));
  view.querySelectorAll(".btn-dl-pdf").forEach((btn) => btn.addEventListener("click", () => viewCompletionPdf(btn.dataset.id, true)));
  view.querySelectorAll(".btn-view-att").forEach((btn) => btn.addEventListener("click", () => viewAttachment(btn.dataset.id, false)));
  view.querySelectorAll(".btn-dl-att").forEach((btn) => btn.addEventListener("click", () => viewAttachment(btn.dataset.id, true)));
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

/* ---------------- binder filing queue (sink-back) ----------------
   A completed form "sinks back where it belongs" two ways:
   1. It is saved on the client's record in the dashboard store (the
      form_completion row) and appears in that client's Documents.
   2. It joins this queue until a filing_status row marks it filed.
   STANDING RULE: binders are the official record and dashboard data
   does NOT flow into binders automatically. Nothing on this page
   writes to binder folders. Jarvis carries the completed documents
   (downloaded/printed PDFs) into each client's locked binder, marks
   them filed here, and the daily dashboard<->binder sync check
   reconciles the two. */
function filingStatusFor(completionId) {
  return state.records
    .filter((r) => r.record_type === "filing_status" && payloadOf(r).completion_id === completionId && payloadOf(r).status === "filed")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
}
function isFiled(completionId) { return filingStatusFor(completionId); }
function unfiledCompletions() {
  return state.records.filter((r) => r.record_type === "form_completion" && !isFiled(r.id))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}
function renderQueue() {
  const q = unfiledCompletions();
  const btn = $("queue-btn");
  if (btn) btn.textContent = "Binder filing queue (" + q.length + " waiting)";
  const view = $("queue-view");
  if (!view) return;
  view.innerHTML = `
    <h2>Binder filing queue</h2>
    <p class="hint">Completed paperwork waiting to be carried into the locked client binders. Binders are the official record; nothing is written to binder folders automatically. Download or print each filled PDF, file it in the client's locked binder, then mark it filed. The daily dashboard↔binder sync check reconciles this queue against the binders.</p>
    ${q.length ? q.map((r) => {
      const p = payloadOf(r);
      const c = clientByCode(r.client_code);
      return `<div class="note-full" style="border:1px solid var(--line);border-radius:8px;padding:.7rem;margin-bottom:.6rem">
        <strong>${esc(p.form_title || "Form")}</strong>
        <div class="meta">Client: ${esc(p.client_name || (c ? c.label : r.client_code))} · Completed by: ${esc(r.author)} · ${esc(fmtDT(r.created_at))}</div>
        <p class="no-print"><button class="btn-small btn-view-pdf" type="button" data-id="${esc(r.id)}">View filled PDF</button>
        <button class="btn-small btn-dl-pdf" type="button" data-id="${esc(r.id)}">Download PDF</button>
        <button class="btn-small btn-mark-filed" type="button" data-id="${esc(r.id)}">Mark filed to binder</button></p>
      </div>`;
    }).join("") : "<p>The queue is empty — every completed form has been marked filed to its binder.</p>"}
    <p class="no-print"><button class="btn-small" id="queue-close-2" type="button">Close queue</button></p>`;
  view.querySelectorAll(".btn-view-pdf").forEach((b) => b.addEventListener("click", () => viewCompletionPdf(b.dataset.id, false)));
  view.querySelectorAll(".btn-dl-pdf").forEach((b) => b.addEventListener("click", () => viewCompletionPdf(b.dataset.id, true)));
  view.querySelectorAll(".btn-mark-filed").forEach((b) => b.addEventListener("click", () => markFiled(b.dataset.id)));
  const qc2 = $("queue-close-2");
  if (qc2) qc2.addEventListener("click", () => { view.hidden = true; });
}
async function markFiled(completionId) {
  const comp = state.records.find((r) => r.id === completionId);
  if (!comp || isFiled(completionId)) return;
  const p = payloadOf(comp);
  const row = {
    id: uuid(),
    client_code: comp.client_code,
    record_type: "filing_status",
    payload: {
      client_name: p.client_name || comp.client_code,
      completion_id: completionId,
      form_title: p.form_title || "Form",
      status: "filed",
      note: "Marked filed to the client's locked binder from the dashboard queue. The completion record itself is unchanged; this status row is the trace."
    },
    author: state.user.name,
    created_at: new Date().toISOString()
  };
  await enqueueSave(row);
  renderQueue();
  renderClientView();
}

/* ---------------- paperwork: open, fill, complete ---------------- */
const NAME_KEYS = ["client_full_name", "full_legal_name", "client_full_legal_name"];
function fieldInputId(key) { return "pf-" + key; }
function renderFieldInput(f, c) {
  const id = fieldInputId(f.key);
  const prefill = NAME_KEYS.includes(f.key) ? c.name : (f.key === "centipede_client_id" || f.key === "client_id" || f.key === "client_id_record_no") ? c.code : "";
  if (f.type === "textarea") return `<textarea id="${id}" rows="${f.rows || 3}">${esc(prefill)}</textarea>`;
  if (f.type === "checkboxes") return `<div id="${id}">` + (f.options || []).map((o, i) => `<label class="check"><input type="checkbox" id="${id}-${i}" value="${esc(o)}"> <span>${esc(o)}</span></label>`).join("") + `</div>`;
  if (f.type === "radio") return `<div id="${id}">` + (f.options || []).map((o, i) => `<label class="check"><input type="radio" name="${id}" id="${id}-${i}" value="${esc(o)}"> <span>${esc(o)}</span></label>`).join("") + `</div>`;
  if (f.type === "select") return `<select id="${id}">` + (f.options || []).map((o) => `<option>${esc(o)}</option>`).join("") + `</select>`;
  if (f.type === "rows") {
    let html = "";
    for (let r = 0; r < (f.rows || 3); r++) {
      html += `<fieldset><legend>Row ${r + 1}</legend><div class="grid2">` + (f.rowFields || []).map((rf) => `<div><label for="${id}-${r}-${rf.key}">${esc(rf.label)}</label><input type="text" id="${id}-${r}-${rf.key}"></div>`).join("") + `</div></fieldset>`;
    }
    return html;
  }
  const inputType = { date: "date", time: "time", tel: "tel", email: "email", datetime: "datetime-local" }[f.type] || "text";
  const extra = f.type === "initials" ? ` maxlength="6" style="max-width:130px"` : f.type === "signature" ? ` autocomplete="off"` : "";
  return `<input type="${inputType}" id="${id}" value="${esc(prefill)}"${extra}>`;
}
function openPaperworkForm(formId) {
  const form = formById(formId);
  const c = clientByCode(state.selectedClient);
  if (!form || !c) return;
  if (!guardSelectable()) return;
  hideForms();
  const el = $("paperwork-form");
  el.dataset.formId = form.id;
  el.innerHTML = `
    <h2>${esc(form.title)}</h2>
    <p class="meta">For: <strong>${esc(c.label)}</strong> · Status: ${esc(form.status)} · Signed in as: ${esc(state.user.name)}</p>
    <p class="meta">${esc(form.source)}</p>
    ${form.intro ? `<p class="hint">${esc(form.intro)}</p>` : ""}
    ${form.sections.map((sec) => `<fieldset><legend>${esc(sec.heading)}</legend>
      ${sec.note ? `<p class="hint">${esc(sec.note)}</p>` : ""}
      ${sec.fields.map((f) => `<div><label for="${fieldInputId(f.key)}">${esc(f.label)}${f.required ? " *" : ""}</label>${renderFieldInput(f, c)}</div>`).join("")}
    </fieldset>`).join("")}
    <button type="submit" class="btn-primary">Complete this form — save to ${esc(c.name)}'s documents &amp; the binder filing queue</button>
    <button type="button" id="paperwork-cancel" class="btn-small">Cancel (nothing is saved)</button>
    <p class="hint">On completion, the filled PDF is generated in the official form layout and saved on this client's record with your name and the date/time as its source trace. The blank template is never changed. Jarvis carries completed forms into the locked binder — see the binder filing queue.</p>`;
  el.hidden = false;
  $("paperwork-cancel").addEventListener("click", () => { el.hidden = true; });
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}
function collectPaperworkValues(form) {
  const values = {};
  for (const sec of form.sections || []) {
    for (const f of sec.fields || []) {
      const id = fieldInputId(f.key);
      if (f.type === "checkboxes") {
        values[f.key] = (f.options || []).filter((o, i) => { const box = $(id + "-" + i); return box && box.checked; });
      } else if (f.type === "radio") {
        const checked = document.querySelector('input[name="' + id + '"]:checked');
        values[f.key] = checked ? checked.value : "";
      } else if (f.type === "rows") {
        const rowsArr = [];
        for (let r = 0; r < (f.rows || 3); r++) {
          const row = {};
          let any = false;
          for (const rf of f.rowFields || []) {
            const inp = $(id + "-" + r + "-" + rf.key);
            row[rf.key] = inp ? inp.value.trim() : "";
            if (row[rf.key]) any = true;
          }
          if (any) rowsArr.push(row);
        }
        values[f.key] = rowsArr;
      } else {
        const inp = $(id);
        values[f.key] = inp ? inp.value.trim() : "";
      }
    }
  }
  return values;
}
async function onCompletePaperwork(e) {
  e.preventDefault();
  if (!guardSelectable()) return;
  const form = formById($("paperwork-form").dataset.formId);
  if (!form) return;
  const values = collectPaperworkValues(form);
  for (const sec of form.sections || []) {
    for (const f of sec.fields || []) {
      if (f.required && !values[f.key]) {
        alert("Please complete the required field: " + f.label);
        const inp = $(fieldInputId(f.key));
        if (inp) inp.focus();
        return;
      }
    }
  }
  const c = clientByCode(state.selectedClient);
  const row = baseRow("form_completion", {
    form_id: form.id,
    form_title: form.title,
    form_source: form.source,
    form_status: form.status,
    values,
    binder_filing: "Queued for binder filing"
  }, state.user.name);
  await enqueueSave(row);
  $("paperwork-form").hidden = true;
  renderClientView();
  renderQueue();
  setStatus("Form completed and saved to " + c.name + "'s documents, and queued for binder filing ✓ " + fmtDT(row.created_at));
}

/* ---------------- filled-PDF viewing / download ---------------- */
function completionPdfBlob(r) {
  const p = payloadOf(r);
  const form = formById(p.form_id);
  if (!form || !window.CentipedePDF) return null;
  return window.CentipedePDF.buildBlob(form, {
    clientLabel: p.client_name || r.client_code,
    clientCode: r.client_code,
    completedBy: r.author,
    completedAtDisplay: fmtDT(r.created_at),
    values: p.values || {}
  });
}
function pdfFileName(r) {
  const p = payloadOf(r);
  return (p.form_id || "form") + "-" + r.client_code + "-" + String(r.created_at || "").slice(0, 10) + ".pdf";
}
function showViewer(title, meta, url, downloadName) {
  closeViewer();
  state.viewerUrl = url;
  state.viewerName = downloadName || "document";
  $("viewer-title").textContent = title;
  $("viewer-meta").textContent = meta || "";
  const isPdf = /\.pdf($|\?)/i.test(downloadName || "") || (url || "").startsWith("blob:");
  const frame = $("doc-frame"), img = $("doc-img");
  if (isPdf) { frame.src = url; frame.hidden = false; img.hidden = true; }
  else { img.src = url; img.hidden = false; frame.hidden = true; }
  $("doc-viewer").hidden = false;
  $("doc-viewer").scrollIntoView({ behavior: "smooth", block: "start" });
}
function closeViewer() {
  const v = $("doc-viewer");
  if (v) v.hidden = true;
  const frame = $("doc-frame"), img = $("doc-img");
  if (frame) { frame.src = "about:blank"; frame.hidden = true; }
  if (img) { img.removeAttribute("src"); img.hidden = true; }
  if (state.viewerUrl && state.viewerUrl.startsWith("blob:")) URL.revokeObjectURL(state.viewerUrl);
  state.viewerUrl = null;
}
function downloadUrl(url, name) {
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}
function viewCompletionPdf(recordId, download) {
  const r = state.records.find((x) => x.id === recordId);
  if (!r) return;
  const blob = completionPdfBlob(r);
  if (!blob) { alert("The filled PDF could not be generated — the form template or PDF tool did not load. Reload the page and try again."); return; }
  const url = URL.createObjectURL(blob);
  if (download) { downloadUrl(url, pdfFileName(r)); setTimeout(() => URL.revokeObjectURL(url), 4000); return; }
  const p = payloadOf(r);
  showViewer("Filled PDF — " + (p.form_title || "Form"), "Client: " + (p.client_name || r.client_code) + " · Completed by " + r.author + " · " + fmtDT(r.created_at) + " · The locked client binder is the official record.", url, pdfFileName(r));
}
function viewAttachment(recordId, download) {
  const r = state.records.find((x) => x.id === recordId);
  if (!r) return;
  const att = payloadOf(r).attachment;
  if (!att || !att.data) return;
  if (download) { downloadUrl(att.data, att.name || "document"); return; }
  showViewer("Document — " + (payloadOf(r).title || "Untitled"), "Client: " + (payloadOf(r).client_name || r.client_code) + " · Attached file: " + (att.name || "") + " · The locked client binder is the official record.", att.data, att.name || "document");
}

/* ---------------- documents: add an entry ---------------- */
const DOC_TYPES = ["Signed form (paper original)", "Completed form (dashboard)", "ID / document copy", "Letter", "Court / legal document", "Medical paperwork", "Photo", "Other"];
const MAX_ATTACH_BYTES = 1200000;
async function onSaveDocument(e) {
  e.preventDefault();
  if (!guardSelectable()) return;
  const fileInput = $("d-file");
  let attachment = null;
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (file) {
    if (file.size > MAX_ATTACH_BYTES) {
      alert("That file is too large to attach in the dashboard (" + Math.round(file.size / 1024) + " KB). The limit is about 1.2 MB so saves stay reliable. File the original in the client's binder and record it here without the attachment, naming where it is filed.");
      return;
    }
    attachment = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res({ name: file.name, mime: file.type || "", data: String(reader.result) });
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }
  const row = baseRow("document", {
    title: $("d-title").value.trim(),
    doc_type: $("d-type").value,
    doc_date: $("d-date").value,
    description: $("d-desc").value.trim(),
    source_location: $("d-source").value.trim(),
    attachment
  }, state.user.name);
  if (!row.payload.title) { alert("Give the document a title first."); return; }
  await enqueueSave(row);
  e.target.reset();
  $("document-form").hidden = true;
  renderClientView();
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

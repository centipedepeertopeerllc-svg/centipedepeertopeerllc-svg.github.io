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
function clientByCode(code) { return allClients().find((c) => c.code === code) || null; }
/* Approved intakes become members: they join the client list with the CP code and
   client number assigned at approval (CPP-POL-2026-043). */
function allClients() {
  const approved = loadIntakes().filter((i) => i.status === "Approved").map((i) => ({
    code: i.memberCode, label: i.name + " — " + i.memberCode + " (" + i.memberNo + ") — approved from intake " + i.id,
    name: i.name, clientNo: i.memberNo, missing: false, fromIntake: i.id
  }));
  return CFG.clients.concat(approved);
}
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
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.client.v1",
    sessionKey: "clientdash.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
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
  initIntake();
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
  Promise.all([add("assets/forms.js"), add("assets/pdfgen.js"), add("assets/signdocs.js")]).then(() => {
    renderClientList();
    if (state.selectedClient) renderClientView();
    if (typeof renderIntakes === "function") renderIntakes();
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
  for (const c of allClients()) {
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
  for (const id of ["encounter-form", "referral-form", "enrollment-form", "addendum-form", "packet-view", "paperwork-form", "document-form", "queue-view", "sign-view"]) {
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

  const srcIntake = c.fromIntake ? intakeById(c.fromIntake) : null;
  const signedSection = srcIntake && ((srcIntake.signatures && Object.keys(srcIntake.signatures).length) || srcIntake.roiDeclined)
    ? `${signedDocsHtml(srcIntake)}<p class="no-print"><button class="btn-small" id="btn-print-signed-view" type="button">Print signed intake summary (for the locked binder)</button></p>` : "";
  view.innerHTML = `
    <h2>${esc(c.label)}</h2>
    <p class="no-print">
      <button class="btn-small" id="btn-new-enc" type="button">+ New encounter</button>
      <button class="btn-small" id="btn-new-ref" type="button">+ New referral</button>
      <button class="btn-small" id="btn-new-enr" type="button">+ New enrollment</button>
      <button class="btn-small" id="btn-new-doc" type="button">+ Add document</button>
      <button class="btn-small" id="btn-packet" type="button">Referral Packet (print)</button>
    </p>
    ${signedSection}
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
  const psv = $("btn-print-signed-view");
  if (psv && c.fromIntake) psv.addEventListener("click", () => showSignedSummary(c.fromIntake));
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
  const user = CPPAuth.restoreSession();
  if (user) { state.user = user; enterApp(); }
})();

/* ---------------- intake: before membership (CPP-POL-2026-043) ---------------- */
const LS_INTAKES = "cpp.clients.intakes.v1";
function loadIntakes() { try { return JSON.parse(localStorage.getItem(LS_INTAKES) || "[]"); } catch { return []; } }
function intakeById(id) { return loadIntakes().find((x) => x.id === id) || null; }
function saveIntakes(rows) { localStorage.setItem(LS_INTAKES, JSON.stringify(rows)); }
const INTAKE_DOCS = [
  { key: "photoId", label: "Government photo ID — copy held (number never recorded)", required: true },
  { key: "roi", label: "Signed Release of Information / consent", required: true },
  { key: "agreement", label: "Signed Intake & Participation Agreement", required: true },
  { key: "insuranceCard", label: "Insurance card copy (or routed to Clients Without Insurance)", required: false },
  { key: "livingProof", label: "Proof of living situation (or signed self-declaration)", required: false },
  { key: "courtDocs", label: "Justice Support: court paperwork + attorney of record", required: false },
  { key: "dd214", label: "Veterans: DD-214 or VA documentation of service", required: false }
];
const DOC_STATES = ["Not yet", "Received", "Self-declared", "Does not apply"];
/* Approval guardrails (CPP-POL-2026-043): the photo ID copy must be in (its
   number is never recorded); the agreement must be signed (in this dashboard
   or received on paper); the ROI must be signed OR explicitly declined with
   the decline recorded — a declined ROI never blocks the rest of intake. */
function intakeReady(i) {
  const docs = i.docs || {};
  const sigs = i.signatures || {};
  const photoIdIn = docs.photoId === "Received";
  const agreementIn = !!sigs.agreement || docs.agreement === "Received";
  const roiIn = !!sigs.roi || !!i.roiDeclined || docs.roi === "Received";
  return photoIdIn && agreementIn && roiIn;
}
function nextMemberIds() {
  let cp = 10, no = 6;
  for (const c of CFG.clients) { const m = String(c.code).match(/CP-(\d+)/); if (m) cp = Math.max(cp, Number(m[1])); const n = String(c.clientNo).match(/#(\d+)/); if (n) no = Math.max(no, Number(n[1])); }
  for (const i of loadIntakes()) { if (i.memberCode) { const m = i.memberCode.match(/CP-(\d+)/); if (m) cp = Math.max(cp, Number(m[1])); } if (i.memberNo) { const n = i.memberNo.match(/#(\d+)/); if (n) no = Math.max(no, Number(n[1])); } }
  return { code: "CP-" + String(cp + 1).padStart(4, "0"), no: "Client #" + String(no + 1).padStart(3, "0") };
}
const SIGN_DOC_KEYS = ["agreement", "roi"];
function signedDocsHtml(i) {
  const sigs = i.signatures || {};
  const parts = [];
  for (const key of SIGN_DOC_KEYS) {
    const s = sigs[key];
    if (s) {
      parts.push(`<div class="signed-doc"><strong>${esc(s.docTitle)}</strong> — signed electronically in this dashboard
        <div class="meta">Signed by: ${esc(s.signerName)} · ${esc(fmtDT(s.signedAt))} · Staff present: ${esc(s.staffName)}</div>
        <img class="sig-img" src="${s.image}" alt="Signature of ${esc(s.signerName)}"></div>`);
    }
  }
  if (i.roiDeclined) {
    parts.push(`<div class="signed-doc"><strong>Release of Information (ROI)</strong> — <strong>declined by the client</strong>
      <div class="meta">Decline recorded ${esc(fmtDT(i.roiDeclined.recordedAt))} · Client: ${esc(i.roiDeclined.clientName)} · Recorded by: ${esc(i.roiDeclined.staffName)}</div></div>`);
  }
  return parts.length ? `<div style="margin-top:.4rem"><strong>Signed documents</strong>${parts.join("")}</div>` : "";
}
function renderIntakes() {
  const ul = $("intake-list"); if (!ul) return;
  const rows = loadIntakes();
  const sum = $("intake-summary");
  if (sum) { const open = rows.filter((i) => i.status !== "Approved" && i.status !== "Not approved").length; sum.textContent = rows.length ? open + " intake(s) in progress · " + rows.filter((i) => i.status === "Approved").length + " approved into membership." : "No intakes yet."; }
  ul.innerHTML = rows.length ? "" : '<li class="hint">No intakes yet — open the first one above.</li>';
  for (const i of rows) {
    const li = document.createElement("li");
    const ready = intakeReady(i);
    const status = i.status === "Approved" ? "Approved — member " + i.memberCode + " (" + i.memberNo + ")" : i.status === "Not approved" ? "Not approved" : ready ? "Ready for approval" : i.status;
    const docs = INTAKE_DOCS.map((d) => {
      let st = (i.docs || {})[d.key] || "Not yet";
      if (d.key === "roi" && i.roiDeclined && !(i.signatures || {}).roi) st = "Declined — recorded";
      if ((i.signatures || {})[d.key]) st = "Signed in dashboard";
      return `<div class="meta">${d.required ? "<strong>Required:</strong> " : ""}${esc(d.label)} — <strong>${esc(st)}</strong> <button class="btn-small btn-doc" type="button" data-int="${esc(i.id)}" data-doc="${esc(d.key)}">Change</button></div>`;
    }).join("");
    const sigs = i.signatures || {};
    const isOpen = i.status !== "Approved" && i.status !== "Not approved";
    const signBtns = isOpen ? `<p class="no-print">
      ${!sigs.agreement ? `<button class="btn-small btn-sign" type="button" data-int="${esc(i.id)}" data-doc="agreement">Sign Intake &amp; Participation Agreement</button> ` : ""}
      ${!sigs.roi && !i.roiDeclined ? `<button class="btn-small btn-sign" type="button" data-int="${esc(i.id)}" data-doc="roi">Sign Release of Information</button> <button class="btn-small btn-decline-roi" type="button" data-int="${esc(i.id)}">Record ROI declined</button> ` : ""}
      ${sigs.agreement || sigs.roi || i.roiDeclined ? `<button class="btn-small btn-print-signed" type="button" data-int="${esc(i.id)}">Print signed intake summary</button>` : ""}</p>` : "";
    li.innerHTML = `<strong>${esc(i.id)} — ${esc(i.name)}</strong> <span class="meta">${esc(i.date)} · by ${esc(i.by)} · ${esc(i.living)} · ${esc(status)}</span>
      <div class="meta">Programs: ${esc(i.programs || "—")} · Insurance: ${esc(i.insurance)}${i.needs ? " · Needs: " + esc(i.needs) : ""}${i.notes ? "<br>" + esc(i.notes) : ""}</div>${i.answers && i.answers.length ? `<details><summary class="meta">Full intake answers (${i.answers.length})</summary>` + i.answers.map((a) => `<div class="meta">${esc(a[0])}: ${esc(a[1])}</div>`).join("") + `</details>` : ""}${docs}
      ${signedDocsHtml(i)}${signBtns}
      ${isOpen ? `<p class="no-print"><button class="btn-small btn-approve" type="button" data-int="${esc(i.id)}" ${ready ? "" : "disabled"}>Approve intake — becomes a member</button> <button class="btn-small btn-deny" type="button" data-int="${esc(i.id)}">Not approved</button>${ready ? "" : ' <span class="hint">Approval unlocks when the photo ID copy is in, the agreement is signed, and the ROI is signed or its decline is recorded.</span>'}</p>` : ""}`;
    ul.appendChild(li);
  }
  ul.querySelectorAll(".btn-doc").forEach((b) => b.addEventListener("click", () => {
    const rows2 = loadIntakes(); const it = rows2.find((x) => x.id === b.dataset.int); if (!it) return;
    it.docs = it.docs || {}; const cur = it.docs[b.dataset.doc] || "Not yet";
    it.docs[b.dataset.doc] = DOC_STATES[(DOC_STATES.indexOf(cur) + 1) % DOC_STATES.length];
    saveIntakes(rows2); renderIntakes();
  }));
  ul.querySelectorAll(".btn-approve").forEach((b) => b.addEventListener("click", () => {
    const rows2 = loadIntakes(); const it = rows2.find((x) => x.id === b.dataset.int); if (!it || !intakeReady(it)) return;
    const ids = nextMemberIds(); it.memberCode = ids.code; it.memberNo = ids.no; it.status = "Approved"; it.approvedOn = new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" });
    saveIntakes(rows2); renderIntakes(); renderClientList();
    setStatus(it.name + " approved — now a member, " + ids.code + " (" + ids.no + "). Carry the intake into their new locked binder.");
  }));
  ul.querySelectorAll(".btn-deny").forEach((b) => b.addEventListener("click", () => {
    const rows2 = loadIntakes(); const it = rows2.find((x) => x.id === b.dataset.int); if (!it) return;
    it.status = "Not approved"; saveIntakes(rows2); renderIntakes();
  }));
  ul.querySelectorAll(".btn-sign").forEach((b) => b.addEventListener("click", () => openSignView(b.dataset.int, b.dataset.doc)));
  ul.querySelectorAll(".btn-decline-roi").forEach((b) => b.addEventListener("click", () => openDeclineView(b.dataset.int)));
  ul.querySelectorAll(".btn-print-signed").forEach((b) => b.addEventListener("click", () => showSignedSummary(b.dataset.int)));
}
/* ---------------- intake signature capture (CPP-POL-2026-043) ----------------
   The client signs in person, on the staff device, inside this dashboard —
   no outside signature service, and nothing leaves this device. The
   signature image, signer name, document name, automatic date/time stamp,
   and the staff member present save onto the intake record in the same
   local store as the rest of the intake. The signed intake summary prints
   from here and is carried into the client's locked binder, which remains
   the official record. */
const ESIGN_CONSENT = "I agree to sign this document electronically and understand my electronic signature has the same effect as a handwritten one.";
function openSignView(intakeId, docKey) {
  const it = intakeById(intakeId);
  const doc = (window.SIGN_DOCS || {})[docKey];
  if (!it) return;
  if (!doc) { setStatus("The signable documents are still loading — wait a moment and try again."); return; }
  hideForms();
  const view = $("sign-view");
  view.hidden = false;
  view.innerHTML = `
    <h2>Sign — ${esc(doc.title)}</h2>
    <p class="meta">For: ${esc(it.name)} (${esc(it.id)}) · Document: ${esc(doc.source)}</p>
    <p class="hint">Read the document with the client first. The client signs below, on this device, with a finger or the mouse. The date and time are stamped automatically when the signature is saved.</p>
    <div class="sign-doc-scroll">${doc.text ? `<pre class="sign-doc-pre">${esc(doc.text)}</pre>` : doc.html}</div>
    <div class="grid2">
      <div><label for="sg-name">Signer — print full name</label>
      <input type="text" id="sg-name" value="${esc(it.name)}" autocomplete="off"></div>
      <div><label for="sg-staff">Staff member present</label>
      <input type="text" id="sg-staff" value="${esc(state.user ? state.user.name : "")}" autocomplete="off"></div>
    </div>
    <p><label><input type="checkbox" id="sg-consent"> ${esc(ESIGN_CONSENT)}</label></p>
    <div class="sig-pad-wrap">
      <label>Signature — draw in the box</label>
      <canvas id="sg-pad" class="sig-pad"></canvas>
      <p class="no-print"><button class="btn-small" id="sg-clear" type="button">Clear / redo signature</button></p>
    </div>
    <p class="no-print"><button class="btn-small" id="sg-save" type="button" disabled>Sign and save</button>
    <button class="btn-small" id="sg-cancel" type="button">Cancel</button>
    <span class="hint" id="sg-msg"></span></p>`;
  view.scrollIntoView({ behavior: "smooth", block: "start" });
  const canvas = $("sg-pad");
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(300, Math.round(rect.width * dpr));
  canvas.height = Math.round(190 * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = "#10243e"; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  let drawing = false, dirty = false, last = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const validate = () => {
    const ok = dirty && $("sg-consent").checked && $("sg-name").value.trim() && $("sg-staff").value.trim();
    $("sg-save").disabled = !ok;
    $("sg-msg").textContent = ok ? "" : "Needs: the signature drawn, the consent box checked, and both names filled in.";
  };
  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); drawing = true; last = pos(e); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p; dirty = true; validate();
  });
  const stop = () => { drawing = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  $("sg-clear").addEventListener("click", () => { ctx.clearRect(0, 0, rect.width, 190); dirty = false; validate(); });
  $("sg-consent").addEventListener("change", validate);
  $("sg-name").addEventListener("input", validate);
  $("sg-staff").addEventListener("input", validate);
  validate();
  $("sg-cancel").addEventListener("click", () => { view.hidden = true; view.innerHTML = ""; });
  $("sg-save").addEventListener("click", () => {
    const rows = loadIntakes();
    const rec = rows.find((x) => x.id === intakeId);
    if (!rec) return;
    const out = document.createElement("canvas");
    out.width = Math.round(rect.width); out.height = 190;
    out.getContext("2d").drawImage(canvas, 0, 0, out.width, out.height);
    rec.signatures = rec.signatures || {};
    rec.signatures[docKey] = {
      docKey, docTitle: doc.title,
      signerName: $("sg-name").value.trim(),
      staffName: $("sg-staff").value.trim(),
      signedAt: new Date().toISOString(),
      consent: ESIGN_CONSENT,
      image: out.toDataURL("image/png")
    };
    rec.docs = rec.docs || {};
    rec.docs[docKey] = "Received";
    saveIntakes(rows);
    view.hidden = true; view.innerHTML = "";
    renderIntakes();
    setStatus(doc.title + " signed by " + rec.signatures[docKey].signerName + " — saved on this device. Print the signed intake summary to file it in the client's locked binder.");
  });
}
function openDeclineView(intakeId) {
  const it = intakeById(intakeId);
  if (!it) return;
  hideForms();
  const view = $("sign-view");
  view.hidden = false;
  view.innerHTML = `
    <h2>Record declined — Release of Information</h2>
    <p class="meta">For: ${esc(it.name)} (${esc(it.id)})</p>
    <p class="hint">The client was offered the Release of Information and declined to sign it. Record the decline here, with the date and time stamped automatically. A declined ROI does not block the rest of intake, and the client can sign one later at any time.</p>
    <div class="grid2">
      <div><label for="dc-name">Client — print full name</label>
      <input type="text" id="dc-name" value="${esc(it.name)}" autocomplete="off"></div>
      <div><label for="dc-staff">Staff member recording the decline</label>
      <input type="text" id="dc-staff" value="${esc(state.user ? state.user.name : "")}" autocomplete="off"></div>
    </div>
    <p class="no-print"><button class="btn-small" id="dc-save" type="button">Record decline</button>
    <button class="btn-small" id="dc-cancel" type="button">Cancel</button></p>`;
  view.scrollIntoView({ behavior: "smooth", block: "start" });
  $("dc-cancel").addEventListener("click", () => { view.hidden = true; view.innerHTML = ""; });
  $("dc-save").addEventListener("click", () => {
    if (!$("dc-name").value.trim() || !$("dc-staff").value.trim()) { setStatus("Both names are needed to record the ROI decline."); return; }
    const rows = loadIntakes();
    const rec = rows.find((x) => x.id === intakeId);
    if (!rec) return;
    rec.roiDeclined = { clientName: $("dc-name").value.trim(), staffName: $("dc-staff").value.trim(), recordedAt: new Date().toISOString() };
    saveIntakes(rows);
    view.hidden = true; view.innerHTML = "";
    renderIntakes();
    setStatus("ROI decline recorded for " + rec.name + " — the rest of intake continues.");
  });
}
function showSignedSummary(intakeId) {
  const it = intakeById(intakeId);
  if (!it) return;
  hideForms();
  const pv = $("packet-view");
  pv.hidden = false;
  const docStatus = INTAKE_DOCS.map((d) => {
    let st = (it.docs || {})[d.key] || "Not yet";
    if (d.key === "roi" && it.roiDeclined && !(it.signatures || {}).roi) st = "Declined — recorded";
    if ((it.signatures || {})[d.key]) st = "Signed in dashboard";
    return `<p><strong>${esc(d.label)}</strong> — ${esc(st)}</p>`;
  }).join("");
  pv.innerHTML = `
    <h2>Signed Intake Summary — ${esc(it.name)}</h2>
    <p class="meta">Centipede Peer to Peer, LLC · LIC: 0714781 · 717 E. Longview Ave., Stockton, CA 95207</p>
    <p class="meta">Intake ${esc(it.id)} · Opened ${esc(it.date)} by ${esc(it.by)}${it.status === "Approved" ? " · Approved — member " + esc(it.memberCode || "") + " (" + esc(it.memberNo || "") + ")" : " · Status: " + esc(it.status)}</p>
    <p class="meta">Prepared: ${esc(fmtDT(new Date().toISOString()))} · Print this summary and file it in the client's locked binder — the binder is the official record. The electronic record stays on the device where the intake was worked until the live database step.</p>
    ${it.answers && it.answers.length ? `<h3>Intake answers</h3>` + it.answers.map((a) => `<p class="meta"><strong>${esc(a[0])}:</strong> ${esc(a[1])}</p>`).join("") : ""}
    <h3>Required documents (CPP-POL-2026-043)</h3>${docStatus}
    <h3>Signed documents</h3>${signedDocsHtml(it) || "<p>None signed yet.</p>"}
    <p class="meta">Non-clinical peer support only — not medical, psychiatric, or legal advice. In an emergency, call 911. Client information is confidential; share only with a signed release of information or a judge-signed court order, per company practice.</p>
    <p class="no-print"><button class="btn-small" id="btn-print-summary" type="button">Print this summary</button>
    <button class="btn-small" id="btn-close-summary" type="button">Close summary</button></p>`;
  $("btn-print-summary").addEventListener("click", () => window.print());
  $("btn-close-summary").addEventListener("click", () => { pv.hidden = true; });
  pv.scrollIntoView({ behavior: "smooth", block: "start" });
}
function initIntake() {
  const f = $("intake-form"); if (!f) return;
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    const rows = loadIntakes();
    const id = "INT-" + String(rows.length + 1).padStart(4, "0");
const answers = [];
    const F = (id, label) => { const el = $("int-" + id); const v = el ? (el.value || "").trim() : ""; if (v) answers.push([label, v]); return v; };
    const v_name = F("name", "Full legal name");
    const v_pname = F("pname", "Preferred name — what should we call you");
    const v_dob = F("dob", "Date of birth");
    const v_gender = F("gender", "Gender (optional)");
    const v_pronouns = F("pronouns", "Pronouns (optional)");
    const v_language = F("language", "Preferred language");
    const v_interpreter = F("interpreter", "Interpreter needed?");
    const v_phone = F("phone", "Phone number");
    const v_textok = F("textok", "May we text this number?");
    const v_email = F("email", "Email (if any)");
    const v_besttime = F("besttime", "Best time to reach you");
    const v_reach = F("reach", "Mailing address, or where we can reach you");
    const v_messages = F("messages", "Is it safe to leave messages?");
    const v_living = F("living", "Current living situation");
    const v_slept = F("slept", "Where did you sleep last night?");
    const v_howlong = F("howlong", "How long in your current situation?");
    const v_household = F("household", "Who is in your household?");
    const v_kids = F("kids", "Children with you — how many, and their ages");
    const v_pets = F("pets", "Pets or service animal");
    const v_vehicle = F("vehicle", "Do you live in a vehicle?");
    const v_ecname = F("ecname", "Emergency contact — name");
    const v_ecrel = F("ecrel", "Relationship");
    const v_ecphone = F("ecphone", "Emergency contact — phone");
    const v_ecok = F("ecok", "May we contact them in an emergency?");
    const v_source = F("source", "How did you find Centipede?");
    const v_referredby = F("referredby", "Referred by (person or agency)");
    const v_prior = F("prior", "Have you worked with Centipede before?");
    const v_employment = F("employment", "Employment status");
    const v_income = F("income", "Income sources (SSI, SSDI, GA, VA, work, none, other)");
    const v_benefits = F("benefits", "Benefits you receive now");
    const v_applyfor = F("applyfor", "Benefits you want help applying for");
    const v_payee = F("payee", "Do you have a representative payee?");
    const v_bankacct = F("bankacct", "Do you have a bank account? (Banking Program)");
    const v_docid = F("docid", "Photo ID");
    const v_docbc = F("docbc", "Birth certificate");
    const v_docssc = F("docssc", "Social Security card (never the number)");
    const v_docins = F("docins", "Insurance card");
    const v_insurance = F("insurance", "Insurance coverage");
    const v_doctor = F("doctor", "Do you have a regular doctor? Where do you get care?");
    const v_pharmacy = F("pharmacy", "Pharmacy you use");
    const v_providers = F("providers", "Other case managers or agencies helping you");
    const v_medsupport = F("medsupport", "Medication support you want (peer help only)");
    const v_planaround = F("planaround", "Anything we should plan around so you can use our services (mobility, appointments, reminders)");
    const v_dietary = F("dietary", "Food allergies or dietary needs (for food bags)");
    const v_safe = F("safe", "Do you feel safe where you are staying?");
    const v_urgent = F("urgent", "Anything urgent tonight? (shelter, food, medical — in an emergency we call 911)");
    const v_safetynote = F("safetynote", "Anything about your safety we should know? (optional)");
    const v_courtcase = F("courtcase", "Do you have a current court case?");
    const v_courtcounty = F("courtcounty", "Court / county");
    const v_atty = F("atty", "Attorney of record — name");
    const v_attyphone = F("attyphone", "Attorney phone");
    const v_probation = F("probation", "Probation or parole");
    const v_officer = F("officer", "Probation / parole officer");
    const v_courtdate = F("courtdate", "Next court date");
    const v_veteran = F("veteran", "Are you a veteran? (your status is yours to share)");
    const v_branch = F("branch", "Branch of service");
    const v_era = F("era", "Era of service");
    const v_dd214 = F("dd214", "DD-214");
    const v_vaenrolled = F("vaenrolled", "Enrolled with the VA?");
    const v_vabenefits = F("vabenefits", "VA benefits");
    const v_vic = F("vic", "Veteran ID Card held? (never the number)");
    const v_goal = F("goal", "What is your main goal right now?");
    const v_checkins = F("checkins", "How often do you want us to check in?");
    const v_meetplace = F("meetplace", "Best place to meet you");
    const v_anythingelse = F("anythingelse", "Anything else we should know?");
    const v_boundaries = F("boundaries", "Anything you do NOT want us to do?");
    const v_consentphone = F("consentphone", "May we contact you by phone?");
    const v_consenttext = F("consenttext", "May we contact you by text?");
    const v_consentcoord = F("consentcoord", "May we coordinate with other agencies helping you? Which ones?");
    const v_consentmedia = F("consentmedia", "Photo / media consent (optional — never required)");
    const v_followup = F("followup", "Follow-up appointment set for");
    const v_nextsteps = F("nextsteps", "Next steps agreed");
    const v_notes = F("notes", "Intake notes");
    const needsList = Array.from(document.querySelectorAll(".int-need:checked")).map((x) => x.value);
    const progList = Array.from(document.querySelectorAll(".int-prog:checked")).map((x) => x.value);
    if (needsList.length) answers.push(["Needs help with", needsList.join("; ")]);
    if (progList.length) answers.push(["Programs asking about", progList.join("; ")]);
    rows.unshift({ id, name: v_name, dob: v_dob, phone: v_phone, email: v_email, reach: v_reach, living: v_living, emergency: [v_ecname, v_ecrel, v_ecphone].filter(Boolean).join(" — "), source: v_source, programs: progList.join("; "), needs: needsList.join("; "), insurance: v_insurance, notes: v_notes, answers, date: new Date().toLocaleDateString("en-US", { timeZone: "America/Los_Angeles" }), by: state.user ? state.user.name : "", status: "In progress", docs: {} });
    saveIntakes(rows); f.reset(); renderIntakes();
    $("intake-msg").textContent = "Intake " + id + " opened.";
  });
  renderIntakes();
}

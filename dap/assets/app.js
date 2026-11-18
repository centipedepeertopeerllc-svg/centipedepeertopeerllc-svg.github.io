"use strict";
/* Centipede Peer to Peer, LLC — DAP Noting Dashboard.
   Structure follows Form DAP-SKEL-01 (APPROVED FINAL, Nov 9, 2026).
   Rules enforced here:
   - No client names render before login.
   - Saved notes are never edited or deleted in this UI. Corrections are
     new, dated addendum rows pointing at the original.
   - Every row carries author + server/local timestamps (source-traced).
   - Saves are serialized through one queue; the queue flushes on
     pagehide / visibilitychange, and data refreshes on focus / open. */
const CFG = window.DAP_CONFIG;
const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  mode: "local",            // "supabase" once the dap_notes table answers
  notes: [],                // all rows loaded for the signed-in session
  selectedClient: null,
  selectedNoteId: null,
  saveChain: Promise.resolve(),
  outbox: []                // rows waiting to reach Supabase
};

const LS_NOTES = "dapdash.notes.v1";
const LS_OUTBOX = "dapdash.outbox.v1";

/* ---------------- utilities ---------------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
const fmtDT = (iso) => { try { return new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles" }); } catch { return iso || ""; } };
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

/* ---------------- Supabase REST layer (publishable key only) ---------------- */
function sbHeaders(extra = {}) {
  return Object.assign({
    apikey: CFG.supabasePublishableKey,
    Authorization: "Bearer " + CFG.supabasePublishableKey,
    "Content-Type": "application/json"
  }, extra);
}
async function sbFetchNotes() {
  const res = await fetch(`${CFG.supabaseUrl}/rest/v1/${CFG.table}?select=*&order=created_at.desc`, { headers: sbHeaders() });
  if (!res.ok) throw new Error("Supabase notes fetch failed: " + res.status);
  return res.json();
}
async function sbInsertNote(row) {
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
  try { return JSON.parse(localStorage.getItem(LS_NOTES) || "[]"); } catch { return []; }
}
function saveLocal(notes) { localStorage.setItem(LS_NOTES, JSON.stringify(notes)); }
function loadOutbox() { try { return JSON.parse(localStorage.getItem(LS_OUTBOX) || "[]"); } catch { return []; } }
function saveOutbox() { localStorage.setItem(LS_OUTBOX, JSON.stringify(state.outbox)); }

/* ---------------- data loading ---------------- */
async function refreshNotes(quiet = false) {
  let remote = null;
  try { remote = await sbFetchNotes(); } catch { remote = null; }
  if (remote) {
    state.mode = "supabase";
    // Merge: remote rows win; keep any local rows not yet pushed.
    const remoteIds = new Set(remote.map((r) => r.id));
    const localOnly = loadLocal().filter((r) => !remoteIds.has(r.id));
    state.notes = [...remote, ...localOnly].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    saveLocal(state.notes);
  } else {
    state.mode = "local";
    state.notes = loadLocal().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  renderBanner();
  renderNoteList();
  if (!quiet) setStatus(state.notes.length ? "" : "No notes loaded yet.");
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
  state.notes = [row, ...state.notes.filter((r) => r.id !== row.id)];
  if (state.mode === "supabase") {
    try {
      const saved = await sbInsertNote(row);
      const idx = state.notes.findIndex((r) => r.id === row.id);
      if (idx >= 0) state.notes[idx] = saved;
      saveLocal(state.notes);
      setStatus("Saved ✓ " + fmtDT(saved.created_at || row.created_at));
    } catch {
      state.outbox.push(row); saveOutbox();
      setStatus("Saved on this device — will send to the database when it answers. Do not clear browser data.");
    }
  } else {
    state.outbox.push(row); saveOutbox();
    setStatus("Saved on this device (database table not connected yet — see README).");
  }
  renderNoteList();
}
async function flushOutbox() {
  if (!state.outbox.length) return;
  try { await sbFetchNotes(); } catch { return; } // database still unreachable
  const pending = [...state.outbox];
  state.outbox = []; saveOutbox();
  for (const row of pending) {
    try { await sbInsertNote(row); }
    catch { state.outbox.push(row); saveOutbox(); }
  }
  if (!state.outbox.length) { state.mode = "supabase"; await refreshNotes(true); }
}

/* ---------------- login ---------------- */
function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.dap.v1",
    sessionKey: "dapdash.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}
async function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  buildApp();
  state.outbox = loadOutbox();
  await refreshNotes();
  flushOutbox();
}

/* ---------------- app build ---------------- */
function buildApp() {
  const cs = $("client-select");
  cs.innerHTML = CFG.clients.map((c) => `<option value="${esc(c.code)}">${esc(c.label)}</option>`).join("");
  state.selectedClient = CFG.clients[0].code;
  cs.addEventListener("change", () => { state.selectedClient = cs.value; state.selectedNoteId = null; renderNoteList(); clearView(); showCarried(); });

  const au = $("f-author");
  au.innerHTML = CFG.authors.map((a) => `<option ${a === state.user.name ? "selected" : ""}>${esc(a)}</option>`).join("");

  const checklistItems = [
    "Client number, date, and time of contact are present",
    "Persons present and contact type are recorded",
    "Transcript is on file and named — or marked “None — notes only”",
    "The client’s own words are quoted in Data",
    "Actions taken by the peer supporter are recorded in Assessment",
    "No inferred facts — gaps are marked as gaps",
    "Every Plan item carries an owner and a date; carried-forward items are flagged",
    "Banned-language scan passed (no treatment / therapy / counseling / diagnose / clinical assessment / “patient” as Centipede’s act or service)"
  ];
  $("checklist").innerHTML = checklistItems.map((t, i) => `<label class="check"><input type="checkbox" class="ck" id="ck-${i}"> ${esc(t)}</label>`).join("");

  addPlanRow();
  $("add-plan-btn").addEventListener("click", () => addPlanRow());
  $("new-note-btn").addEventListener("click", startNewNote);
  $("refresh-btn").addEventListener("click", () => refreshNotes());
  $("logout-btn").addEventListener("click", () => { sessionStorage.removeItem("dapdash.user"); location.reload(); });
  $("note-form").addEventListener("submit", onSaveNote);
  $("addendum-form").addEventListener("submit", onSaveAddendum);
  $("addendum-cancel").addEventListener("click", () => { $("addendum-form").hidden = true; });

  // Save-reliability standard: flush on leave, refresh on return.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushOutbox();
    if (document.visibilityState === "visible") refreshNotes(true);
  });
  window.addEventListener("pagehide", () => flushOutbox());
  window.addEventListener("focus", () => refreshNotes(true));

  startNewNote();
}

function renderBanner() {
  const b = $("mode-banner");
  if (state.mode === "supabase") {
    b.className = "banner ok";
    b.textContent = "Connected to the Centipede database (Supabase). Notes save to the database and are source-traced to their author.";
  } else {
    b.className = "banner warn";
    b.textContent = "LOCAL MODE: the database table (dap_notes) is not connected yet, so notes are stored only on this device. Run the one-step SQL in the supabase folder (see README) to connect the database — do not enter real client notes until Levi confirms the database is connected.";
  }
}

/* ---------------- note list & view ---------------- */
function clientNotes() {
  return state.notes.filter((n) => n.client_code === state.selectedClient);
}
function renderNoteList() {
  const ul = $("note-list");
  const rows = clientNotes();
  ul.innerHTML = rows.length ? "" : "<li>No notes yet for this client.</li>";
  for (const n of rows) {
    const li = document.createElement("li");
    if (n.id === state.selectedNoteId) li.className = "active";
    li.innerHTML = `<strong>${esc(fmtDT(n.contact_at || n.created_at))}</strong>
      <span class="badge">${n.note_kind === "addendum" ? "Addendum" : "DAP note"}</span>
      <div class="meta">By ${esc(n.author)} · entered ${esc(fmtDT(n.created_at))}</div>
      <div class="meta">${esc((n.data_text || "").slice(0, 90))}…</div>`;
    li.addEventListener("click", () => { state.selectedNoteId = n.id; renderNoteList(); viewNote(n); });
    ul.appendChild(li);
  }
}
function planTable(items) {
  if (!items || !items.length) return "<p>No plan steps recorded.</p>";
  const rows = items.map((p) => `<tr><td>${esc(p.step)}</td><td>${esc(p.owner)}</td><td>${esc(p.due)}</td><td>${p.carried ? "Carried forward" : ""}${p.closed ? " · Closed in a later note" : ""}</td></tr>`).join("");
  return `<table><thead><tr><th>Step</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function viewNote(n) {
  $("note-form").hidden = true; $("addendum-form").hidden = true;
  const addenda = state.notes.filter((x) => x.note_kind === "addendum" && x.parent_note_id === n.id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  $("note-view").innerHTML = `
    <h2>${n.note_kind === "addendum" ? "Addendum" : "DAP note"} — ${esc(n.client_name || n.client_code)}</h2>
    <p class="meta">Contact: ${esc(fmtDT(n.contact_at))} · Author: ${esc(n.author)} · Entered: ${esc(fmtDT(n.created_at))} · Source: this dashboard entry (author + timestamp on the record)</p>
    <p class="meta">Location: ${esc(n.location || "Not stated")} · Contact type: ${esc(n.contact_type || "Not stated")} · Persons present: ${esc(n.persons_present || "Not stated")} · Transcript on file: ${esc(n.transcript_file || "Not stated")}</p>
    <h3>D — Data</h3><blockquote>${esc(n.data_text)}</blockquote>
    <h3>A — Assessment (peer observation)</h3>
    <p><strong>Observed:</strong></p><blockquote>${esc(n.assessment_observed || "Not stated")}</blockquote>
    <p><strong>Actions taken:</strong></p><blockquote>${esc(n.assessment_actions || "Not stated")}</blockquote>
    <p><strong>Inferred / gaps:</strong></p><blockquote>${esc(n.assessment_gaps || "None marked")}</blockquote>
    <h3>P — Plan</h3>${planTable(n.plan_items)}
    <p class="meta">Restricted block: ${esc(n.restricted_block || "None recorded.")}</p>
    ${addenda.length ? "<h3>Addenda (dated corrections — originals stand as written)</h3>" + addenda.map((a) => `<blockquote><strong>${esc(fmtDT(a.created_at))} — ${esc(a.author)}:</strong>\n${esc(a.data_text)}</blockquote>`).join("") : ""}
    <p class="no-print"><button class="btn-small" id="btn-addendum" type="button">Add a dated correction / addendum</button>
    <button class="btn-small" id="btn-print" type="button">Print this note</button></p>`;
  $("btn-addendum").addEventListener("click", () => {
    $("addendum-target").textContent = "Addendum to the note above (contact " + fmtDT(n.contact_at) + ", by " + n.author + "). The original will not be changed.";
    $("addendum-form").hidden = false;
    $("addendum-form").dataset.parent = n.id;
    $("a-text").focus();
  });
  $("btn-print").addEventListener("click", () => window.print());
}
function clearView() { $("note-view").innerHTML = ""; }

/* ---------------- new note ---------------- */
function latestNoteForClient() {
  return clientNotes().find((n) => n.note_kind === "note") || null;
}
function openPlanItems() {
  const latest = latestNoteForClient();
  if (!latest || !Array.isArray(latest.plan_items)) return [];
  return latest.plan_items.filter((p) => !p.closed).map((p) => ({ ...p }));
}
function showCarried() {
  const box = $("carried-list");
  const open = openPlanItems();
  if (!open.length) { box.innerHTML = "<p class='hint'>No open plan items from a prior note for this client.</p>"; return; }
  box.innerHTML = "";
  open.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "carried-item";
    div.innerHTML = `<input type="checkbox" class="carried-close" data-i="${i}" style="margin-top:.2rem">
      <span><strong>${esc(p.step)}</strong><br>Owner: ${esc(p.owner)} · Due: ${esc(p.due)}<br>
      <em>Check the box only if this item is closed in the new note. Unchecked items are carried forward again automatically.</em></span>`;
    box.appendChild(div);
  });
}
function startNewNote() {
  clearView();
  $("addendum-form").hidden = true;
  $("note-form").hidden = false;
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $("f-contact-at").value = now.toISOString().slice(0, 16);
  showCarried();
  $("f-data").focus();
}
function addPlanRow(step = "", owner = "", due = "", carried = false) {
  const wrap = $("plan-rows");
  const div = document.createElement("div");
  div.className = "plan-row";
  const owners = [...CFG.authors, "Client", "Other (write in step)"];
  div.innerHTML = `
    <input type="text" class="p-step" placeholder="Next step / referral / follow-up owed" value="${esc(step)}">
    <select class="p-owner">${owners.map((o) => `<option ${o === owner ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>
    <input type="date" class="p-due" value="${esc(due)}">
    <label class="check" title="Carried forward from the prior note"><input type="checkbox" class="p-carried" ${carried ? "checked" : ""}> Carried fwd</label>`;
  wrap.appendChild(div);
}

/* ---------------- banned-language scan ---------------- */
const BANNED = ["treatment", "therapy", "counseling", "diagnose", "diagnosed", "diagnosis", "clinical assessment", "patient"];
function scanText(form) {
  const fields = [
    ["Data", $("f-data").value], ["Assessment — observed", $("f-assessment-observed").value],
    ["Assessment — actions", $("f-assessment-actions").value],
    ...[...document.querySelectorAll(".p-step")].map((el, i) => ["Plan step " + (i + 1), el.value])
  ];
  const hits = [];
  for (const [name, text] of fields) {
    const low = " " + text.toLowerCase() + " ";
    for (const w of BANNED) if (low.includes(w)) hits.push(`${name}: “${w}”`);
  }
  return hits;
}

/* ---------------- saves ---------------- */
async function onSaveNote(e) {
  e.preventDefault();
  const checks = [...document.querySelectorAll(".ck")];
  if (checks.some((c) => !c.checked)) { alert("The completeness checklist must fully pass before this note can be saved."); return; }
  const hits = scanText();
  if (hits.length && !$("f-quote-override").checked) {
    $("scan-result").textContent = "Banned-language scan flagged: " + hits.join("; ") + ". Remove these words as Centipede’s act or service — or, if a word appears only inside a client’s quoted words in Data, check the override box above.";
    return;
  }
  $("scan-result").textContent = "";

  // Plan rows from the form.
  const planItems = [];
  document.querySelectorAll(".plan-row").forEach((row) => {
    const step = row.querySelector(".p-step").value.trim();
    if (!step) return;
    planItems.push({ step, owner: row.querySelector(".p-owner").value, due: row.querySelector(".p-due").value, carried: row.querySelector(".p-carried").checked, closed: false });
  });
  // Carried-forward handling: unchecked open items carry forward again;
  // checked items are recorded as closed by this note (in the new note's
  // addendum trail — the ORIGINAL note is never modified).
  const open = openPlanItems();
  const closedNow = [];
  document.querySelectorAll(".carried-close").forEach((cb) => {
    const item = open[Number(cb.dataset.i)];
    if (!item) return;
    if (cb.checked) closedNow.push(item);
    else if (!planItems.some((p) => p.step === item.step)) planItems.push({ ...item, carried: true, closed: false });
  });

  const client = CFG.clients.find((c) => c.code === state.selectedClient);
  const priorNote = latestNoteForClient(); // captured BEFORE the new row saves
  const row = {
    id: uuid(),
    client_code: client.code,
    client_name: client.label,
    contact_at: new Date($("f-contact-at").value).toISOString(),
    author: $("f-author").value,
    location: $("f-location").value.trim(),
    contact_type: $("f-contact-type").value,
    persons_present: $("f-persons").value.trim(),
    transcript_file: $("f-transcript").value.trim(),
    carried_reviewed: $("f-carried-reviewed").checked,
    data_text: $("f-data").value.trim(),
    assessment_observed: $("f-assessment-observed").value.trim(),
    assessment_actions: $("f-assessment-actions").value.trim(),
    assessment_gaps: $("f-assessment-gaps").value.trim(),
    plan_items: planItems,
    restricted_block: $("f-restricted").value.trim() || "None recorded.",
    checklist_passed: true,
    note_kind: "note",
    parent_note_id: null,
    created_at: new Date().toISOString(),
    created_by: state.user.name
  };
  await enqueueSave(row);
  if (closedNow.length) {
    const add = {
      id: uuid(), client_code: client.code, client_name: client.label,
      contact_at: row.contact_at, author: row.author,
      location: "", contact_type: "", persons_present: "", transcript_file: "",
      carried_reviewed: true,
      data_text: "Plan items closed by the note entered " + fmtDT(row.created_at) + ": " + closedNow.map((p) => "“" + p.step + "” (owner " + p.owner + ", due " + p.due + ")").join("; ") + ".",
      assessment_observed: "", assessment_actions: "", assessment_gaps: "",
      plan_items: [], restricted_block: "None recorded.", checklist_passed: true,
      note_kind: "addendum", parent_note_id: priorNote ? priorNote.id : null,
      created_at: new Date().toISOString(), created_by: state.user.name
    };
    // Attach the closure addendum to the PRIOR note (the one whose plan it was).
    await enqueueSave(add);
  }
  state.selectedNoteId = row.id;
  renderNoteList();
  viewNote(row);
  e.target.reset();
  document.querySelectorAll(".plan-row").forEach((r, i) => { if (i > 0) r.remove(); });
  $("note-form").hidden = true;
}

async function onSaveAddendum(e) {
  e.preventDefault();
  const parentId = $("addendum-form").dataset.parent;
  const parent = state.notes.find((n) => n.id === parentId);
  if (!parent) return;
  const row = {
    id: uuid(), client_code: parent.client_code, client_name: parent.client_name,
    contact_at: parent.contact_at, author: state.user.name,
    location: "", contact_type: "", persons_present: "", transcript_file: "",
    carried_reviewed: true,
    data_text: $("a-text").value.trim(),
    assessment_observed: "", assessment_actions: "", assessment_gaps: "",
    plan_items: [], restricted_block: "None recorded.", checklist_passed: true,
    note_kind: "addendum", parent_note_id: parentId,
    created_at: new Date().toISOString(), created_by: state.user.name
  };
  await enqueueSave(row);
  $("addendum-form").hidden = true;
  $("a-text").value = "";
  viewNote(parent);
}

/* ---------------- boot ---------------- */
(function boot() {
  initLogin();
  const user = CPPAuth.restoreSession();
  if (user) { state.user = user; enterApp(); }
})();

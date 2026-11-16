"use strict";
/* Centipede Peer to Peer, LLC — Banking Dashboard.
   Rules enforced here:
   - No financial data renders before login.
   - MANUAL ASSIGNMENT ONLY: nothing in this file assigns a transaction
     to a program card on its own. An assignment exists only when the
     signed-in CEO submits the assignment form; it is then recorded as a
     dated entry with its author. There is no automatic assignment logic.
   - Figures are point-in-time records labeled with their as-of date;
     they are never presented as live balances.
   - Saved entries are never edited or deleted in this UI. Corrections
     are new, dated addendum rows pointing at the original.
   - Saves are serialized through one queue; the queue flushes on
     pagehide / visibilitychange, and data refreshes on focus / open. */
const CFG = window.BANKING_CONFIG;
const $ = (id) => document.getElementById(id);

const state = {
  user: null,
  mode: "local",            // "supabase" once the banking_records table answers
  records: [],              // all rows loaded for the signed-in session
  saveChain: Promise.resolve(),
  outbox: []                // rows waiting to reach Supabase
};

const LS_RECORDS = "bankdash.records.v1";
const LS_OUTBOX = "bankdash.outbox.v1";

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
  renderAll();
  if (!quiet) setStatus(state.records.length ? "" : "No recorded entries yet.");
}

/* ---------------- serialized save queue ---------------- */
function enqueueSave(row) {
  state.saveChain = state.saveChain.then(() => persistRow(row)).catch(() => persistRow(row));
  return state.saveChain;
}
async function persistRow(row) {
  setStatus("Saving\u2026");
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
      setStatus("Saved \u2713 " + fmtDT(saved.created_at || row.created_at));
    } catch {
      state.outbox.push(row); saveOutbox();
      setStatus("Saved on this device \u2014 will send to the database when it answers. Do not clear browser data.");
    }
  } else {
    state.outbox.push(row); saveOutbox();
    setStatus("Saved on this device (database table not connected yet \u2014 see README).");
  }
  renderAll();
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
  sel.innerHTML = CFG.users.map((u) => `<option value="${esc(u.name)}">${esc(u.name)} \u2014 ${esc(u.role)}</option>`).join("");
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = CFG.users.find((u) => u.name === sel.value);
    const hash = await sha256Hex($("login-pin").value.trim());
    if (!user || hash !== user.accessCodeSha256) {
      $("login-error").textContent = "That name and access code do not match. Check the code and try once more, carefully.";
      return;
    }
    state.user = user;
    sessionStorage.setItem("bankdash.user", user.name);
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
  $("footer-disclosure").textContent = CFG.disclosure;

  const cardSel = $("assign-card");
  cardSel.innerHTML = CFG.programCards.map((c) => {
    const id = c.last4 ? "\u2022\u2022" + c.last4 : "last-4 pending capture";
    return `<option value="${esc(c.nickname)}">${esc(c.nickname)} \u2014 ${esc(id)}</option>`;
  }).join("");

  $("refresh-btn").addEventListener("click", () => refreshRecords());
  $("logout-btn").addEventListener("click", () => { sessionStorage.removeItem("bankdash.user"); location.reload(); });
  $("assign-form").addEventListener("submit", onSaveAssignment);
  $("assign-cancel").addEventListener("click", () => { $("assign-form").hidden = true; });
  $("tax-form").addEventListener("submit", onSaveTaxMark);
  $("tax-cancel").addEventListener("click", () => { $("tax-form").hidden = true; });
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
    b.textContent = "Connected to the Centipede database (Supabase). Entries save to the database and are source-traced to their author.";
  } else {
    b.className = "banner warn";
    b.textContent = "LOCAL MODE: the database table (banking_records) is not connected yet, so entries are stored only on this device. Run the one-step SQL in the supabase folder (see README) to connect the database \u2014 do not enter real financial records until Levi confirms the database is connected.";
  }
}

/* ---------------- derived views (read-only; no assignment happens here) ---------------- */
function pendingTransactions() {
  // Seed transactions from config, plus any transaction rows recorded in
  // the database/local store, minus those the CEO has already assigned
  // by a recorded manual assignment entry. This function only READS;
  // it never assigns anything.
  const assignedIds = new Set(
    state.records.filter((r) => r.record_type === "assignment").map((r) => (r.payload || {}).transaction_id)
  );
  const seeded = (CFG.pendingTransactions || []).map((t) => ({ source: "seed", ...t }));
  const recorded = state.records
    .filter((r) => r.record_type === "transaction")
    .map((r) => ({ source: "record", id: r.id, ...(r.payload || {}) }));
  return [...seeded, ...recorded].filter((t) => t.id && !assignedIds.has(t.id));
}
function taxCounts() {
  const marks = state.records.filter((r) => r.record_type === "tax_category");
  const assignments = state.records.filter((r) => r.record_type === "assignment");
  const markedIds = new Set(marks.map((r) => (r.payload || {}).entry_id));
  const unmarkedAssignments = assignments.filter((r) => !markedIds.has(r.id)).length;
  return {
    recordedPending: CFG.taxCenter.pendingAssignment,
    recordedNeeding: CFG.taxCenter.needingTaxCategory,
    sessionAssignments: assignments.length,
    sessionNeedingCategory: unmarkedAssignments
  };
}

/* ---------------- rendering (after login only) ---------------- */
function renderAll() {
  renderAccounts();
  renderCards();
  renderPending();
  renderTax();
  renderEntries();
}
function renderAccounts() {
  const el = $("accounts-strip");
  el.innerHTML = `<h2>Accounts on record</h2>
    <div class="account-grid">${CFG.accounts.map((a) => `
      <div class="account-tile">
        <div class="account-name">${esc(a.nickname)} \u2022\u2022${esc(a.last4)}</div>
        <div class="account-balance">${esc(a.balance)}</div>
        <div class="meta">${esc(a.asOf)}</div>
      </div>`).join("")}
    </div>
    <p class="disclosure">${esc(CFG.disclosure)}</p>`;
}
function renderCards() {
  const el = $("cards-section");
  el.innerHTML = `<h2>Program cards</h2>
    <p class="hint">All cards draw on ${esc("Checking \u2022\u20222468")} per the record. Assignment is manual only \u2014 the CEO assigns each transaction himself; nothing assigns itself.</p>
    <div class="card-grid">${CFG.programCards.map((c) => `
      <div class="card-tile">
        <div class="card-name">${esc(c.nickname)}</div>
        <div class="card-last4">${c.last4 ? "\u2022\u2022" + esc(c.last4) : "last-4 pending capture"}</div>
        <div class="meta">Limit: ${c.limit ? esc(c.limit) : "limit not on record"}</div>
        <div class="meta">Draws on: ${esc(c.drawsOn)}</div>
      </div>`).join("")}
    </div>`;
}
function renderPending() {
  const el = $("pending-section");
  const pending = pendingTransactions();
  if (!pending.length) {
    el.innerHTML = `<h2>Transactions pending assignment</h2>
      <p class="empty-state">No transactions are pending assignment on record ${esc(CFG.asOfLabel.toLowerCase())}. The sync for November 12\u201315, 2026 showed 0 transactions. When a transaction appears here, the CEO assigns it to a program card by hand \u2014 there is no automatic assignment.</p>`;
    return;
  }
  el.innerHTML = `<h2>Transactions pending assignment</h2>
    <p class="hint">Manual assignment only. Use Assign on a transaction and the assignment is recorded as a dated entry with its author.</p>` +
    pending.map((t) => `
      <div class="pending-row">
        <div><strong>${esc(t.description || "Transaction")}</strong>
        <div class="meta">${esc(t.date || "")} ${t.amount ? "\u00b7 " + esc(t.amount) : ""}</div></div>
        <button class="btn-small assign-btn" type="button" data-tx="${esc(t.id)}">Assign</button>
      </div>`).join("");
  el.querySelectorAll(".assign-btn").forEach((btn) => {
    btn.addEventListener("click", () => openAssignForm(btn.dataset.tx));
  });
}
function renderTax() {
  const el = $("tax-section");
  const counts = taxCounts();
  el.innerHTML = `<h2>Tax Center</h2>
    <div class="account-grid">
      <div class="account-tile">
        <div class="account-name">Transactions pending assignment</div>
        <div class="account-balance">${counts.recordedPending}</div>
        <div class="meta">${esc(CFG.taxCenter.asOf)} \u00b7 ${esc(CFG.taxCenter.pendingAssignmentNote)}</div>
      </div>
      <div class="account-tile">
        <div class="account-name">Entries needing a tax category</div>
        <div class="account-balance">${counts.recordedNeeding}</div>
        <div class="meta">${esc(CFG.taxCenter.asOf)} \u00b7 ${esc(CFG.taxCenter.needingTaxCategoryNote)}</div>
      </div>
      <div class="account-tile">
        <div class="account-name">Assignments recorded in this system</div>
        <div class="account-balance">${counts.sessionAssignments}</div>
        <div class="meta">${counts.sessionNeedingCategory} of these still need a tax category mark.</div>
      </div>
    </div>
    <p class="hint">${esc(CFG.taxCenter.cpaNote)} Working categories are for record-keeping only; this page does not prepare or file taxes and is not tax advice.</p>
    <p class="disclosure">${esc(CFG.disclosure)}</p>`;
}
function entrySummary(r) {
  const p = r.payload || {};
  if (r.record_type === "assignment") return `Assigned to ${p.card_nickname || ""}${p.note ? " \u2014 " + p.note : ""}`;
  if (r.record_type === "tax_category") return `Tax category: ${p.category || ""}${p.note ? " \u2014 " + p.note : ""}`;
  if (r.record_type === "addendum") return p.text || "";
  if (r.record_type === "transaction") return p.description || "Transaction";
  return "";
}
function renderEntries() {
  const ul = $("entry-list");
  const view = $("entries-section");
  const rows = state.records;
  view.innerHTML = `<h2>Entries recorded in this system</h2>
    <p class="hint">Assignments and tax-category marks appear here as dated, authored entries. Entries cannot be edited or deleted; a correction is a dated addendum.</p>` +
    (rows.length ? "" : `<p class="empty-state">No assignments or tax-category marks have been recorded yet.</p>`);
  ul.innerHTML = rows.length ? "" : "<li>No entries yet.</li>";
  for (const r of rows) {
    const li = document.createElement("li");
    const label = r.record_type === "assignment" ? "Manual assignment"
      : r.record_type === "tax_category" ? "Tax category"
      : r.record_type === "addendum" ? "Addendum" : "Entry";
    li.innerHTML = `<strong>${esc(fmtDT(r.created_at))}</strong>
      <span class="badge">${esc(label)}</span>
      <div class="meta">By ${esc(r.author)} \u00b7 entered ${esc(fmtDT(r.created_at))}</div>
      <div class="meta">${esc(entrySummary(r).slice(0, 140))}</div>
      <div class="no-print" style="margin-top:.35rem">
        <button class="btn-small btn-addendum" type="button">Add addendum</button>
        ${r.record_type === "assignment" ? `<button class="btn-small btn-taxmark" type="button">Mark tax category</button>` : ""}
      </div>`;
    li.querySelector(".btn-addendum").addEventListener("click", () => {
      $("addendum-target").textContent = "Addendum to the " + label.toLowerCase() + " entered " + fmtDT(r.created_at) + " by " + r.author + ". The original will not be changed.";
      $("addendum-form").hidden = false;
      $("addendum-form").dataset.parent = r.id;
      $("a-text").focus();
    });
    const taxBtn = li.querySelector(".btn-taxmark");
    if (taxBtn) taxBtn.addEventListener("click", () => {
      $("tax-target").textContent = "Tax-category mark for the assignment entered " + fmtDT(r.created_at) + " by " + r.author + " (" + entrySummary(r) + ").";
      $("tax-form").hidden = false;
      $("tax-form").dataset.entry = r.id;
      $("tax-category").focus();
    });
    ul.appendChild(li);
  }
}

/* ---------------- manual actions (CEO-submitted only) ---------------- */
function openAssignForm(txId) {
  const tx = pendingTransactions().find((t) => t.id === txId);
  if (!tx) return;
  $("assign-target").textContent = "Assign \u201c" + (tx.description || "Transaction") + "\u201d" + (tx.amount ? " (" + tx.amount + ")" : "") + (tx.date ? ", " + tx.date : "") + " to a program card. This records a dated entry with you as its author. Nothing is assigned until you submit this form.";
  $("assign-form").hidden = false;
  $("assign-form").dataset.tx = txId;
  $("assign-card").focus();
}
async function onSaveAssignment(e) {
  e.preventDefault();
  const txId = $("assign-form").dataset.tx;
  const tx = pendingTransactions().find((t) => t.id === txId);
  if (!tx) { $("assign-form").hidden = true; return; }
  const cardName = $("assign-card").value;
  const card = CFG.programCards.find((c) => c.nickname === cardName);
  const row = {
    id: uuid(),
    record_type: "assignment",
    payload: {
      transaction_id: tx.id,
      transaction_description: tx.description || "",
      transaction_date: tx.date || "",
      transaction_amount: tx.amount || "",
      card_nickname: cardName,
      card_last4: card ? card.last4 : null,
      note: $("assign-note").value.trim(),
      assigned_by_hand: true
    },
    author: state.user.name,
    created_at: new Date().toISOString()
  };
  await enqueueSave(row);
  $("assign-form").hidden = true;
  $("assign-note").value = "";
}
async function onSaveTaxMark(e) {
  e.preventDefault();
  const entryId = $("tax-form").dataset.entry;
  const category = $("tax-category").value.trim();
  if (!entryId || !category) return;
  const row = {
    id: uuid(),
    record_type: "tax_category",
    payload: {
      entry_id: entryId,
      category: category,
      note: $("tax-note").value.trim(),
      cpa_confirmation_pending: true
    },
    author: state.user.name,
    created_at: new Date().toISOString()
  };
  await enqueueSave(row);
  $("tax-form").hidden = true;
  $("tax-category").value = "";
  $("tax-note").value = "";
}
async function onSaveAddendum(e) {
  e.preventDefault();
  const parentId = $("addendum-form").dataset.parent;
  const parent = state.records.find((r) => r.id === parentId);
  if (!parent) return;
  const row = {
    id: uuid(),
    record_type: "addendum",
    payload: {
      parent_record_id: parentId,
      parent_record_type: parent.record_type,
      text: $("a-text").value.trim()
    },
    author: state.user.name,
    created_at: new Date().toISOString()
  };
  await enqueueSave(row);
  $("addendum-form").hidden = true;
  $("a-text").value = "";
}

/* ---------------- boot ---------------- */
(function boot() {
  initLogin();
  const saved = sessionStorage.getItem("bankdash.user");
  if (saved) {
    const user = CFG.users.find((u) => u.name === saved);
    if (user) { state.user = user; enterApp(); }
  }
})();

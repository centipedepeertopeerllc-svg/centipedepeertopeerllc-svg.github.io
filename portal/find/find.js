"use strict";
/* Centipede Peer to Peer, LLC — Portal Find (portal/find/find.js).
   Staff search, built Nov 26, 2026 at the CEO's direction: one search box
   that finds (1) published Portal content — policies, program pages, forms,
   documents, dashboards — from a static index (search-index.json, rebuilt
   when this page is rebuilt), and (2) records already entered ON THIS
   DEVICE in the dashboards' local stores, so staff can pull up something
   they already submitted and open the desk it lives in.

   Access: the page sits behind the Portal sign-in (same store/session as
   the Portal home). The device-records section is shown only to admin
   users (in practice the CEO, levi.spears, and Tom Clark, tom.clark, are
   the Portal admins). Credential stores are NEVER searched: cpp.auth.*,
   the passkey record, and the mail-panel stores are excluded by rule, and
   the search only ever reads the record stores listed in STORE_CATALOG
   plus the program desks' records/notes stores.

   Honest limits: device records live only in this browser on this device
   until the December 1, 2026 server-side build; the published index is
   only as fresh as its build date (shown on the page). */

/* ---------------- record store catalog (this-device stores) ---------------- */
/* label/desk/url: where a hit opens. Keys verified against the live fleet
   code on Nov 26, 2026. */
const STORE_CATALOG = [
  { key: "cpp.portal.board.v1", label: "Message board posts", desk: "Company Portal", url: "../" },
  { key: "cpp.portal.cal.v1", label: "Shared calendar appointments", desk: "Company Portal", url: "../" },
  { key: "cpp.portal.apptreq.v1", label: "Appointment requests", desk: "Company Portal", url: "../" },
  { key: "cpp.portal.progact.v1", label: "Program activity entries", desk: "Program Activity", url: "../program-activity/" },
  { key: "cpp.portal.sharedpad.v1", label: "Shared notebook pad", desk: "Shared Notebook", url: "../shared-notebook/" },
  { key: "cpp.justice.tracker.v1", label: "Justice Support case tracker", desk: "Justice Support Desk", url: "../../justice-support-desk/" },
  { key: "dapdash.notes.v1", label: "DAP session notes", desk: "DAP Notes Dashboard", url: "../../dap/" },
  { key: "hrdash.records.v1", label: "HR records", desk: "HR Dashboard", url: "../../hr/" },
  { key: "cpp.hr.clock.v1", label: "HR time clock entries", desk: "HR Dashboard", url: "../../hr/" },
  { key: "cpp.fieldteam.notes.v1", label: "Field team notes", desk: "Field Team Dashboard", url: "../../field-team/" },
  { key: "cpp.fieldteam.assign.v1", label: "Field team assignments", desk: "Field Team Dashboard", url: "../../field-team/" },
  { key: "cpp.board.notices.v1", label: "Board notices", desk: "Board Dashboard", url: "../../board/" }
];
/* Program desks store records/notes under cpp.prog.<slug>.records.v1 and
   cpp.prog.<slug>.notes.v1 (verified in the shared program app.js). */
const PROG_NAMES = {
  "centipede-academy": "Centipede Academy", "crisis-support": "Crisis Support & Resource Connection",
  "day-of-hope": "Centipede Day of Hope", "homeless-outreach": "Homeless Outreach",
  "homeless-shelter": "Homeless Shelter", "housing-development": "Housing Development",
  "housing-stability": "Housing Stability Services", "hygiene-outreach": "Hygiene Outreach",
  "justice-support": "Justice Support Program", "mental-health-outreach": "Mental-Health Outreach & Navigation",
  "peer-support": "1-on-1 Peer Support", "pet-pantry": "Pet Pantry",
  "recovery-support": "Substance Abuse Recovery Support", "referrals-id": "Referrals & ID Assistance",
  "relationship-coaching": "Relationship Coaching", "resource-navigation": "Community Resource Navigation",
  "super-hero": "Super Hero Program", "transportation-support": "Transportation Support",
  "veterans": "Veterans Program", "women-helping-women": "Women Helping Women"
};
const PROG_STORE_RE = /^cpp\.prog\.([a-z0-9-]+)\.(records|notes)\.v1$/;
/* Hard exclusions — never searched, even if a key somehow matched above. */
const EXCLUDE_RE = /^(cpp\.auth\.|cpp\.passkey\.|cpp\.mail\.)|\.outbox\.|board\.seeded/;

/* ---------------- query helpers ---------------- */
function squash(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function tokenize(q) {
  return String(q || "").toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
}
function matchesAll(hay, tokens, squashedHay, squashedQuery) {
  if (squashedQuery && squashedHay.includes(squashedQuery)) return true;
  return tokens.every((t) => hay.includes(t));
}

/* ---------------- published-content search ---------------- */
function searchIndex(entries, query, limit) {
  const tokens = tokenize(query);
  const sq = squash(query);
  if (!tokens.length && !sq) return [];
  const scored = [];
  for (const e of entries) {
    const title = (e.t || "").toLowerCase();
    const hay = (e.t + " " + (e.x || "") + " " + (e.k || "") + " " + e.y).toLowerCase();
    const haySq = squash(e.t + " " + (e.k || ""));
    if (!matchesAll(hay, tokens, haySq, sq)) continue;
    let score = 0;
    for (const t of tokens) {
      if (title.includes(t)) score += 10;
      if ((e.k || "").toLowerCase().includes(t)) score += 6;
      score += Math.min(5, hay.split(t).length - 1); // occurrence signal, capped
    }
    if (sq && haySq.includes(sq)) score += 25;
    // The numbered original outranks binder mirrors and gallery copies of it.
    if (/cpp-[a-z]+-\d{4}-\d{3}/.test(title)) score += 12;
    scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.t.localeCompare(b.e.t));
  return scored.slice(0, limit || 30).map((s) => s.e);
}

/* ---------------- device-record search ---------------- */
function leafStrings(v, out) {
  if (v == null) return out;
  if (typeof v === "string" || typeof v === "number") { out.push(String(v)); return out; }
  if (Array.isArray(v)) { for (const x of v) leafStrings(x, out); return out; }
  if (typeof v === "object") { for (const k of Object.keys(v)) leafStrings(v[k], out); }
  return out;
}
const TITLE_FIELDS = ["headline", "title", "name", "client", "clientName", "member", "person", "subject", "label", "program", "matter", "employee"];
const DATE_FIELDS = ["date", "when", "createdAt", "created", "at", "ts", "day", "start"];
function recordTitle(rec, text) {
  if (rec && typeof rec === "object") {
    for (const f of TITLE_FIELDS) {
      const v = rec[f];
      if (typeof v === "string" && v.trim()) return v.trim().slice(0, 90);
    }
  }
  return text.slice(0, 90);
}
function recordDate(rec) {
  if (rec && typeof rec === "object") {
    for (const f of DATE_FIELDS) {
      const v = rec[f];
      if (typeof v === "string" && v.trim()) return v.trim().slice(0, 40);
      if (typeof v === "number" && v > 0) { try { return new Date(v).toLocaleDateString("en-US"); } catch { /* keep looking */ } }
    }
  }
  return "";
}
/* Flatten one store's parsed value into searchable records. */
function flattenStore(parsed) {
  const out = [];
  if (parsed == null) return out;
  if (Array.isArray(parsed)) { for (const r of parsed) out.push({ rec: r, sub: "" }); return out; }
  if (typeof parsed === "object") {
    let any = false;
    for (const k of Object.keys(parsed)) {
      if (Array.isArray(parsed[k])) { any = true; for (const r of parsed[k]) out.push({ rec: r, sub: k }); }
    }
    if (!any) out.push({ rec: parsed, sub: "" });
    return out;
  }
  out.push({ rec: parsed, sub: "" });
  return out;
}
function catalogFor(key) {
  const exact = STORE_CATALOG.find((c) => c.key === key);
  if (exact) return exact;
  const m = key.match(PROG_STORE_RE);
  if (m) {
    const name = PROG_NAMES[m[1]] || m[1];
    return { key, label: name + (m[2] === "notes" ? " — desk notes" : " — desk records"), desk: name, url: "../../programs/" + m[1] + "/" };
  }
  return null;
}
function collectRecords(storage) {
  const out = [];
  let n = 0;
  try { n = storage.length; } catch { return out; }
  for (let i = 0; i < n; i++) {
    let key = null;
    try { key = storage.key(i); } catch { continue; }
    if (!key || EXCLUDE_RE.test(key)) continue;
    const cat = catalogFor(key);
    if (!cat) continue;
    let parsed = null;
    try { parsed = JSON.parse(storage.getItem(key)); } catch { continue; }
    for (const item of flattenStore(parsed)) {
      const text = leafStrings(item.rec, []).join(" · ");
      if (!text) continue;
      out.push({
        store: cat.label + (item.sub ? " — " + item.sub : ""),
        desk: cat.desk,
        url: cat.url,
        title: recordTitle(item.rec, text),
        date: recordDate(item.rec),
        text
      });
    }
  }
  return out;
}
function snippetFor(text, tokens, sq) {
  const low = text.toLowerCase();
  let pos = sq ? low.indexOf(String(sq).toLowerCase()) : -1;
  if (pos < 0) { for (const t of tokens) { const p = low.indexOf(t); if (p >= 0 && (pos < 0 || p < pos)) pos = p; } }
  if (pos < 0) pos = 0;
  const a = Math.max(0, pos - 60), b = Math.min(text.length, pos + 130);
  return (a > 0 ? "…" : "") + text.slice(a, b) + (b < text.length ? "…" : "");
}
function searchRecords(storage, query, limit) {
  const tokens = tokenize(query);
  const sq = squash(query);
  if (!tokens.length && !sq) return [];
  const hits = [];
  for (const r of collectRecords(storage)) {
    const hay = (r.title + " " + r.text + " " + r.store).toLowerCase();
    if (!matchesAll(hay, tokens, squash(r.title + " " + r.store), sq)) continue;
    let score = 0;
    for (const t of tokens) { if (r.title.toLowerCase().includes(t)) score += 10; if (hay.includes(t)) score += 1; }
    hits.push({ r, score, snippet: snippetFor(r.text, tokens, query) });
  }
  hits.sort((a, b) => b.score - a.score || a.r.title.localeCompare(b.r.title));
  return hits.slice(0, limit || 30).map((h) => ({ title: h.r.title, date: h.r.date, store: h.r.store, desk: h.r.desk, url: h.r.url, snippet: h.snippet }));
}

const CPPFind = { searchIndex, searchRecords, collectRecords, catalogFor, STORE_CATALOG, tokenize, squash };
if (typeof module !== "undefined" && module.exports) module.exports = CPPFind;
if (typeof window !== "undefined") window.CPPFind = CPPFind;

/* ---------------- browser wiring (skipped under Node) ---------------- */
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const state = { user: null, index: null };
  const RECORDS_ALLOWED = (u) => !!u && (u.admin === true || u.username === "levi.spears" || u.username === "tom.clark" || u.username === "levi.recovery");

  function render() {
    const q = $("find-q").value.trim();
    const docsEl = $("find-docs"), recEl = $("find-records");
    if (!q) { docsEl.innerHTML = ""; if (recEl) recEl.innerHTML = ""; $("find-count").textContent = ""; return; }
    const docs = state.index ? searchIndex(state.index.entries, q, 30) : [];
    docsEl.innerHTML = docs.length
      ? docs.map((e) => `<li class="find-hit"><span class="badge">${esc(e.y)}</span> <a href="${esc(e.u)}">${esc(e.t)}</a><br><span class="hint">${esc((e.x || "").slice(0, 180))}</span></li>`).join("")
      : '<li class="hint">No documents or pages match that search.</li>';
    let recCount = 0;
    if (recEl && RECORDS_ALLOWED(state.user)) {
      const recs = searchRecords(window.localStorage, q, 30);
      recCount = recs.length;
      recEl.innerHTML = recs.length
        ? recs.map((r) => `<li class="find-hit"><span class="badge">${esc(r.store)}</span> <a href="${esc(r.url)}">${esc(r.title || "Record")}</a>${r.date ? ` <span class="hint">${esc(r.date)}</span>` : ""}<br><span class="hint">${esc(r.snippet)}</span><br><span class="hint">Opens: ${esc(r.desk)} (this device)</span></li>`).join("")
        : '<li class="hint">No records on this device match that search.</li>';
    }
    $("find-count").textContent = docs.length + " document(s)" + (RECORDS_ALLOWED(state.user) ? " · " + recCount + " device record(s)" : "");
  }

  function enterApp(user) {
    state.user = user;
    $("login-screen").hidden = true;
    $("app").hidden = false;
    $("find-user").textContent = user.name + " (" + user.username + ")";
    if (!RECORDS_ALLOWED(user)) {
      const sec = $("records-section");
      if (sec) sec.hidden = true;
    }
    fetch("search-index.json").then((r) => r.json()).then((idx) => {
      state.index = idx;
      $("find-meta").textContent = "Document index built " + idx.generated + " — " + idx.count + " policies, programs, forms, documents, and dashboards.";
      render();
    }).catch(() => { $("find-meta").textContent = "The document index could not be loaded on this device."; });
    $("find-q").focus();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const CFG = window.PORTAL_CONFIG;
    window.CPPAuth.mount({
      seedUsers: CFG.users,
      storeKey: "cpp.auth.portal.v1",
      sessionKey: "portal.user",
      onSignIn: (user) => enterApp(user)
    });
    const restored = window.CPPAuth.restoreSession();
    if (restored) enterApp(restored);
    $("find-q").addEventListener("input", render);
    $("logout-btn").addEventListener("click", () => { try { sessionStorage.removeItem("portal.user"); } catch { /* ignore */ } location.reload(); });
  });
}

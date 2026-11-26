"use strict";
/* Centipede Peer to Peer, LLC — IT Bulletin (portal/assets/it-bulletin.js).
   Levi's IT feed on the Portal home, directly below the Company Message
   Board: the latest systems-status, security, and open-item headlines
   from the IT Dashboard, without opening the dashboard.
   Added November 26, 2026 at the CEO's direction.
   ACCESS: the panel renders only for Levi Spears and Jarvis — the same
   access as the IT Dashboard itself. Other staff do not see it and
   cannot post to it. Posting: Levi and Jarvis.
   DATA: the feed lives in the shared on-device store cpp.it.feed.v1,
   written by the IT Dashboard (status updates, security entries, item
   changes) and by this panel's composer. Like every Portal store, it
   is per-device until the December 1, 2026 server build — the panel
   says so. When a device has no feed entries yet, a dated starting
   board (November 26, 2026) is shown so the panel is never empty. */
(function () {
  const FEED_KEY = "cpp.it.feed.v1";
  const VIEWERS = { "levi.spears": "Levi Spears, CEO", "levi.recovery": "Levi Spears, CEO", "jarvis": "Jarvis" };
  const SEED = [
    { kind: "Status", text: "Company Gmail connection needs re-authentication (401 since November 25, 10:09 PM) — re-auth owed; Jarvis's Gmail is up.", date: "November 26, 2026", by: "IT Dashboard" },
    { kind: "Status", text: "Portal fleet live — Face ID sign-in, Portal Find, and the Women Helping Women build all shipped tonight.", date: "November 26, 2026", by: "IT Dashboard" },
    { kind: "Security", text: "Privacy boundary set by Levi: vaulted staff passwords are safekeeping only — Jarvis enters only his own accounts and Levi's, authorized by Levi only.", date: "November 26, 2026", by: "IT Dashboard" },
    { kind: "Open item", text: "Doorknocker witness stalled on the full disk quota — the backups folder (about 77 GB) decision is Levi's.", date: "November 26, 2026", by: "IT Dashboard" }
  ];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  const ui = { user: null, bound: false };

  function loadFeed() { const f = store.get(FEED_KEY, []); return Array.isArray(f) ? f : []; }
  function saveFeed(f) { store.set(FEED_KEY, f); }
  function todayLabel() { return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); }
  function canView() { return !!(ui.user && VIEWERS[ui.user.username]); }

  function renderList() {
    const list = $("it-feed-list");
    if (!list) return;
    const feed = loadFeed();
    const items = feed.length ? feed.slice(0, 6) : SEED;
    list.innerHTML = items.map((e) =>
      `<li><span class="badge">${esc(e.kind || "Note")}</span> ${esc(e.text)}<br><span class="hint">${esc(e.date || "")} · ${esc(e.by || "")}</span></li>`).join("");
    const note = $("it-feed-note");
    if (note) note.textContent = feed.length
      ? "Fed by the IT Dashboard on this device (store cpp.it.feed.v1) — per-device until the December 1 server build."
      : "Starting board — November 26, 2026. Entries from the IT Dashboard will appear here on this device as they are posted (per-device until the December 1 server build).";
  }

  function onPost(e) {
    e.preventDefault();
    if (!canView()) return;
    const text = $("it-feed-text").value.trim();
    if (!text) { $("it-feed-msg").textContent = "Write the bulletin, and it will post."; return; }
    const feed = loadFeed();
    feed.unshift({ id: "ITF-" + Date.now(), kind: "Note", text, date: todayLabel(), by: VIEWERS[ui.user.username], username: ui.user.username });
    saveFeed(feed.slice(0, 50));
    $("it-feed-msg").textContent = "Posted to the IT Bulletin.";
    e.target.reset();
    renderList();
  }

  function bindOnce() {
    if (ui.bound) return;
    ui.bound = true;
    const form = $("it-feed-form");
    if (form) form.addEventListener("submit", onPost);
  }

  function render(user) {
    ui.user = user || null;
    const panel = $("it-bulletin-panel");
    if (!panel) return;
    if (!canView()) { panel.hidden = true; return; }
    panel.hidden = false;
    bindOnce();
    const composer = $("it-feed-composer");
    if (composer) composer.hidden = false;
    renderList();
  }

  window.CPPITBulletin = { render, _test: { FEED_KEY, VIEWERS, SEED, loadFeed, saveFeed, ui } };

  /* Restored-session safety: if a sign-in session already exists when
     this script loads (it loads after app.js), render right away —
     the same store the dashboards use. Guarded: any failure leaves
     the panel hidden and never breaks the page. */
  try {
    const u = window.CPPAuth && CPPAuth.restoreSession ? CPPAuth.restoreSession() : null;
    if (u) render(u);
  } catch { /* never break the Portal home */ }
})();

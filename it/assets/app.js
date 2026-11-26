"use strict";
/* Centipede Peer to Peer, LLC — IT Dashboard (assets/app.js).
   Levi's IT board: systems status, the accounts & mailboxes register,
   the security log, open IT items, devices, and the IT schedule.
   Access: Levi Spears and Jarvis only (see assets/config.js seed).
   Rebuilt November 26, 2026 at the CEO's direction.
   Entries added here are kept in this device's local storage until
   the December 1, 2026 server-side build — each panel says so. */
const CFG = window.IT_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const state = { user: null };
const STATUS_KEY = "cpp.it.status.v1";
const SECLOG_KEY = "cpp.it.seclog.v1";
const ITEMS_KEY = "cpp.it.items.v1";
const DEVICES_KEY = "cpp.it.devices.v1";
const ITEM_STATUSES = ["Open", "In progress", "Waiting on Levi", "On hold — Levi's reminder", "Done"];

const FEED_KEY = "cpp.it.feed.v1";
/* The IT Bulletin feed: shared with the Portal home's IT Bulletin panel
   (same store key, same origin). Every status update, security entry,
   and open-item change posted here also lands on the Portal feed.
   Per-device until the December 1 server build, like all the stores. */
function feedPush(kind, text) {
  try {
    const feed = store.get(FEED_KEY, []);
    feed.unshift({ id: "ITF-" + Date.now(), kind, text, date: todayLabel(), by: state.user ? state.user.name : "IT Dashboard", username: state.user ? state.user.username : "itdash" });
    store.set(FEED_KEY, feed.slice(0, 50));
  } catch { /* the feed must never break the dashboard */ }
}
function seedFeedIfEmpty() {
  try {
    if (store.get(FEED_KEY, []).length) return;
    const feed = [];
    CFG.systems.slice(0, 4).forEach((s) => feed.push({ id: "ITF-SEED-" + feed.length, kind: "Status", text: s.name + " — " + s.status + ".", date: "November 26, 2026", by: "IT Dashboard", username: "itdash" }));
    if (CFG.securityLog.length) feed.push({ id: "ITF-SEED-S", kind: "Security", text: CFG.securityLog[0].text, date: "November 26, 2026", by: "IT Dashboard", username: "itdash" });
    feed.push({ id: "ITF-SEED-O", kind: "Open items", text: CFG.openItems.length + " open IT items on the board — see Open IT Items in the IT Dashboard.", date: "November 26, 2026", by: "IT Dashboard", username: "itdash" });
    store.set(FEED_KEY, feed);
  } catch { /* never break sign-in */ }
}

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.it.v1",
    sessionKey: "itdash.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/* ---------- Systems Status ---------- */
function renderStatus() {
  const updates = store.get(STATUS_KEY, []);
  const updHtml = updates.map((e) =>
    `<li><strong>${esc(e.name)}</strong> — ${esc(e.status)}<br><span class="hint">${esc(e.date)} · added by ${esc(e.by)}</span>${e.note ? `<br>${esc(e.note)}` : ""}</li>`).join("");
  const seedHtml = CFG.systems.map((s) =>
    `<li><strong>${esc(s.name)}</strong> — ${esc(s.status)}<br><span class="hint">As of ${esc(s.date)}</span><br>${esc(s.note)}</li>`).join("");
  $("status-list").innerHTML = (updHtml + seedHtml) || '<li class="hint">No status entries.</li>';
}
function wireStatusForm() {
  $("status-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("status-name").value.trim();
    const status = $("status-value").value.trim();
    const note = $("status-note").value.trim();
    if (!name || !status) { $("status-msg").textContent = "Name the system and its status, and it will go on the board."; return; }
    const updates = store.get(STATUS_KEY, []);
    updates.unshift({ name, status, note, date: todayLabel(), by: state.user.name });
    store.set(STATUS_KEY, updates);
    feedPush("Status", name + " — " + status + (note ? ". " + note : ""));
    $("status-msg").textContent = "Status added to the board.";
    e.target.reset(); renderStatus();
  });
}

/* ---------- Accounts & Mailboxes (register — rendered from config) ---------- */
function renderAccounts() {
  $("accounts-list").innerHTML = CFG.accounts.map((a) =>
    `<li><strong>${esc(a.address)}</strong> — ${esc(a.status)}<br><span class="hint">${esc(a.holder)} · ${esc(a.role)}</span></li>`).join("");
}

/* ---------- Security Log ---------- */
function renderSecLog() {
  const entries = store.get(SECLOG_KEY, []);
  const newHtml = entries.map((e) =>
    `<li><strong>${esc(e.date)}</strong> — ${esc(e.text)}<br><span class="hint">Logged by ${esc(e.by)}</span></li>`).join("");
  const seedHtml = CFG.securityLog.map((e) =>
    `<li><strong>${esc(e.date)}</strong> — ${esc(e.text)}</li>`).join("");
  $("seclog-list").innerHTML = (newHtml + seedHtml) || '<li class="hint">No security entries yet.</li>';
}
function wireSecLogForm() {
  $("seclog-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const text = $("seclog-text").value.trim();
    if (!text) { $("seclog-msg").textContent = "Write the security item, and it will be logged."; return; }
    const entries = store.get(SECLOG_KEY, []);
    entries.unshift({ date: todayLabel(), text, by: state.user.name });
    store.set(SECLOG_KEY, entries);
    feedPush("Security", text);
    $("seclog-msg").textContent = "Logged.";
    e.target.reset(); renderSecLog();
  });
}

/* ---------- Open IT Items ---------- */
function itemsState() { return store.get(ITEMS_KEY, { overrides: {}, added: [] }); }
function renderItems() {
  const st = itemsState();
  const seedHtml = CFG.openItems.map((it) => {
    const cur = st.overrides[it.id] || it.status;
    const opts = ITEM_STATUSES.map((s) => `<option${s === cur ? " selected" : ""}>${esc(s)}</option>`).join("");
    return `<li><strong>${esc(it.id)} — ${esc(it.title)}</strong><br>${esc(it.detail)}<br><label class="hint">Status <select data-item-status="${esc(it.id)}">${opts}</select></label></li>`;
  }).join("");
  const addedHtml = st.added.map((it) =>
    `<li><strong>${esc(it.title)}</strong> — ${esc(it.status)}<br>${esc(it.detail)}<br><span class="hint">Added ${esc(it.date)} by ${esc(it.by)}</span></li>`).join("");
  $("items-list").innerHTML = (seedHtml + addedHtml) || '<li class="hint">No open items.</li>';
  document.querySelectorAll("[data-item-status]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const s2 = itemsState();
      s2.overrides[sel.getAttribute("data-item-status")] = sel.value;
      store.set(ITEMS_KEY, s2);
      const itId = sel.getAttribute("data-item-status");
      const seed = CFG.openItems.find((x) => x.id === itId);
      feedPush("Open item", itId + (seed ? " — " + seed.title : "") + ": status now " + sel.value + ".");
      $("items-msg").textContent = "Status saved on this device.";
    });
  });
}
function wireItemsForm() {
  $("item-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("item-title").value.trim();
    const detail = $("item-detail").value.trim();
    if (!title) { $("items-msg").textContent = "Name the item, and it will be added to the list."; return; }
    const st = itemsState();
    st.added.unshift({ title, detail, status: "Open", date: todayLabel(), by: state.user.name });
    store.set(ITEMS_KEY, st);
    feedPush("Open item", "New open item: " + title + (detail ? " — " + detail : ""));
    $("items-msg").textContent = "Item added.";
    e.target.reset(); renderItems();
  });
}

/* ---------- Devices ---------- */
function renderDevices() {
  const added = store.get(DEVICES_KEY, []);
  const addedHtml = added.map((d) =>
    `<li><strong>${esc(d.name)}</strong><br>${esc(d.note)}<br><span class="hint">Added ${esc(d.date)} by ${esc(d.by)}</span></li>`).join("");
  const seedHtml = CFG.devices.map((d) =>
    `<li><strong>${esc(d.name)}</strong><br>${esc(d.note)}</li>`).join("");
  $("devices-list").innerHTML = (addedHtml + seedHtml) || '<li class="hint">No devices listed.</li>';
}
function wireDevicesForm() {
  $("device-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("device-name").value.trim();
    const note = $("device-note").value.trim();
    if (!name) { $("device-msg").textContent = "Name the device, and it will be added to the inventory."; return; }
    const added = store.get(DEVICES_KEY, []);
    added.unshift({ name, note, date: todayLabel(), by: state.user.name });
    store.set(DEVICES_KEY, added);
    $("device-msg").textContent = "Device added.";
    e.target.reset(); renderDevices();
  });
}

/* ---------- IT Schedule ---------- */
function renderSchedule() {
  $("schedule-list").innerHTML = CFG.schedule.map((s) =>
    `<li><strong>${esc(s.when)}</strong> — ${esc(s.what)}</li>`).join("");
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "Levi's IT board — systems, accounts, security, and open items in one place. Passwords are never shown here: Jarvis holds the generated passwords under CPP-POL-2026-060, and values live in secure storage only.";
  seedFeedIfEmpty();
  renderStatus(); wireStatusForm();
  renderAccounts();
  renderSecLog(); wireSecLogForm();
  renderItems(); wireItemsForm();
  renderDevices(); wireDevicesForm();
  renderSchedule();
  $("logout-btn").addEventListener("click", () => { try { CPPAuth.signOut(); } catch { location.reload(); } });
}

(function boot() { initLogin(); const user = CPPAuth.restoreSession(); if (user) { state.user = user; enterApp(); } })();

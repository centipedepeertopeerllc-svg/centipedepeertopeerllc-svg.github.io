"use strict";
/* Centipede Peer to Peer, LLC — dashboard sign-in (assets/auth.js).
   Username + password + 2FA (TOTP), identical in all four dashboards.
   Replaced the name + numeric access-code gate on Nov 17, 2026 at the
   CEO's direction, because the dashboards are public on the internet.

   How it works:
   - Seed users live in assets/config.js with only the SHA-256 hash of a
     one-time temporary password (tempPasswordSha256). The temporary
     passwords themselves are never stored in any file.
   - On first use of a device, the seed becomes the runtime user store
     in that browser's local storage (store key passed to mount(),
     e.g. "cpp.auth.client.v1"): { username, name, role, admin,
     passwordSha256, mustChangePassword: true, totpSecret: null,
     pendingTotpSecret: null }. pendingTotpSecret holds the enrollment
     setup key once shown, so a page reload cannot rotate it before the
     person confirms a code (fix added Nov 24, 2026 — see beginEnroll).
     Any seed user missing from an existing store is merged in.
   - Sign-in flow: username + password -> if mustChangePassword, the
     person must set their own password (rule: at least 10 characters,
     at least one letter, never only numbers) -> if no 2FA secret yet,
     the person enrolls an authenticator app (RFC 6238 TOTP, setup key
     shown as text + otpauth:// URI, confirmed with a current code) ->
     on later sign-ins, the current 6-digit TOTP code is required.
   - An administrator (admin: true) gets an "Admin — user access"
     panel: Reset password (new one-time temporary password, shown
     once) and Reset 2FA (re-enroll at next sign-in). Resets take
     effect at that person's next sign-in.
   - Honest Local Mode note: until the Supabase Auth step replaces
     this with server-side accounts, password hashes and 2FA secrets
     live in each device's browser storage. Locked binders remain the
     official record. No external libraries, no CDN. */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- SHA-256 (WebCrypto, pure-JS fallback) ---------------- */
  async function sha256Hex(text) {
    if (window.crypto && crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
        return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
      } catch { /* fall through to pure JS */ }
    }
    return sha256Pure(text);
  }
  /* Compact pure-JS SHA-256, used only when WebCrypto is unavailable.
     Same implementation the dashboards already carry in app.js. */
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

  /* ---------------- base32 (RFC 4648) ---------------- */
  const B32A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  function base32Encode(bytes) {
    let bits = 0, val = 0, out = "";
    for (const b of bytes) {
      val = (val << 8) | b; bits += 8;
      while (bits >= 5) { out += B32A[(val >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32A[(val << (5 - bits)) & 31];
    return out;
  }
  function base32Decode(str) {
    const clean = String(str || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
    let bits = 0, val = 0; const out = [];
    for (const ch of clean) {
      val = (val << 5) | B32A.indexOf(ch); bits += 5;
      if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
    }
    return new Uint8Array(out);
  }

  /* ---------------- SHA-1 + HMAC-SHA-1 (WebCrypto, pure-JS fallback) ---------------- */
  function sha1Pure(msg) {
    const ml = msg.length;
    const total = (((ml + 8) >> 6) + 1) << 6;
    const buf = new Uint8Array(total);
    buf.set(msg); buf[ml] = 0x80;
    const dv = new DataView(buf.buffer);
    dv.setUint32(total - 4, ml * 8, false);
    dv.setUint32(total - 8, Math.floor(ml / 0x20000000), false);
    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    const w = new Int32Array(80);
    const rotl = (x, n) => (x << n) | (x >>> (32 - n));
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getInt32(off + i * 4, false);
      for (let i = 16; i < 80; i++) w[i] = rotl(w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16], 1);
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let i = 0; i < 80; i++) {
        let f, k;
        if (i < 20) { f = (b & c) | (~b & d); k = 0x5A827999; }
        else if (i < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        const tmp = (rotl(a, 5) + f + e + k + w[i]) | 0;
        e = d; d = c; c = rotl(b, 30); b = a; a = tmp;
      }
      h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0;
    }
    const out = new Uint8Array(20);
    const odv = new DataView(out.buffer);
    odv.setInt32(0, h0, false); odv.setInt32(4, h1, false); odv.setInt32(8, h2, false);
    odv.setInt32(12, h3, false); odv.setInt32(16, h4, false);
    return out;
  }
  function hmacSha1Pure(key, msg) {
    let k = key;
    if (k.length > 64) k = sha1Pure(k);
    const block = new Uint8Array(64); block.set(k);
    const inner = new Uint8Array(64 + msg.length);
    const outer = new Uint8Array(64 + 20);
    for (let i = 0; i < 64; i++) { inner[i] = block[i] ^ 0x36; outer[i] = block[i] ^ 0x5c; }
    inner.set(msg, 64);
    outer.set(sha1Pure(inner), 64);
    return sha1Pure(outer);
  }
  async function hmacSha1(keyBytes, msgBytes) {
    if (window.crypto && crypto.subtle) {
      try {
        const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, msgBytes);
        return new Uint8Array(sig);
      } catch { /* fall through to pure JS */ }
    }
    return hmacSha1Pure(keyBytes, msgBytes);
  }

  /* ---------------- TOTP (RFC 6238: HMAC-SHA-1, 30-second step, 6 digits) ---------------- */
  async function totpCode(secretB32, counter) {
    const key = base32Decode(secretB32);
    const msg = new Uint8Array(8);
    const dv = new DataView(msg.buffer);
    dv.setUint32(0, Math.floor(counter / 0x100000000), false);
    dv.setUint32(4, counter >>> 0, false);
    const mac = await hmacSha1(key, msg);
    const off = mac[mac.length - 1] & 0x0f;
    const bin = ((mac[off] & 0x7f) << 24) | ((mac[off + 1] & 0xff) << 16) | ((mac[off + 2] & 0xff) << 8) | (mac[off + 3] & 0xff);
    return String(bin % 1000000).padStart(6, "0");
  }
  async function totpVerify(secretB32, code) {
    const clean = String(code || "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(clean)) return false;
    const now = Math.floor(Date.now() / 1000 / 30);
    // Window widened Nov 24, 2026: two steps either side (was one), so a
    // device whose clock drifts a minute or two does not lock its user
    // out of the authenticator step.
    for (const d of [-2, -1, 0, 1, 2]) {
      if ((await totpCode(secretB32, now + d)) === clean) return true;
    }
    return false;
  }
  function newTotpSecret() {
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);
    return base32Encode(bytes);
  }
  function otpauthUri(secretB32, username) {
    const label = encodeURIComponent("Centipede") + ":" + encodeURIComponent(username);
    return "otpauth://totp/" + label + "?secret=" + secretB32 + "&issuer=Centipede&algorithm=SHA1&digits=6&period=30";
  }

  /* ---------------- password rule + temporary passwords ---------------- */
  function passwordProblem(pw) {
    if (!pw || pw.length < 10) return "Your password must be at least 10 characters long.";
    if (!/[A-Za-z]/.test(pw)) return "Your password must contain at least one letter.";
    if (/^\d+$/.test(pw)) return "Your password cannot be only numbers.";
    return "";
  }
  const TEMP_WORDS = ["Amber", "Anchor", "Beacon", "Birch", "Cedar", "Cinder", "Copper", "Dune", "Ember", "Falcon", "Flint", "Garnet", "Granite", "Harbor", "Hazel", "Ivory", "Jasper", "Juniper", "Lantern", "Linen", "Maple", "Meadow", "Nectar", "Nickel", "Onyx", "Opal", "Pepper", "Prairie", "Quartz", "Quill", "River", "Rowan", "Saddle", "Sorrel", "Timber", "Topaz", "Umber", "Velvet", "Walnut", "Willow", "Wren", "Yarrow", "Zephyr"];
  function pickWord() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return TEMP_WORDS[a[0] % TEMP_WORDS.length];
  }
  function generateTempPassword() { return pickWord() + pickWord() + "-Temp-" + pickWord(); }

  /* ---------------- runtime user store (localStorage) ---------------- */
  function seedRecord(u) {
    const r = Object.assign({}, u);
    r.passwordSha256 = u.tempPasswordSha256;
    delete r.tempPasswordSha256;
    r.mustChangePassword = true;
    r.totpSecret = null;
    r.pendingTotpSecret = null;
    return r;
  }
  function saveStore(storeKey, store) {
    try { localStorage.setItem(storeKey, JSON.stringify(store)); } catch { /* storage full/blocked — sign-in still proceeds for this session */ }
  }
  function loadStore(storeKey, seedUsers) {
    let store = null;
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.users) && p.users.length) store = p; }
    } catch { store = null; }
    if (!store) {
      store = { users: seedUsers.map(seedRecord) };
      saveStore(storeKey, store);
      return store;
    }
    // Merge in any seed user not yet on this device (e.g. a person added later).
    let changed = false;
    for (const u of seedUsers) {
      if (!store.users.some((x) => x.username === u.username)) { store.users.push(seedRecord(u)); changed = true; }
    }
    if (changed) saveStore(storeKey, store);
    return store;
  }
  function publicUser(u) {
    const out = {};
    for (const k of Object.keys(u)) {
      if (k === "passwordSha256" || k === "tempPasswordSha256" || k === "totpSecret" || k === "pendingTotpSecret") continue;
      out[k] = u[k];
    }
    return out;
  }

  /* ---------------- sign-in flow ---------------- */
  let CTX = null;
  function setError(msg) { const el = $("login-error"); if (el) el.textContent = msg || ""; }
  function showStep(name) {
    CTX.step = name;
    for (const s of ["login", "change", "enroll", "totp"]) {
      const el = $("auth-step-" + s);
      if (el) {
        el.hidden = s !== name;
        // Controls in a hidden step MUST be disabled, not just hidden.
        // A hidden-but-enabled control still takes part in the form's
        // built-in validation: after sign-in the login password box is
        // cleared, and its "required" rule then silently vetoed every
        // later step's submit (Nov 18, 2026 — the set-password step
        // appeared to hang; no submit event, no error, nothing).
        // Disabled controls are skipped by validation, so only the
        // visible step's own fields can block its submit.
        el.querySelectorAll("input, select, textarea, button").forEach((c) => { c.disabled = s !== name; });
      }
    }
    setError("");
    const first = { login: "login-username", change: "change-password", enroll: "enroll-code", totp: "totp-code" }[name];
    const input = first && $(first);
    if (input) input.focus();
  }
  function findUser(username) {
    return CTX.store.users.find((u) => u.username === username) || null;
  }
  /* Nov 25, 2026 (Jarvis, at the CEO's direct order — "Approved.
     Mandatory."): the CEO's own two logins, levi.spears and
     levi.recovery, sign in with password only — no authenticator code
     prompt and no authenticator enrollment step, on every portal.
     Every other user keeps the exact current flow: password, then
     authenticator enrollment or code, unchanged. */
  function passwordOnlyUser(user) {
    return !!user && (user.username === "levi.spears" || user.username === "levi.recovery");
  }
  function afterPassword(user) {
    if (user.mustChangePassword) { showStep("change"); return; }
    if (passwordOnlyUser(user)) { finishLogin(user); return; }
    if (!user.totpSecret) { beginEnroll(user); return; }
    showStep("totp");
  }
  function beginEnroll(user) {
    // Nov 24, 2026 fix (Jarvis, at the CEO's direction): the enrollment
    // setup key is kept on the user record (pendingTotpSecret) and saved
    // with the store, so reloading the page or pressing "Start over"
    // can no longer rotate the key and silently invalidate the
    // authenticator entry the person just added — the failure that
    // locked the CEO out on Nov 24, 2026. The same key is shown at
    // every attempt until enrollment completes; only a completed
    // enrollment or an administrator's 2FA reset clears it.
    if (!user.pendingTotpSecret) {
      user.pendingTotpSecret = newTotpSecret();
      saveStore(CTX.storeKey, CTX.store);
    }
    CTX.pendingSecret = user.pendingTotpSecret;
    const keyEl = $("enroll-key");
    if (keyEl) keyEl.textContent = CTX.pendingSecret.replace(/(.{4})/g, "$1 ").trim();
    const uriEl = $("enroll-uri");
    if (uriEl) uriEl.textContent = otpauthUri(CTX.pendingSecret, user.username);
    showStep("enroll");
  }
  function finishLogin(user) {
    try { sessionStorage.setItem(CTX.sessionKey, user.username); } catch { /* private mode — tab session only */ }
    renderAdminUi(user);
    CTX.onSignIn(publicUser(user));
  }
  async function onSubmit(e) {
    e.preventDefault();
    if (!CTX) return;
    try {
      if (CTX.step === "login") {
        const username = $("login-username").value.trim().toLowerCase();
        const user = findUser(username);
        const hash = await sha256Hex($("login-password").value);
        if (!user || hash !== user.passwordSha256) {
          setError("That username and password do not match. Check them and try once more, carefully.");
          return;
        }
        CTX.pending = user;
        $("login-password").value = "";
        afterPassword(user);
      } else if (CTX.step === "change") {
        const user = CTX.pending; if (!user) { showStep("login"); return; }
        const pw1 = $("change-password").value;
        const pw2 = $("change-password2").value;
        const problem = passwordProblem(pw1);
        if (problem) { setError(problem); return; }
        if (pw1 !== pw2) { setError("The two passwords do not match. Type the same password in both boxes."); return; }
        user.passwordSha256 = await sha256Hex(pw1);
        user.mustChangePassword = false;
        saveStore(CTX.storeKey, CTX.store);
        $("change-password").value = ""; $("change-password2").value = "";
        afterPassword(user);
      } else if (CTX.step === "enroll") {
        const user = CTX.pending; if (!user) { showStep("login"); return; }
        if (!(await totpVerify(CTX.pendingSecret, $("enroll-code").value))) {
          setError("That code does not match. Make sure the account was added to your authenticator app, check the time on this device, and try the current code.");
          return;
        }
        user.totpSecret = CTX.pendingSecret;
        user.pendingTotpSecret = null;
        CTX.pendingSecret = null;
        saveStore(CTX.storeKey, CTX.store);
        finishLogin(user);
      } else if (CTX.step === "totp") {
        const user = CTX.pending; if (!user) { showStep("login"); return; }
        if (!(await totpVerify(user.totpSecret, $("totp-code").value))) {
          setError("That code does not match. Enter the current 6-digit code from your authenticator app.");
          return;
        }
        finishLogin(user);
      }
    } catch (err) {
      setError("Something went wrong signing in. Reload the page and try again.");
    }
  }
  function mount(opts) {
    // Nov 20, 2026 (Jarvis, at the CEO's direction): the store key carries
    // a revision suffix (".r9" as of the Nov 25, 2026 reset #5) so every
    // device starts from a clean seed. The old device stores held stale
    // password state that a central temporary-password reset could not
    // reach (the seed only applied to devices with no store), which
    // locked the CEO out after his reset. Fresh seed = the current
    // temporary passwords in config.js apply again.
    // Nov 24, 2026: the enrollment-key persistence fix in beginEnroll()
    // deliberately does NOT bump this suffix — existing device stores,
    // and the own passwords people already set on them, carry over.
    CTX = {
      storeKey: opts.storeKey + ".r9",
      sessionKey: opts.sessionKey,
      onSignIn: opts.onSignIn,
      store: loadStore(opts.storeKey + ".r9", opts.seedUsers),
      step: "login",
      pending: null,
      pendingSecret: null
    };
    const form = $("login-form");
    if (form) {
      form.addEventListener("submit", onSubmit);
      // Never let built-in field validation block a submit silently:
      // if a visible field fails its rule, say so in the error line too.
      form.addEventListener("invalid", () => setError("One of the fields above still needs attention — check the highlighted field and try again."), true);
    }
    document.querySelectorAll(".auth-restart").forEach((b) => b.addEventListener("click", () => location.reload()));
    setupPasskeyLogin();
    showStep("login");
  }
  function restoreSession() {
    if (!CTX) return null;
    let uname = null;
    try { uname = sessionStorage.getItem(CTX.sessionKey); } catch { uname = null; }
    if (!uname) return null;
    const user = findUser(uname);
    if (!user) return null;
    renderAdminUi(user);
    return publicUser(user);
  }

  /* ---------------- admin: user access panel ---------------- */
  function renderAdminUi(user) {
    if (!user || !user.admin) return;
    renderPasskeyUi(user);
    const headerUser = document.querySelector(".header-user");
    if (!headerUser || document.getElementById("auth-admin-btn")) return;
    const btn = document.createElement("button");
    btn.id = "auth-admin-btn";
    btn.type = "button";
    btn.className = "btn-small";
    btn.textContent = "Admin — user access";
    btn.addEventListener("click", toggleAdminPanel);
    headerUser.appendChild(btn);
    const panel = document.createElement("section");
    panel.id = "auth-admin-panel";
    panel.className = "panel";
    panel.hidden = true;
    panel.innerHTML = "<h2>Admin — user access</h2>"
      + "<p class=\"hint\">Resetting a password gives that person a one-time temporary password, shown once below — hand it to them in person. They must set their own password at their next sign-in. Resetting 2FA means they set up their authenticator app again at their next sign-in. Every reset takes effect at that person's next sign-in; it does not interrupt anyone who is signed in now, including you.</p>"
      + "<div id=\"auth-admin-msg\"></div>"
      + "<div id=\"auth-admin-list\"></div>";
    const header = document.querySelector(".app-header");
    if (header && header.parentNode) header.parentNode.insertBefore(panel, header.nextSibling);
    else document.body.appendChild(panel);
  }
  function toggleAdminPanel() {
    const p = $("auth-admin-panel");
    if (!p) return;
    p.hidden = !p.hidden;
    if (!p.hidden) { renderAdminList(); p.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }
  function renderAdminList() {
    const list = $("auth-admin-list");
    if (!list || !CTX) return;
    list.innerHTML = CTX.store.users.map((u) =>
      "<div class=\"auth-user-row\"><div><strong>" + esc(u.name) + "</strong> · " + esc(u.username) + " · " + esc(u.role) + "<br>"
      + "<span class=\"hint\">" + (u.mustChangePassword ? "Temporary password — must set their own at next sign-in" : "Password set") + " · " + (u.totpSecret ? "2FA enrolled" : "2FA not enrolled yet") + "</span></div>"
      + "<div class=\"auth-user-actions\"><button type=\"button\" class=\"btn-small\" data-reset-pw=\"" + esc(u.username) + "\">Reset password</button> "
      + "<button type=\"button\" class=\"btn-small\" data-reset-totp=\"" + esc(u.username) + "\">Reset 2FA</button></div></div>"
    ).join("");
    list.querySelectorAll("[data-reset-pw]").forEach((b) => b.addEventListener("click", () => adminResetPassword(b.getAttribute("data-reset-pw"))));
    list.querySelectorAll("[data-reset-totp]").forEach((b) => b.addEventListener("click", () => adminResetTotp(b.getAttribute("data-reset-totp"))));
  }
  async function adminResetPassword(username) {
    const user = CTX && CTX.store.users.find((u) => u.username === username);
    if (!user) return;
    const temp = generateTempPassword();
    user.passwordSha256 = await sha256Hex(temp);
    user.mustChangePassword = true;
    saveStore(CTX.storeKey, CTX.store);
    const msg = $("auth-admin-msg");
    if (msg) msg.innerHTML = "<p class=\"auth-temp-once\">New temporary password for <strong>" + esc(user.name) + "</strong> (" + esc(user.username) + "): <strong>" + esc(temp) + "</strong><br>Shown once — hand it over now. It will not be shown again.</p>";
    renderAdminList();
  }
  function adminResetTotp(username) {
    const user = CTX && CTX.store.users.find((u) => u.username === username);
    if (!user) return;
    user.totpSecret = null;
    user.pendingTotpSecret = null;
    saveStore(CTX.storeKey, CTX.store);
    const msg = $("auth-admin-msg");
    if (msg) msg.innerHTML = "<p class=\"auth-temp-once\">2FA reset for <strong>" + esc(user.name) + "</strong> (" + esc(user.username) + "). They will set up their authenticator app again at their next sign-in.</p>";
    renderAdminList();
  }


  /* ---------------- Levi-only Face ID (passkey) sign-in ----------------
     Nov 26, 2026 (Jarvis, at the CEO's direct order): extra protection
     for the portals beyond the password, for the CEO's phone. ONLY the
     user levi.spears gets this — no other user sees the enrollment
     offer or the Face ID button, and nobody else's sign-in changes.

     How it works in this local-mode architecture (static pages, no
     server):
     - Enrollment (offered only when levi.spears is signed in): the
       browser runs WebAuthn with a PLATFORM authenticator (Face ID on
       his iPhone) and user verification required. The authenticator's
       private key never leaves the phone's secure hardware / iCloud
       Keychain. What this code stores is only the credential ID and
       the PUBLIC key, in a localStorage record under the key
       "cpp.passkey.levi.v1".
     - That record key is deliberately NOT the per-dashboard user
       store: localStorage is shared by every page on this origin
       (centipedepeertopeerllc-svg.github.io), so ONE enrollment on a
       device covers EVERY dashboard on that device in that browser.
       It is still per device and per browser — a new phone, a new
       browser, or cleared site data needs a fresh enrollment, done by
       Levi himself while signed in with his password. The Dec 1, 2026
       server-side sign-in build is what will make this fleet-wide.
     - Sign-in: the login step shows "Sign in with Face ID" when a
       passkey record exists on this device. The assertion is verified
       in full on the device with WebCrypto: challenge match, origin
       match, rpId hash match, user-presence AND user-verification
       flags set, signature checked against the stored public key,
       and the signature counter must not go backwards. On success it
       is treated exactly like his password sign-in (passwordOnlyUser
       flow — no authenticator code for the CEO).
     - Fallbacks are untouched: password sign-in works exactly as
       before, levi.recovery is unchanged, and removing Face ID from
       this device (button in the Face ID panel) never locks him out.
     - HONEST LIMIT: with no server, the stored public key lives in
       the same browser storage as the local password hashes. Someone
       with unlocked access to the device AND its browser data could
       tamper with that record — the same trust level as the existing
       local-mode password store, not a higher one. The private key
       itself, however, is real hardware-backed WebAuthn: a copied
       record alone cannot sign in from another device, because the
       signature can only be produced by the enrolled authenticator
       after Face ID. Do not describe this as server-grade passkey
       verification; it is the strongest sound check this static
       architecture supports. */
  const PASSKEY_USER = "levi.spears";
  const PASSKEY_STORE_KEY = "cpp.passkey.levi.v1";
  function passkeySupported() {
    return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.crypto && crypto.subtle);
  }
  function bufToB64url(buf) {
    const bytes = new Uint8Array(buf);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlToBuf(str) {
    const b64 = String(str).replace(/-/g, "+").replace(/_/g, "/") + "===".slice((String(str).length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
  function loadPasskey() {
    try {
      const raw = localStorage.getItem(PASSKEY_STORE_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (p && p.username === PASSKEY_USER && p.credId && p.jwk) return p;
    } catch { /* unreadable record — treat as not enrolled */ }
    return null;
  }
  function savePasskey(rec) {
    try { localStorage.setItem(PASSKEY_STORE_KEY, JSON.stringify(rec)); } catch { /* storage blocked — enrollment simply does not persist */ }
  }
  function clearPasskey() {
    try { localStorage.removeItem(PASSKEY_STORE_KEY); } catch { /* nothing to clear */ }
  }
  /* Minimal CBOR reader — just enough to read the attestation object
     and the COSE public key out of authenticator data at enrollment. */
  function cborDecode(bytes) {
    let pos = 0;
    function readLen(ai) {
      if (ai < 24) return ai;
      if (ai === 24) return bytes[pos++];
      if (ai === 25) { const v = (bytes[pos] << 8) | bytes[pos + 1]; pos += 2; return v; }
      if (ai === 26) { const v = ((bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3]) >>> 0; pos += 4; return v; }
      if (ai === 27) { let v = 0; for (let i = 0; i < 8; i++) v = v * 256 + bytes[pos++]; return v; }
      throw new Error("cbor length");
    }
    function item() {
      const b = bytes[pos++];
      const mt = b >> 5;
      const ai = b & 31;
      if (mt === 0) return readLen(ai);
      if (mt === 1) return -1 - readLen(ai);
      if (mt === 2) { const n = readLen(ai); const v = bytes.slice(pos, pos + n); pos += n; return v; }
      if (mt === 3) { const n = readLen(ai); const v = new TextDecoder().decode(bytes.slice(pos, pos + n)); pos += n; return v; }
      if (mt === 4) { const n = readLen(ai); const a = []; for (let i = 0; i < n; i++) a.push(item()); return a; }
      if (mt === 5) { const n = readLen(ai); const m = new Map(); for (let i = 0; i < n; i++) { const k = item(); m.set(k, item()); } return m; }
      if (mt === 7) { if (ai === 20) return false; if (ai === 21) return true; if (ai === 22) return null; }
      throw new Error("cbor type");
    }
    return item();
  }
  function coseKeyFromAuthData(authData) {
    // authData layout: rpIdHash(32) flags(1) signCount(4) aaguid(16)
    // credIdLen(2) credId(n) then the COSE public key (CBOR map).
    const credIdLen = (authData[53] << 8) | authData[54];
    const cose = cborDecode(authData.slice(55 + credIdLen));
    const kty = cose.get(1);
    const alg = cose.get(3);
    if (kty === 2) {
      return { alg, jwk: { kty: "EC", crv: "P-256", x: bufToB64url(cose.get(-2)), y: bufToB64url(cose.get(-3)), ext: true } };
    }
    if (kty === 3) {
      return { alg, jwk: { kty: "RSA", n: bufToB64url(cose.get(-1)), e: bufToB64url(cose.get(-2)), ext: true } };
    }
    throw new Error("unsupported authenticator key type");
  }
  function derToRawSig(der) {
    // WebCrypto wants the raw r||s form; authenticators return DER.
    let pos = 0;
    if (der[pos++] !== 0x30) throw new Error("signature form");
    let len = der[pos++];
    if (len & 0x80) { const nb = len & 0x7f; len = 0; for (let i = 0; i < nb; i++) len = len * 256 + der[pos++]; }
    function readInt() {
      if (der[pos++] !== 0x02) throw new Error("signature form");
      const l = der[pos++];
      let v = der.slice(pos, pos + l);
      pos += l;
      while (v.length > 32) v = v.slice(1);
      const out = new Uint8Array(32);
      out.set(v, 32 - v.length);
      return out;
    }
    const raw = new Uint8Array(64);
    raw.set(readInt(), 0);
    raw.set(readInt(), 32);
    return raw;
  }
  async function enrollPasskey() {
    const msg = $("auth-passkey-msg");
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { id: location.hostname, name: "Centipede Peer to Peer, LLC" },
          user: { id: new TextEncoder().encode(PASSKEY_USER), name: PASSKEY_USER, displayName: "Levi Spears" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
          attestation: "none",
          timeout: 60000
        }
      });
      if (!cred) throw new Error("no credential returned");
      const attObj = cborDecode(new Uint8Array(cred.response.attestationObject));
      const key = coseKeyFromAuthData(new Uint8Array(attObj.get("authData")));
      savePasskey({ username: PASSKEY_USER, credId: bufToB64url(cred.rawId), alg: key.alg, jwk: key.jwk, signCount: 0, enrolledAt: new Date().toISOString() });
      if (msg) msg.innerHTML = "<p class=\"auth-temp-once\">Face ID is set up on this device. On this device, in this browser, every Centipede dashboard will now offer <strong>Sign in with Face ID</strong> for levi.spears. Your password still works exactly as before.</p>";
      refreshPasskeyPanel();
    } catch (err) {
      if (msg) msg.innerHTML = "<p class=\"auth-temp-once\">Face ID setup did not finish" + (err && err.name === "NotAllowedError" ? " — it was cancelled or timed out" : "") + ". Nothing was changed; your password sign-in is untouched. You can try setup again whenever you are ready.</p>";
    }
  }
  async function passkeySignIn() {
    const rec = loadPasskey();
    if (!rec) return;
    const unameEl = $("login-username");
    const typed = unameEl ? unameEl.value.trim().toLowerCase() : "";
    if (typed && typed !== PASSKEY_USER) {
      setError("Face ID on this device is set up for levi.spears only. Clear the username box, or type levi.spears, to use it — or sign in with a password as usual.");
      return;
    }
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: location.hostname,
          timeout: 60000,
          userVerification: "required",
          allowCredentials: [{ type: "public-key", id: b64urlToBuf(rec.credId) }]
        }
      });
      if (!assertion) return;
      const resp = assertion.response;
      const clientData = JSON.parse(new TextDecoder().decode(resp.clientDataJSON));
      if (clientData.type !== "webauthn.get") throw new Error("client type");
      if (clientData.challenge !== bufToB64url(challenge)) throw new Error("challenge mismatch");
      if (clientData.origin !== location.origin) throw new Error("origin mismatch");
      const authData = new Uint8Array(resp.authenticatorData);
      const rpHash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(location.hostname)));
      let rpOk = authData.length >= 37;
      for (let i = 0; rpOk && i < 32; i++) rpOk = authData[i] === rpHash[i];
      if (!rpOk) throw new Error("rpId hash mismatch");
      const flags = authData[32];
      if (!(flags & 0x01)) throw new Error("user presence flag missing");
      if (!(flags & 0x04)) throw new Error("user verification flag missing");
      const signCount = ((authData[33] << 24) | (authData[34] << 16) | (authData[35] << 8) | authData[36]) >>> 0;
      if (rec.signCount && signCount && signCount <= rec.signCount) throw new Error("signature counter went backwards");
      const clientHash = new Uint8Array(await crypto.subtle.digest("SHA-256", resp.clientDataJSON));
      const signed = new Uint8Array(authData.length + clientHash.length);
      signed.set(authData, 0);
      signed.set(clientHash, authData.length);
      const isRsa = rec.alg === -257;
      const key = await crypto.subtle.importKey("jwk", rec.jwk, isRsa ? { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" } : { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      let sig = new Uint8Array(resp.signature);
      if (!isRsa) sig = derToRawSig(sig);
      const ok = await crypto.subtle.verify(isRsa ? { name: "RSASSA-PKCS1-v1_5" } : { name: "ECDSA", hash: "SHA-256" }, key, sig, signed);
      if (!ok) throw new Error("signature did not verify");
      if (signCount) { rec.signCount = signCount; savePasskey(rec); }
      const user = findUser(PASSKEY_USER);
      if (!user) { setError("That account is not in this dashboard's sign-in list on this device. Sign in with your password instead."); return; }
      if (unameEl && !typed) unameEl.value = PASSKEY_USER;
      CTX.pending = user;
      afterPassword(user);
    } catch (err) {
      if (err && err.name === "NotAllowedError") { setError("Face ID was cancelled or timed out. Nothing was changed — your password still works below."); return; }
      setError("Face ID sign-in could not be verified on this device. Nothing was changed — your password still works below.");
    }
  }
  function setupPasskeyLogin() {
    if (!passkeySupported() || !loadPasskey()) return;
    const step = $("auth-step-login");
    if (!step || document.getElementById("auth-passkey-btn")) return;
    const wrap = document.createElement("div");
    wrap.className = "auth-passkey-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "auth-passkey-btn";
    btn.className = "btn-small";
    btn.textContent = "Sign in with Face ID";
    btn.addEventListener("click", () => passkeySignIn());
    wrap.appendChild(btn);
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = "For levi.spears, on this device only. Your password still works.";
    wrap.appendChild(hint);
    step.appendChild(wrap);
  }
  function renderPasskeyUi(user) {
    if (!user || user.username !== PASSKEY_USER || !passkeySupported()) return;
    if (document.getElementById("auth-passkey-panel")) { refreshPasskeyPanel(); return; }
    const header = document.querySelector(".app-header");
    if (!header || !header.parentNode) return;
    const panel = document.createElement("section");
    panel.id = "auth-passkey-panel";
    panel.className = "panel";
    panel.innerHTML = "<h2>Face ID sign-in — this device</h2>"
      + "<p class=\"hint\">Extra protection beyond your password, for your phone. Setting Face ID up here, on this device in this browser, turns on the <strong>Sign in with Face ID</strong> button on every Centipede dashboard on this device — one setup covers them all. The private key never leaves your phone. Your password, and levi.recovery, keep working exactly as before, and removing Face ID here never locks you out.</p>"
      + "<div id=\"auth-passkey-msg\"></div>"
      + "<div id=\"auth-passkey-actions\"></div>";
    header.parentNode.insertBefore(panel, header.nextSibling);
    refreshPasskeyPanel();
  }
  function refreshPasskeyPanel() {
    const actions = $("auth-passkey-actions");
    if (!actions) return;
    actions.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-small";
    if (loadPasskey()) {
      btn.textContent = "Remove Face ID from this device";
      btn.addEventListener("click", () => {
        clearPasskey();
        const msg = $("auth-passkey-msg");
        if (msg) msg.innerHTML = "<p class=\"auth-temp-once\">Face ID was removed from this device. Your password sign-in is unchanged.</p>";
        refreshPasskeyPanel();
      });
    } else {
      btn.textContent = "Set up Face ID sign-in on this device";
      btn.addEventListener("click", () => enrollPasskey());
    }
    actions.appendChild(btn);
  }

  window.CPPAuth = {
    mount,
    restoreSession,
    sha256Hex,
    totpVerify,
    _test: { sha256Pure, sha1Pure, hmacSha1Pure, base32Encode, base32Decode, totpCode, passwordProblem, generateTempPassword, seedRecord }
  };
})();

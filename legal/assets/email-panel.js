"use strict";
/* Centipede Peer to Peer, LLC — Email app for the dashboards (email-panel.js).
   A regular email app inside every dashboard, per the CEO's direction
   (Nov 18, 2026): folders, compose to any address, and a signature space
   where each person keeps their own signature and their own picture for
   identification (their seal is their standing profile picture, per the
   Nov 17 signature register). The new @centipedepeertopeer.llc mailboxes
   go live December 1, 2026; until then, composed mail is held in the
   Outbox queue and company email runs through the company Gmail. */
(function () {
  const PEOPLE = [
    { key: "levi", name: "Levi Allen Spears", role: "Chief Executive Officer", address: "levi@centipedepeertopeer.llc" },
    { key: "tom", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", address: "tom@centipedepeertopeer.llc" },
    { key: "eric", name: "Eric Jacobson", role: "Human Resources", address: "eric@centipedepeertopeer.llc" },
    { key: "junior", name: "Levi Spears (Junior)", role: "Field Team Member", address: "junior@centipedepeertopeer.llc" },
    { key: "monica", name: "Monica Frishkorn-Wellner", role: "Board Director", address: "monica@centipedepeertopeer.llc" },
    { key: "jarvis", name: "Jarvis", role: "Board Officer", address: "jarvis@centipedepeertopeer.llc" }
  ];
  const BOOK = ["office@centipedepeertopeer.llc","levi@centipedepeertopeer.llc","jarvis@centipedepeertopeer.llc","board@centipedepeertopeer.llc","it@centipedepeertopeer.llc","tom@centipedepeertopeer.llc","junior@centipedepeertopeer.llc","eric@centipedepeertopeer.llc","monica@centipedepeertopeer.llc","samson@centipedepeertopeer.llc","tammy@centipedepeertopeer.llc","michael@centipedepeertopeer.llc"];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  const place = (location.pathname.split("/").filter(Boolean)[0] || "site");
  const MKEY = "cpp.mail." + place + ".v1";
  const IKEY = "cpp.mail.identity.v1";
  function defaultSig(p) { return p.name + "\n" + p.role + "\nCentipede Peer to Peer, LLC\n" + p.address + " | (209) 871-3939"; }
  function identity() {
    const id = store.get(IKEY, null);
    if (id && PEOPLE.some((p) => p.key === id.key)) return Object.assign({}, PEOPLE.find((p) => p.key === id.key), id);
    return null;
  }
  function mail() { return store.get(MKEY, { drafts: [], outbox: [], sent: [] }); }
  function saveMail(m) { store.set(MKEY, m); }

  function mount(el, opts) {
    if (!el) return;
    const idn = identity();
    if (!idn) {
      el.innerHTML = `<div class="mail-app"><h3>Email</h3>
        <label>Who are you? <select id="mail-who">${PEOPLE.map((p) => `<option value="${p.key}">${esc(p.name)} — ${esc(p.address)}</option>`).join("")}</select></label>
        <button type="button" id="mail-set">Set up my email</button>
        <p class="hint">Set yourself up once — your signature space and picture live here, and your email follows you to every dashboard.</p></div>`;
      el.querySelector("#mail-set").addEventListener("click", () => {
        const p = PEOPLE.find((x) => x.key === el.querySelector("#mail-who").value);
        store.set(IKEY, { key: p.key, signature: defaultSig(p), picture: "" });
        mount(el, opts);
      });
      return;
    }
    const m = mail();
    el.innerHTML = `<div class="mail-app">
      <div style="display:flex;gap:12px;align-items:center;">
        ${idn.picture ? `<img src="${idn.picture}" alt="Your picture" width="54" height="54" style="border-radius:50%;object-fit:cover;">` : `<span style="display:inline-flex;width:54px;height:54px;border-radius:50%;background:#dfc166;color:#14532d;align-items:center;justify-content:center;font-weight:bold;">${esc(idn.name.split(" ").map((w) => w[0]).slice(0, 2).join(""))}</span>`}
        <span><strong>${esc(idn.name)}</strong><br><span class="hint">${esc(idn.address)} · Your seal is your account picture (signature register).</span></span>
      </div>
      <p class="hint">Our mailboxes go live <strong>December 1, 2026</strong>. Until then, anything you send from here waits in your Outbox, and company email runs through the company Gmail — Jarvis brings you what you need.</p>
      <h4>Compose — email goes anywhere</h4>
      <form id="mail-form">
        <label>To <input id="mail-to" type="text" list="mail-book" placeholder="any email address"></label>
        <datalist id="mail-book">${BOOK.map((a) => `<option value="${a}">`).join("")}</datalist>
        <label>Subject <input id="mail-subject" type="text"></label>
        <label>Message <textarea id="mail-body" rows="6"></textarea></label>
        <p class="hint">Your signature is added automatically:</p>
        <pre class="hint" style="white-space:pre-wrap;">${esc(idn.signature)}</pre>
        <button type="submit">Queue to send</button>
        <button type="button" id="mail-draft">Save draft</button>
        <span id="mail-msg" class="hint" role="status"></span>
      </form>
      <h4>Outbox — waiting to send (${m.outbox.length})</h4>
      <ul class="note-list">${m.outbox.map((x) => `<li><strong>${esc(x.subject || "(no subject)")}</strong> → ${esc(x.to)}<br><span class="hint">Queued ${esc(x.at)} — sends from ${esc(x.from)} when the mailboxes go live December 1, 2026.</span></li>`).join("") || '<li class="hint">Nothing queued.</li>'}</ul>
      <h4>Drafts (${m.drafts.length})</h4>
      <ul class="note-list">${m.drafts.map((x) => `<li><strong>${esc(x.subject || "(no subject)")}</strong> → ${esc(x.to)}<br><span class="hint">Saved ${esc(x.at)}</span></li>`).join("") || '<li class="hint">No drafts.</li>'}</ul>
      <h4>Inbox</h4>
      <p class="hint">Your inbox opens here on December 1, 2026, with your new address.</p>
      <h4>My signature &amp; picture — your space</h4>
      <form id="sig-form">
        <label>Your signature <textarea id="sig-text" rows="5">${esc(idn.signature)}</textarea></label>
        <label>Your picture <input id="sig-pic" type="file" accept="image/*"></label>
        <button type="submit">Save my signature &amp; picture</button>
        <span id="sig-msg" class="hint" role="status"></span>
      </form>
    </div>`;
    const readForm = () => ({ from: idn.address, to: el.querySelector("#mail-to").value.trim(), subject: el.querySelector("#mail-subject").value.trim(), body: el.querySelector("#mail-body").value, at: new Date().toLocaleString() });
    el.querySelector("#mail-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = readForm();
      if (!msg.to) { el.querySelector("#mail-msg").textContent = "Put who it goes to, and it will queue."; return; }
      const dn = Number(localStorage.getItem("cpp.mail.docno.v1") || 0) + 1;
      localStorage.setItem("cpp.mail.docno.v1", String(dn));
      msg.docNo = "CPP-EML-" + String(dn).padStart(4, "0");
      msg.subject = "[" + msg.docNo + "] " + msg.subject;
      msg.body = msg.body + "\n\n" + idn.signature;
      const mm = mail(); mm.outbox.unshift(msg); saveMail(mm);
      el.querySelector("#mail-msg").textContent = "Queued in your Outbox as document " + msg.docNo + " — it sends from " + msg.from + " when the mailboxes go live December 1.";
      mount(el, opts);
    });
    el.querySelector("#mail-draft").addEventListener("click", () => {
      const mm = mail(); mm.drafts.unshift(readForm()); saveMail(mm); mount(el, opts);
    });
    el.querySelector("#sig-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const cur = store.get(IKEY, {});
      cur.signature = el.querySelector("#sig-text").value;
      const file = el.querySelector("#sig-pic").files[0];
      if (file) {
        const r = new FileReader();
        r.onload = () => { cur.picture = r.result; store.set(IKEY, cur); mount(el, opts); };
        r.readAsDataURL(file);
      } else { store.set(IKEY, cur); el.querySelector("#sig-msg").textContent = "Signature saved."; }
    });
  }

  window.CPPMail = { mount };
  document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("email-panel");
    if (!host) return;
    let signed = false;
    try { for (let i = 0; i < sessionStorage.length; i++) { if (sessionStorage.getItem(sessionStorage.key(i))) { signed = true; break; } } } catch {}
    if (!signed) { host.innerHTML = '<p class="hint">Email — sign in above to open your email app.</p>'; return; }
    mount(host, {});
  });
})();

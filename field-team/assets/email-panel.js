"use strict";
/* Centipede Peer to Peer, LLC — Email app for the dashboards (email-panel.js).
   A regular email app inside every dashboard, per the CEO's direction
   (Nov 18, 2026): folders, compose to any address, and a signature space
   where each person keeps their own signature and their own picture for
   identification (their seal is their standing profile picture, per the
   Nov 17 signature register). The new @centipedepeertopeer.llc mailboxes
   go live December 1, 2026; until then, composed mail is held in the
   Outbox queue and company email runs through the company Gmail.
   Branding (Nov 19, 2026, CEO direction; CPP-POL-2026-059): every email
   composed or opened here wears the company brand — a letterhead-style
   frame (logo, company name, green-to-gold band, motto "Family Run
   Company", full company block, Legal line) and the sender's own
   signature plate (name, title, their seal, and the Mandated Reporter
   seal alongside ONLY when that person is a certified Mandated
   Reporter). The plate is added automatically; nobody has to build it. */
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
  /* Signature plates, matched to the email signature banner standard
     (centipede-email-signatures register, Nov 18, 2026): name, title,
     own seal, company email, phone where on record. The Mandated
     Reporter seal rides the plate ONLY for a certified Mandated
     Reporter (CPP-POL-2026-048 / CPP-POL-2026-049). Today the only
     certified person is Levi Allen Spears (CPP-MR-2026-001). Thomas
     Clark III's certificate (CPP-MR-2026-002) is held pending his
     training, so his plate carries NO Mandated Reporter seal until the
     certificate issues; when a certificate issues, set mr: true here.
     Uncertain means no seal — never the other way. */
  const PLATES = {
    levi:   { name: "Levi Allen Spears", title: "Chief Executive Officer", seal: "levi.png", email: "levi@centipedepeertopeer.llc", phone: "Cell: (209) 871-3939", mr: true, mrCaption: "Certified Mandated Reporter" },
    tom:    { name: "Thomas Leo Clark III", title: "Certified Peer Support Specialist", seal: "tom.png", email: "tom@centipedepeertopeer.llc", phone: "Cell: (925) 409-4361", mr: false },
    eric:   { name: "Eric Jacobson", title: "Human Resources (HR)", seal: "eric.png", email: "eric@centipedepeertopeer.llc", phone: "", mr: false },
    junior: { name: "Levi Spears Jr.", title: "Field Team Member", seal: "junior.png", email: "junior@centipedepeertopeer.llc", phone: "", mr: false },
    monica: { name: "Monica Frishkorn-Wellner", title: "Board Director", seal: "monica.png", email: "monica@centipedepeertopeer.llc", phone: "", mr: false },
    jarvis: { name: "Jarvis", title: "Board Officer", seal: "jarvis.png", email: "jarvis@centipedepeertopeer.llc", phone: "", mr: false }
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  const place = (location.pathname.split("/").filter(Boolean)[0] || "site");
  const MKEY = "cpp.mail." + place + ".v1";
  const IKEY = "cpp.mail.identity.v1";
  /* This file lives in each dashboard's assets/ folder, next to
     centipede-logo.png and personal-seals/. Resolve brand images from
     this script's own address so every dashboard copy works as-is. */
  const BASE = (() => { try { const s = document.currentScript && document.currentScript.src; if (s) return s.slice(0, s.lastIndexOf("/") + 1); } catch (e) {} return "assets/"; })();
  const LOGO = BASE + "centipede-logo.png";
  const sealSrc = (f) => BASE + "personal-seals/" + f;

  function plateHTML(key) {
    const p = PLATES[key];
    if (!p) return "";
    const contact = [p.phone].filter(Boolean).join(" &nbsp;|&nbsp; ");
    const mrCell = p.mr ? `<td width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>
          <td align="center" valign="top" style="padding:0;">
            <img src="${sealSrc("mandated-reporter.png")}" width="106" height="106" alt="Mandated Reporter seal" style="display:block;width:106px;height:106px;"/>
            ${p.mrCaption ? `<div style="font-size:8.5px;color:#8a6d1f;font-weight:bold;text-align:center;margin-top:2px;">${esc(p.mrCaption)}</div>` : ""}
          </td>` : "";
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td valign="middle" style="padding:4px 6px 4px 0;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;color:#10243e;line-height:1.15;">${esc(p.name)}</div>
      <div style="font-size:12px;font-weight:bold;color:#8a6d1f;letter-spacing:.4px;margin-top:2px;">${esc(p.title.toUpperCase())}</div>
      <div style="font-size:13px;font-weight:bold;color:#123d20;margin-top:3px;">Centipede Peer to Peer, LLC</div>
      <div style="font-size:12px;color:#333333;line-height:1.55;margin-top:5px;">${contact}<br/>Email: ${esc(p.email)}</div>
    </td>
    <td align="right" valign="middle" style="padding:4px 0 4px 6px;">
      <table cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
        <tr>
          <td align="center" valign="top" style="padding:0;">
            <img src="${sealSrc(p.seal)}" width="106" height="106" alt="${esc(p.name)} seal" style="display:block;width:106px;height:106px;"/>
          </td>${mrCell}
        </tr>
      </table>
    </td>
  </tr>
</table>`;
  }

  /* The letterhead-style frame: header band, meta lines, body, the
     sender's signature plate, the full company footer block, and the
     Legal line at the bottom. Used for the stored send output, the
     compose preview, and the reading view. */
  function frameHTML(o) {
    const body = esc(o.bodyText || "").replace(/\n/g, "<br/>");
    const meta = [
      o.from ? `<div><strong>From:</strong> ${esc(o.from)}</div>` : "",
      o.to ? `<div><strong>To:</strong> ${esc(o.to)}</div>` : "",
      o.subject ? `<div><strong>Subject:</strong> ${esc(o.subject)}</div>` : "",
      o.date ? `<div><strong>Date:</strong> ${esc(o.date)}</div>` : ""
    ].join("");
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px;border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;background:#ffffff;border:1px solid #d8d2bd;">
  <tr><td style="height:7px;line-height:7px;font-size:0;background:linear-gradient(to right,#1d5c2e,#c9a227);">&nbsp;</td></tr>
  <tr><td style="background:#10243e;border-bottom:2px solid #c9a227;padding:10px 14px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td width="52" valign="middle"><img src="${LOGO}" width="44" height="44" alt="Centipede Peer to Peer, LLC logo" style="display:block;width:44px;height:44px;"/></td>
      <td valign="middle" style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:bold;color:#dfc166;letter-spacing:1.4px;">CENTIPEDE PEER TO PEER, LLC<br/><span style="font-family:Arial,Helvetica,sans-serif;font-size:10.5px;font-weight:normal;color:#f0ead6;letter-spacing:.6px;">Family Run Company</span></td>
      <td align="right" valign="middle" style="font-size:10.5px;font-weight:bold;color:#ffffff;letter-spacing:1.2px;">FAMILY RUN COMPANY</td>
    </tr></table>
  </td></tr>
  ${meta ? `<tr><td style="padding:10px 16px 0 16px;font-size:12.5px;color:#444444;line-height:1.6;">${meta}</td></tr>` : ""}
  <tr><td style="padding:12px 16px 4px 16px;font-size:14px;color:#222222;line-height:1.6;">${body}</td></tr>
  ${o.plateKey && PLATES[o.plateKey] ? `<tr><td style="padding:8px 16px 12px 16px;border-top:1px solid #e3ddc8;">${plateHTML(o.plateKey)}</td></tr>` : ""}
  <tr><td style="background:#10243e;border-top:2px solid #c9a227;padding:9px 14px 10px 14px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td width="34" valign="middle"><img src="${sealSrc("company.png")}" width="30" height="30" alt="Centipede Peer to Peer, LLC company seal" style="display:block;width:30px;height:30px;"/></td>
      <td valign="middle" style="font-size:11px;color:#f0ead6;line-height:1.55;">717 E. Longview Ave., Stockton, CA 95207 &nbsp;|&nbsp; LIC: 0714781<br/>
      Cell: (209) 871-3939<br/>
      Email: centipedepeertopeer.llc@gmail.com &nbsp;|&nbsp; Board: board.centipedepeertopeer.llc@gmail.com<br/>
      Web: www.centipedepeertopeer.llc<br/>
      <span style="color:#dfc166;font-weight:bold;">Family Run Company</span> <span style="color:#ffffff;">— Peer Support &amp; Homeless Outreach, Stockton, California</span></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:8px 14px;font-size:11px;color:#555555;line-height:1.5;"><strong>Legal</strong> — Counsel: Fluetsch and Fluetsch, Attorney at Law. Centipede Peer to Peer, LLC is fully dealt with counsel.</td></tr>
</table>`;
  }

  function keyForAddress(addr) {
    const p = PEOPLE.find((x) => x.address === addr);
    return p ? p.key : "";
  }
  function viewHTML(x, fallbackKey) {
    if (x.bodyHtml) return x.bodyHtml;
    return frameHTML({
      from: x.from || "", to: x.to || "", subject: x.subject || "", date: x.at || "",
      bodyText: x.body || "", plateKey: x.fromKey || keyForAddress(x.from) || fallbackKey || ""
    });
  }

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
    const itemLine = (x, folder, i) => `<li><strong>${esc(x.subject || "(no subject)")}</strong> → ${esc(x.to)}<br><span class="hint">${folder === "outbox" ? "Queued" : folder === "sent" ? "Sent" : "Saved"} ${esc(x.at)}${folder === "outbox" ? ` — sends from ${esc(x.from)} when the mailboxes go live December 1, 2026.` : ""}</span> <button type="button" class="btn-small" data-view="${folder}:${i}">View</button></li>`;
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
        <p class="hint">And every email carries the company frame and your signature plate — added automatically, nothing for you to build:</p>
        <div style="border:1px solid #e3ddc8;padding:10px;margin:0 0 10px 0;">${plateHTML(idn.key)}</div>
        <button type="submit">Queue to send</button>
        <button type="button" id="mail-draft">Save draft</button>
        <span id="mail-msg" class="hint" role="status"></span>
      </form>
      <h4>Preview — how your email looks</h4>
      <div id="mail-preview"></div>
      <h4>Outbox — waiting to send (${m.outbox.length})</h4>
      <ul class="note-list">${m.outbox.map((x, i) => itemLine(x, "outbox", i)).join("") || '<li class="hint">Nothing queued.</li>'}</ul>
      <h4>Sent (${(m.sent || []).length})</h4>
      <ul class="note-list">${(m.sent || []).map((x, i) => itemLine(x, "sent", i)).join("") || '<li class="hint">Nothing sent from here yet — sent mail appears here when the mailboxes go live December 1, 2026.</li>'}</ul>
      <h4>Drafts (${m.drafts.length})</h4>
      <ul class="note-list">${m.drafts.map((x, i) => itemLine(x, "drafts", i)).join("") || '<li class="hint">No drafts.</li>'}</ul>
      <div id="mail-viewer"></div>
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
    const drawPreview = () => {
      const f = readForm();
      el.querySelector("#mail-preview").innerHTML = frameHTML({
        from: idn.name + " <" + idn.address + ">", to: f.to || "(recipient)", subject: f.subject || "(subject)",
        date: f.at, bodyText: f.body || "(your message)", plateKey: idn.key
      });
    };
    ["#mail-to", "#mail-subject", "#mail-body"].forEach((s) => el.querySelector(s).addEventListener("input", drawPreview));
    drawPreview();
    el.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      const parts = b.dataset.view.split(":");
      const x = (mail()[parts[0]] || [])[Number(parts[1])];
      if (!x) return;
      el.querySelector("#mail-viewer").innerHTML = `<h4>Reading view — company branding</h4>` + viewHTML(x, idn.key);
      el.querySelector("#mail-viewer").scrollIntoView();
    }));
    el.querySelector("#mail-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = readForm();
      if (!msg.to) { el.querySelector("#mail-msg").textContent = "Put who it goes to, and it will queue."; return; }
      const rawBody = msg.body;
      const dn = Number(localStorage.getItem("cpp.mail.docno.v1") || 0) + 1;
      localStorage.setItem("cpp.mail.docno.v1", String(dn));
      msg.docNo = "CPP-EML-" + String(dn).padStart(4, "0");
      msg.subject = "[" + msg.docNo + "] " + msg.subject;
      msg.body = msg.body + "\n\n" + idn.signature;
      msg.fromKey = idn.key;
      msg.bodyHtml = frameHTML({
        from: idn.name + " <" + idn.address + ">", to: msg.to, subject: msg.subject, date: msg.at,
        bodyText: rawBody, plateKey: idn.key
      });
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

  window.CPPMail = { mount, frameHTML, plateHTML, PLATES };
  document.addEventListener("DOMContentLoaded", () => {
    const host = document.getElementById("email-panel");
    if (!host) return;
    let signed = false;
    try { for (let i = 0; i < sessionStorage.length; i++) { if (sessionStorage.getItem(sessionStorage.key(i))) { signed = true; break; } } } catch {}
    if (!signed) { host.innerHTML = '<p class="hint">Email — sign in above to open your email app.</p>'; return; }
    mount(host, {});
  });
})();

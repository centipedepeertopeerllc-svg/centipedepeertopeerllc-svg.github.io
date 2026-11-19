"use strict";
/* Centipede Peer to Peer, LLC — Jarvis Dashboard (assets/app.js).
   The Chief Executive Officer's private command view in the Portal
   (CPP-POL-2026-055). Rules enforced here:
   - Nothing on this page renders before sign-in; the sign-in list
     (assets/config.js) holds the CEO's name only.
   - This page holds WORK STATUS only — open decisions, held sends,
     watches, deadlines. It holds NO client records: no client files,
     no case detail, no health information. Client detail stays in the
     client binders and the client dashboards.
   - The "Talk to Jarvis" panel is a door to the real Muse chat.
     There is no chat box on this page and nothing here simulates
     Jarvis answering. */
const CFG = window.JARVIS_DASH_CONFIG;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const state = { user: null };

/* =====================================================================
   DASHBOARD DATA — kept current by Jarvis.
   This is the one block to update when matters move: change the lines
   below and the page follows. Dates are written out in words so the
   page never shows a stale machine timestamp as if it were live.
   ===================================================================== */
const DATA = {
  updatedLabel: "Wednesday, November 19, 2026 — just after midnight",

  /* ---- Needs you: open items awaiting the CEO, most urgent first ---- */
  needsYou: [
    { title: "Portal publish — waiting on your approval",
      line: "The finished calendar update (edit and delete, the \u201cWhat it\u2019s for\u201d field, text-an-appointment) and the CPP-POL-2026-054 policy page are built, tested, and staged. One GitHub publish approval from you puts them live." },
    { title: "Staff email CPP-EML-2026-0045 — held",
      line: "The CPP-POL-2026-053 Video Check-In Calls staff notice is composed for Tom, Eric, and Junior with the policy attached. Its send approval timed out; it goes the moment you clear it." },
    { title: "HHAP — decide before Friday, 2:00 PM",
      line: "Round 6 closes Friday, November 20 at 2:00 PM. The recorded decision is pass; a squeeze-in is real only with a named eligible partner decided today, Thursday." },
    { title: "Mrs. Clark\u2019s heat — the morning calls",
      line: "PG&E Energy Savings Assistance, 1-800-933-9555, opens 8:00 AM (free furnace repair or replacement for eligible homeowners). County LIHEAP crisis line, (209) 468-1500, opens 9:00 AM. She is 82, with no heat and a furnace that will not answer." },
    { title: "Mrs. Clark\u2019s calendar share — your choice",
      line: "Her email is in your Google Contacts and in her binder. Still open: share free/busy only, or invite her to her own appointments only \u2014 Jarvis\u2019s recommendation, so no other client\u2019s business is ever on view." },
    { title: "PayPal password reset — was it you?",
      line: "PayPal emailed the company inbox a password-reset code on November 18 at 3:36 PM. The code was not used, read out, or shared. Confirm whether you started it; if not, it is treated as an unauthorized attempt." },
    { title: "Gmail signature — needs your sign-in",
      line: "Your signature card is built and ready to install. Installing it needs you signed in to the company Gmail: the saved password was rejected, and Google\u2019s recovery code goes to the old number ending 84." },
    { title: "Atlas — your call",
      line: "October balance $98.46 due December 1, with $89.47 past due and credit building paused. A follow-up to Atlas support is drafted and ready. Send it, or you have already handled it \u2014 your word decides." },
    { title: "Company manual — three answers left",
      line: "Settled: the manual serves staff and the board, and Jarvis drafts your opening letter. Still open: Portal only, or a printed binder as well; issue right after November 27 or hold until the underlying policies are final; the entity chapter written for the LLC as it stands, or after the board\u2019s entity decision." }
  ],

  /* ---- What Jarvis is tracking: grouped workstreams with a status ---- */
  tracking: [
    { group: "Client matters", items: [
      { title: "Mrs. Clark \u2014 heat out at 720 E. Longview",
        line: "Furnace diagnosis on record (thermostat calling, equipment not answering; system left off). Purchase order CPP-PO-2026-006 stands by for the moment she gives her permission \u2014 nothing moves without her yes.",
        status: "Watching" },
      { title: "Kayla Vaughn \u2014 housing path",
        line: "Gospel Center Rescue Mission findings (family and women\u2019s requirements, couples, belongings) are ready for this morning\u2019s reminder. Tom is her assigned staff; her intake paperwork is still outstanding.",
        status: "In progress" },
      { title: "CASH SJC (GiveDirectly) \u2014 three applications",
        line: "Working deadline December 1; the program closes December 2. Mrs. Clark, Tom Clark, and Annette Duncan each still owe a document or a recorded answer before anything can be filed.",
        status: "In progress" },
      { title: "Carol Shockley \u2014 outreach sent",
        line: "Volunteering and peer-support message sent November 18. Watching for her reply; no client details are ever in outreach to her.",
        status: "Watching" }
    ]},
    { group: "Board \u2014 Friday, November 27", items: [
      { title: "Board meeting \u2014 entity decision",
        line: "The LLC-to-nonprofit proposal is the board\u2019s to decide. The packet also carries CPP-POL-2026-026 and -027 for approval, the AI-use policies 002 and 003, every draft or pending program, and the Financial Officer and Chief Compliance Officer reports.",
        status: "Scheduled" },
      { title: "Solar demand replies due the same day",
        line: "Replies 044, 045, and 049 in Mrs. Clark\u2019s solar matter fall due November 27. Enphase\u2019s written system configuration is still awaited and gets filed in the solar binder when it lands.",
        status: "Watching" }
    ]},
    { group: "December 1 \u2014 the launch day", items: [
      { title: "Domain and company email",
        line: "centipedepeertopeer.llc at Porkbun and mailboxes at Purelymail. Purchase order CPP-PO-2026-007 approved ($20.81). The two checkouts are your hands; Jarvis walks you through them.",
        status: "Ready" },
      { title: "LLC-1 filing preparation",
        line: "The state search shows no LLC-1 on file for the company. Preparation runs the morning of December 1 for your review; filing and the $70 fee follow your word and the board\u2019s entity decision.",
        status: "Scheduled" },
      { title: "Monica\u2019s held email backlog",
        line: "Twelve items are logged and held \u2014 nothing is emailed to Monica until her company mailbox is live on December 1; then the backlog goes out numbered, read back, and marked delivered.",
        status: "Held" }
    ]},
    { group: "Team", items: [
      { title: "Tom Clark \u2014 starts Saturday, November 28",
        line: "He has said he will submit his employment paperwork before his start. His Mandated Reporter training and his signed SB 294 acknowledgment and emergency-contact form come before the start date. His morning brief from Jarvis runs Monday\u2013Saturday at 8:30 AM.",
        status: "Scheduled" },
      { title: "Mandated Reporter certification",
        line: "CPP-POL-2026-048: every staff member trains and certifies by December 18. Your certificate (CPP-MR-2026-001) is issued; Tom\u2019s is made and held unsigned until his training completion returns.",
        status: "In progress" }
    ]},
    { group: "Systems and the Portal", items: [
      { title: "Weekly Portal health and SEO check",
        line: "First run Monday, November 23, about 9:37 AM: every Portal surface, image, link, sign-in screen, and listing checked, with the Stockton search rankings read the same pass. A broken surface is reported, never left silent.",
        status: "Scheduled" },
      { title: "System restarts \u2014 the honest picture",
        line: "This system restarts every few hours from the host layer, which Jarvis cannot see into. Core files are verified intact after each one. Your letter to the Muse team is written, saved in your files, and not sent \u2014 you mail it yourself.",
        status: "Watching" }
    ]}
  ],

  /* ---- My Bookshelf: doors to the binder mirrors in the Portal's
     Documents library. Client binders are NEVER here — see the
     standing line rendered at the foot of the section. ---- */
  binders: [
    { name: "Policies", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/",
      line: "Every company policy as a picture of its official letterhead, with the letterhead PDF downloadable from its page." },
    { name: "Manuals", url: "https://centipedepeertopeerllc-svg.github.io/portal/manual/",
      line: "The Peer Support Manual (CPP-MAN-2026-001), issued November 18, 2026 — read it in the Portal." },
    { name: "Forms", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/",
      line: "The Forms Staff Use section of the Documents library — intake packet, release of information, SB 294 notice, purchase-order form, DAP note skeleton." },
    { name: "Governance", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/",
      line: "The Governance section of the Documents library — bylaws, operating agreement, the legality verifications, and the Family Run Company Standard." },
    { name: "Program binders", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Mirror building",
      line: "The Programs section of the Documents library — each program\u2019s dashboard and Drive folder. The binder mirrors themselves are being built." },
    { name: "Legal Binder", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Mirror building",
      line: "CPP-BND-2026-001 — the company\u2019s complete legal hand-over record. Its Portal mirror is being built; the binder itself is filed with the Legal Department." },
    { name: "Board", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Mirror building",
      line: "Board records and packets, including the November 27, 2026 meeting packet. The Portal mirror is being built." },
    { name: "HR", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Mirror building",
      line: "The HR Department binder — employee records register, SB 294 file, hiring packets. The Portal mirror is being built." },
    { name: "IT Department", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Mirror building",
      line: "The IT Department binder — systems, accounts, the domain and email migration record. The Portal mirror is being built." },
    { name: "Purchase Orders", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Mirror building",
      line: "The purchase-order binder. The Portal mirror is being built; the purchase-order form itself is posted under Forms in the Documents library." }
  ],

  /* ---- Client binders: LOCKED shelf markers only. A marker shows the
     binder's number and name and where its locked copies live. It is
     NOT a door: no contents, no documents, no link into any client
     record appears here or anywhere in the Portal. ---- */
  clientBinders: [
    { ref: "Binder 001", name: "Erene Daniolos Clark (Mrs. Clark)" },
    { ref: "Binder 002", name: "Thomas Clark — closed (now an employee)" },
    { ref: "Binder 003", name: "Kelly Scott — closed" },
    { ref: "Binder 004", name: "Carol Shockley" },
    { ref: "Binder 005", name: "Damarea Hutton" },
    { ref: "Binder 006", name: "Al (last name pending)" }
  ],
  clientBinderLine: "Locked — the copies live in the locked client binders on the company system, backed up to Dropbox. No contents are kept in the Portal, and nothing here opens them.",

  /* ---- System snapshot: dated, labeled, never a live feed ---- */
  system: {
    label: "Snapshot \u2014 Wednesday, November 18, 2026, 11:10 PM",
    line: "Last restart: Wednesday, November 18, 2026, at 10:06 PM (the integrity ledger counts it as boot 241). At that check, memory, disk, and load were all in normal ranges and every core file was intact. This line is a snapshot taken when Jarvis last refreshed this dashboard \u2014 it is not a live feed."
  }
};
/* ==================== end of DASHBOARD DATA block ==================== */

function renderNeedsYou() {
  $("needs-count").textContent = DATA.needsYou.length + (DATA.needsYou.length === 1 ? " item" : " items");
  $("needs-list").innerHTML = DATA.needsYou.map((x, i) =>
    `<li><span class="needs-num">${i + 1}</span><div><strong>${esc(x.title)}</strong><br>${esc(x.line)}</div></li>`
  ).join("");
}

function renderTracking() {
  $("tracking-groups").innerHTML = DATA.tracking.map((g) =>
    `<h3 class="track-group">${esc(g.group)}</h3>` + g.items.map((x) =>
      `<div class="track-item"><div class="row-between"><strong>${esc(x.title)}</strong><span class="badge">${esc(x.status)}</span></div><p class="hint">${esc(x.line)}</p></div>`
    ).join("")
  ).join("");
}

function renderBinders() {
  $("binder-doors").innerHTML = DATA.binders.map((b) =>
    `<a class="binder-door" href="${esc(b.url)}"><span><strong>${esc(b.name)}</strong>${b.note ? `<span class="badge">${esc(b.note)}</span>` : ""}<br><span class="hint">${esc(b.line)}</span></span><span class="binder-arrow">&rarr;</span></a>`
  ).join("");
}

function renderLockedBinders() {
  $("binder-locked").innerHTML = `<h3 class="track-group">Client binders — locked</h3>` + DATA.clientBinders.map((b) =>
    `<div class="binder-locked"><span><strong>${esc(b.ref)} — ${esc(b.name)}</strong><span class="badge lock-badge">Locked</span><br><span class="hint">${esc(DATA.clientBinderLine)}</span></span></div>`
  ).join("");
}

function renderSystem() {
  $("system-label").textContent = DATA.system.label;
  $("system-line").textContent = DATA.system.line;
  $("updated-label").textContent = "Content as of " + DATA.updatedLabel + ". Jarvis refreshes this page as matters move \u2014 ask him in the chat any time and he updates it.";
}

function enterApp() {
  $("login-screen").hidden = true;
  $("app").hidden = false;
  $("who").textContent = "Signed in: " + state.user.name + " (" + state.user.role + ")";
  $("mode-banner").textContent = "Your private workspace in the company Portal. No one else has an account on this dashboard \u2014 its sign-in list holds your name only (CPP-POL-2026-055).";
  $("mode-banner").className = "banner ok";
  renderNeedsYou();
  renderTracking();
  renderBinders();
  renderLockedBinders();
  renderSystem();
  $("logout-btn").addEventListener("click", () => { try { sessionStorage.removeItem("jarvisdash.user"); } catch { /* tab session only */ } location.reload(); });
}

function initLogin() {
  CPPAuth.mount({
    seedUsers: CFG.users,
    storeKey: "cpp.auth.jarvis.v1",
    sessionKey: "jarvisdash.user",
    onSignIn: (user) => { state.user = user; enterApp(); }
  });
}

(function boot() {
  initLogin();
  const user = CPPAuth.restoreSession();
  if (user) { state.user = user; enterApp(); }
})();

// Centipede Peer to Peer, LLC — IT Dashboard configuration.
// Rebuilt November 26, 2026 at the direction of the Chief Executive
// Officer: an IT dashboard FOR LEVI — his one place to see the state of
// the company's IT: systems status, the accounts register, the security
// log, open IT items, devices, and the IT schedule.
// ACCESS: Levi Spears and Jarvis only. Nobody else is in this seed —
// not Tom, not Eric. The Portal tile is administrator-only as well.
// Only SHA-256 hashes of the one-time temporary passwords are stored
// here (the fleet pattern). Password values are never stored in any
// file and never shown anywhere in this dashboard (CPP-POL-2026-060:
// Jarvis holds the generated passwords; values live in secure storage
// only).
window.IT_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer — Administrator", admin: true, tempPasswordSha256: "cec71dcf978ab90a120f201c26110313914f995172c3c5e0c66a0d23897341c2" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer — IT", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],

  // Systems Status seed board — every fact carries its date. Newer
  // updates are added from the desk and kept on the device until the
  // December 1 server build.
  systems: [
    { name: "Portal fleet — website, dashboards, Company Portal", status: "Live", date: "November 26, 2026", note: "Sign-in fleet-wide on the current seed; the Portal Watchdog checks every surface every 15 minutes and reported all surfaces answering." },
    { name: "Face ID sign-in (Levi's phone)", status: "Live", date: "November 26, 2026", note: "Levi-only passkey layer added to all 36 sign-in copies. Enrollment is Levi's own tap on his phone; password and recovery fallbacks unchanged." },
    { name: "Portal Find — staff search", status: "Live", date: "November 26, 2026", note: "One search box across the Portal's published pages and this device's records. Administrator-only (Levi and Tom)." },
    { name: "Women Helping Women desk build-out", status: "Live", date: "November 26, 2026", note: "Full member-facing build: About, meetings, domestic-violence help, shelter and housing, recovery, her recovery plan, resources, events, and a note-to-Levi panel." },
    { name: "Company Gmail connection (Jarvis's access)", status: "Needs re-authentication", date: "November 25, 2026", note: "The company mailbox connection has returned 401 since Levi's password change on November 25, 2026 at 10:09 PM. Re-authentication is owed; until it is done, company-inbox coverage is degraded and is reported as such. Jarvis's own Gmail is up." },
    { name: "Google Calendar connection", status: "Healthy", date: "November 26, 2026", note: "Verified tonight by calendar creates and shares (Justice Support — Probation calendar; Women Helping Women calendar). Shared calendars stay on Google Calendar after the December 1 email move." },
    { name: "Drive Integrity Watch", status: "Live", date: "November 25, 2026", note: "Stood up November 25, 2026 at 9:39 PM after the Drive folder deletions: read-only folder-manifest checks every 15 minutes against a baseline." },
    { name: "Doorknocker witness (Jarvis's system witness)", status: "Stalled", date: "November 26, 2026", note: "The witness service runs but cannot write: the server disk quota is full. The large item is the backups folder (about 77 GB) — freeing it is Levi's call; nothing has been touched." },
    { name: "Server disk", status: "Tight", date: "November 25, 2026", note: "Buildup scan, November 25, 2026: 150 GB disk, 112 GB used, 39 GB available (75%). Workspace about 100 GB, of which backups are about 77 GB." }
  ],

  // Accounts & Mailboxes register — addresses and usernames ONLY.
  // No password values anywhere, ever.
  accounts: [
    { address: "centipedepeertopeer.llc@gmail.com", holder: "Centipede Peer to Peer, LLC (company office)", role: "Company mailbox", status: "Live — connector re-authentication owed" },
    { address: "jarvis.centipedepeertopeer.llc@gmail.com", holder: "Jarvis", role: "Board Officer — Jarvis's own mailbox", status: "Live" },
    { address: "board.centipedepeertopeer.llc@gmail.com", holder: "Board of Directors", role: "Board mailbox", status: "Live" },
    { address: "tom.centipedepeertopeer.llc@gmail.com", holder: "Tom Clark", role: "Peer Support Administrator", status: "Live" },
    { address: "eric.hr.centipedepeertopeer.llc@gmail.com", holder: "Eric Jacobson", role: "Human Resources", status: "Live" },
    { address: "junior.centipedepeertopeer.llc@gmail.com", holder: "Levi Spears (Junior)", role: "Field Team Member", status: "Live" },
    { address: "office@centipedepeertopeer.llc", holder: "Centipede Peer to Peer, LLC (the office itself)", role: "Main office mailbox — all office mail copies to levi@", status: "Planned — December 1, 2026" },
    { address: "levi@centipedepeertopeer.llc", holder: "Levi Allen Spears", role: "Chief Executive Officer", status: "Planned — December 1, 2026" },
    { address: "jarvis@centipedepeertopeer.llc", holder: "Jarvis", role: "Board Officer — IT", status: "Planned — December 1, 2026" },
    { address: "board@centipedepeertopeer.llc", holder: "Board of Directors", role: "One board mailbox; member nameplate aliases (for example monica.board@) deliver into it; complaints@ also delivers into it; all board mail copies to levi@", status: "Planned — December 1, 2026" },
    { address: "it@centipedepeertopeer.llc", holder: "IT", role: "IT mailbox (IT asked for its own address for the new domain)", status: "Planned — December 1, 2026" },
    { address: "tom@centipedepeertopeer.llc", holder: "Tom Clark", role: "Peer Support Administrator", status: "Planned — December 1, 2026" },
    { address: "junior@centipedepeertopeer.llc", holder: "Levi Spears (Junior)", role: "Field Team Member", status: "Planned — December 1, 2026" },
    { address: "eric@centipedepeertopeer.llc", holder: "Eric Jacobson", role: "Human Resources", status: "Planned — December 1, 2026" },
    { address: "monica@centipedepeertopeer.llc", holder: "Monica Frishkorn-Wellner", role: "Board Director — Chief Financial Officer", status: "Planned — December 1, 2026 (her held mail delivers that day)" },
    { address: "tammy@centipedepeertopeer.llc", holder: "Tammy Lopazzo", role: "Chief Compliance Officer", status: "Planned — December 1, 2026" },
    { address: "samson@centipedepeertopeer.llc", holder: "Samson", role: "Team mailbox", status: "Planned — December 1, 2026" },
    { address: "lucy@centipedepeertopeer.llc", holder: "Lucy", role: "Assistant (Tom Clark's desk)", status: "Planned — December 1, 2026" },
    { address: "Per-dashboard Webex addresses", holder: "One per dashboard", role: "Webex-only addresses for the dashboards, created with the December 1 build if Levi settles the per-dashboard Webex model", status: "Planned — December 1, 2026, pending Levi's Webex decision" }
  ],

  // Security Log seed — the headline record. New entries are added
  // from the desk and kept on the device until December 1.
  securityLog: [
    { date: "November 26, 2026", text: "Privacy boundary set by Levi: the staff email passwords he is collecting into the Secure Vault are safekeeping only. Having a password gives Jarvis no permission to enter or send from anyone's email. Jarvis enters only his own accounts and Levi's — authorized by Levi only." },
    { date: "November 26, 2026", text: "Face ID (passkey) sign-in shipped fleet-wide for Levi only, across all 36 sign-in copies. Password and recovery fallbacks unchanged." },
    { date: "November 25, 2026", text: "Levi's verification rule: no access for anyone — even someone saying they are him — until it is verified that it is Levi Allen Spears." },
    { date: "November 25, 2026", text: "Drive folder deletions found on Levi's directed check: 12 Portal Drive folders plus the SignNow Exported Docs folder permanently deleted inside the owner account; Company Documents and its 6 subfolders restored from trash and verified. Levi directed: preserve evidence totally, treat as a legal matter. Drive Integrity Watch stood up at 9:39 PM." },
    { date: "November 25, 2026", text: "Advanced Protection Program chosen as the top Google security tier; the enrollment link was emailed to Levi (CPP-EML-2026-0187). Enrollment completion is not yet confirmed — it is not asserted as active." },
    { date: "November 25, 2026", text: "Third-party access review on Levi's Google account, done by Levi's own hands: removals and keeps worked through item by item (Meta AI's Gmail access among the removals). Removals still need a later verification pass." },
    { date: "November 25, 2026", text: "Password session: Levi changed passwords across his accounts (company Google twice — the second change broke the company Gmail connector at 10:09 PM — plus Facebook, GitHub, and others) and reset ID.me password, authenticator, and Face ID (ID.me completion reported by Levi November 26). Recovery phone confirmed as his cell." }
  ],

  // Open IT Items seed — status can be updated from the desk; updates
  // are kept on the device until December 1.
  openItems: [
    { id: "IT-OPEN-01", title: "Company Gmail re-authentication", detail: "The company mailbox connection returns 401 since November 25, 2026, 10:09 PM, after Levi's second password change. Until it is re-authenticated, company-inbox coverage is degraded.", status: "Open" },
    { id: "IT-OPEN-02", title: "December 1 domain + email build", detail: "Porkbun domain + Purelymail mailboxes — Levi's hands. Mailbox plan is in the Accounts register above. Generated passwords are issued by the company (CPP-POL-2026-060) and reach Levi personally in one letterhead letter, never by email.", status: "Waiting on Levi" },
    { id: "IT-OPEN-03", title: "SignNow quote — 20 signatures a month", detail: "Quote still owed from Mariecris Sadiua / Randy Villanueva for the revised volume ahead of the December 2 payment. Current cost on record: 30 dollars per month (Company Bills Binder, entry 1).", status: "Open" },
    { id: "IT-OPEN-04", title: "Vault intake — staff email passwords", detail: "Held at Levi's direction as a reminder for later today, November 26, 2026. Monica's password is expressly excluded — hers stays hers. Safekeeping only, per the November 26 privacy boundary: vaulted passwords are not access permission.", status: "On hold — Levi's reminder" },
    { id: "IT-OPEN-05", title: "Bitdefender on Tom's Windows laptop", detail: "Bitdefender Antivirus Free is on Levi's Chromebook (installed November 26, scan clean). Tom's Core Innovations Windows laptop is still to be done; one free Bitdefender Central account covers both machines.", status: "Open" },
    { id: "IT-OPEN-06", title: "Staff SignNow sign-ins", detail: "Every employee needs their own SignNow sign-in; Levi sets them up himself. Reminder owed to Levi.", status: "Waiting on Levi" },
    { id: "IT-OPEN-07", title: "Notebook pad — shared mode fix", detail: "The Portal notebook pad is stuck in local mode because its Supabase table was never created. The fix package is prepared; it needs Levi's Supabase session to run.", status: "Waiting on Levi" },
    { id: "IT-OPEN-08", title: "Client Dashboard database repair", detail: "The Client Dashboard app fails with SQLITE_CANTOPEN (since November 23). The binders themselves are verified intact; the database repair is the needed action.", status: "Open" },
    { id: "IT-OPEN-09", title: "Chromebook bookmark recovery check", detail: "Levi's Chromebook local Chrome profile was found wiped on November 26 after a complete sign-out (bookmarks and history gone; the portals and company data are unaffected — they live on the web). Whether Chrome sync can restore the bookmarks is unchecked; a calm check with Levi is owed.", status: "Open" },
    { id: "IT-OPEN-10", title: "Webex account model decision", detail: "Levi to pick: (a) a Webex door in each dashboard with staff accounts, or (b) a named Webex account per dashboard (Dec 1 per-dashboard email addresses). CPP-POL-2026-053 amendment follows the pick. Note: the Webex app does not run on Levi's Chromebook (needs Android 11+; his ceiling is Android 9) — Webex there is browser-join only.", status: "Waiting on Levi" },
    { id: "IT-OPEN-11", title: "Amanda's Portal capabilities push", detail: "Bulletin-board posting for all signed-in staff plus the Officer of the Day panel (names the OOD; 'Ask the Officer of the Day' note path) — built and harness-tested (42/42). The push was declined at the platform approval prompt and was not retried; it goes up on Levi's approve tap.", status: "Waiting on Levi" },
    { id: "IT-OPEN-12", title: "Monica's portal temporary password", detail: "Reset at Levi's direction on November 26 (her original temporary was never recorded anywhere, so a fresh one is set and sign-in-tested). Levi hands it to her personally on November 27. Nothing is emailed to Monica; her mail stays held until December 1.", status: "In progress" }
  ],

  // Devices seed.
  devices: [
    { name: "iPhone XR — Levi's", note: "Safari and the Google app (no Chrome on this phone). Face ID enrollment for the Portal happens on this phone: sign in with password, then the 'Face ID sign-in — this device' panel offers setup." },
    { name: "Acer Chromebook 15 CB3-532 — Levi's", note: "ChromeOS 103.0.5060.132 — the final version for this model; the machine is not broken, it is at the end of its update line. Bitdefender Antivirus Free installed November 26, 2026; his scan reports the machine safe. Chrome Remote Desktop is the chosen remote tool (the Chromebook controls other machines; TeamViewer is being dropped at Levi's direction). Interim machine until the bigger computer is built." },
    { name: "Core Innovations Windows laptop — Tom Clark's", note: "Bitdefender Antivirus Free for Windows still to be installed (one free Central account with the Chromebook install)." },
    { name: "Bigger computer — planned", note: "Levi plans to get a bigger computer built; the Chromebook setup is interim until it exists. When it is built, it becomes the Chrome Remote Desktop host the Chromebook connects into." }
  ],

  schedule: [
    { when: "December 1, 2026", what: "Domain + email go-live day (Levi's hands): Porkbun + Purelymail, the mailbox build in the Accounts register, server-side sign-in build, Monica's held mail delivered." },
    { when: "December 9, 2026, 1:00–2:00 PM", what: "Three-portal review: Main Portal, Justice Support Portal, EHR Portal — double the resources, more CEO/administrator functions for Levi's portal." },
    { when: "Every two days from November 27, 2026", what: "Deep clean sweep of the portals and website, company-wide (Levi's standing cadence), with the 15-minute Portal Watchdog between sweeps." },
    { when: "Sundays, about 8:15 PM / 8:23 PM", what: "Weekly Jarvis backup and weekly Library sync to the company Drive (CPP-POL-2026-069). First runs Sunday, November 29, 2026." }
  ]
};

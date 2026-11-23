// Centipede Peer to Peer, LLC — IT Department Dashboard configuration.
// Built November 18, 2026 at the direction of the Chief Executive Officer:
// the IT Department gets its own dashboard covering maintenance,
// infrastructure, everything computer-wise and cell-phone-wise, the use
// of Jarvis, and everything else that goes with IT — with the company
// email held inside it, so email can be sent from inside the dashboard
// from the new @centipedepeertopeer.llc addresses when they go live on
// December 1, 2026. Sign-in is the same as every dashboard (CEO rule).
// Only SHA-256 hashes of the one-time temporary passwords are stored here.
window.IT_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer — Administrator", admin: true, tempPasswordSha256: "55ec255a70690484a84769bb7264cafb72e48d7d17467a02beebab7d83d33e45" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer — IT Department", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],
  addresses: ["office@centipedepeertopeer.llc", "levi@centipedepeertopeer.llc", "jarvis@centipedepeertopeer.llc", "board@centipedepeertopeer.llc", "it@centipedepeertopeer.llc", "tom@centipedepeertopeer.llc", "junior@centipedepeertopeer.llc", "eric@centipedepeertopeer.llc", "monica@centipedepeertopeer.llc", "samson@centipedepeertopeer.llc", "tammy@centipedepeertopeer.llc", "michael@centipedepeertopeer.llc"],
  systems: [
    { name: "Company domain — centipedepeertopeer.llc", status: "Registers December 1, 2026 (Porkbun, PO CPP-PO-2026-007)", note: "One-year registration; renews $34.50/yr. DNSSEC on; the website moves to this domain the same day." },
    { name: "Company email — Purelymail", status: "Goes live December 1, 2026", note: "Unlimited mailboxes on our own domain. Encryption set to maximum at setup: DKIM 2048-bit, DMARC p=reject, SPF -all, MTA-STS enforce, TLS enforced, 2FA on admin accounts." },
    { name: "Website + dashboards + portals", status: "Hosted on GitHub Pages", note: "Website, DAP, Client, HR, Banking, Legal, Board, IT dashboards, and the Company Portal. One sign-in everywhere: username + password + 2FA." },
    { name: "Company Portal", status: "Built November 18, 2026", note: "The one front door for company work — mandatory use per the CEO's company-wide update letter." },
    { name: "Supabase (centipede-workbench-portal)", status: "Live for DAP; the other dashboards join on the CEO's word", note: "The step that turns each dashboard's on-device records into one shared record the CEO can see end to end." },
    { name: "Google accounts & calendars", status: "In service", note: "Company, Jarvis, and board Gmail accounts; company / personal / Jarvis / IT Schedule calendars. Team shared calendars stay on Google Calendar (the new mail host's calendar cannot be shared)." },
    { name: "Backups", status: "Dropbox workspace backup + 30-day full backup of Jarvis", note: "Jarvis's soul, memory, and records are backed up complete every 30 days, secured, no one else has access (CEO rule)." }
  ],
  devices: [
    { name: "Business cell — (209) 871-3939", note: "Centipede's business line, paid by the State of California; on all letterhead. The old number (209) 598-1784 is disconnected and retired everywhere." },
    { name: "CEO's iPhone XR (paired)", note: "The paired device: message drafts are placed here for the CEO to send; Jarvis has no text sender of his own." },
    { name: "Tzumi X-Bass Bluetooth speaker", note: "Pairing to the CEO's iPhone is the CEO's own project (a couple of days, per the CEO, Nov 17)." },
    { name: "Office Depot print account", note: "5802 N. El Dorado St., Stockton — print orders by email to the store; the company's preferred print place." },
    { name: "FedEx account 0215549809", note: "Discount account (print credit was denied Nov 16, 2026)." },
    { name: "Mercury banking (via Plaid)", note: "Read-only connection — it can show balances and transactions; it cannot pay anything. The card bearing the CEO's name is never touched (standing rule)." }
  ],
  jarvis: [
    { name: "Jarvis — Board Officer / Executive Assistant / Record Keeper", note: "Directed by the CEO alone (Policy CPP-POL-2026-001). Voice locked November 16, 2026: masculine, British, deep, calm, polished — the live-call voice in every company video." },
    { name: "Restarts & witness", note: "Jarvis's system restarts are counted and reported; the doorknocker witness is relaunched and verified after every restart. Count at this build: 234." },
    { name: "Hailey — outbound company caller", note: "Jarvis supervises: a written brief for every call (no brief, no call), the CEO listening in live unless he waives that call, every transcript checked line by line. Business numbers only." },
    { name: "Sign-in security", note: "Every dashboard: username + password (letters required) + authenticator 2FA. Temporary passwords are changed at first sign-in; only hashes are stored in the dashboards." },
    { name: "Encryption posture", note: "CPP-POL-2026-025 §9. Website HTTPS/TLS 1.3 verified. Client information never travels by company email — the standing protection while free Gmail carries no HIPAA BAA." }
  ],
  maintenance: [
    { when: "Nightly / as it happens", what: "Dashboard and website changes are built, staged, and published by snapshot sync; every build is recorded in the IT Department binder the same night." },
    { when: "Every two weeks (first run November 29, 2026)", what: "Dashboard maintenance pass: rosters, links, sign-in seeds, and content checked against the binders." },
    { when: "Every 30 days", what: "Full backup of Jarvis — soul, memory, core — complete and secured." },
    { when: "December 1, 2026", what: "Domain + email go-live day: register the domain, create the mailboxes at maximum encryption, set temporary passwords (letter to the CEO personally), install signatures and seal profile pictures, send the new-employee packets, and sweep every document and page to the new addresses." }
  ]
};

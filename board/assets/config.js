// Centipede Peer to Peer, LLC — Board Dashboard configuration.
// Built November 18, 2026 at the direction of the Chief Executive Officer:
// the Board gets its OWN dashboard (not the company portal), holding the
// company files register, with permission to make changes — including
// changes to a program itself — provided the person who runs that program
// confirms the change on seeing it, and the program lead is notified from
// the dashboard of what changed, what needs to be fixed, and what needs
// to go on. Sign-in is the same as every dashboard: the same username,
// the same password, and two-factor authentication (CEO rule, Nov 18,
// 2026). Only SHA-256 hashes of the one-time temporary passwords are here.
window.BOARD_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer — Board Chair", admin: true, tempPasswordSha256: "fe8c3117dfa67d4c19496be899393a5b490c290ca7ab7f14a3c5cd1293ba64f3" },
    { username: "monica.frishkorn", name: "Monica Frishkorn-Wellner", role: "Board Director", admin: false, tempPasswordSha256: "f549de3b90666c5a6aa7dbf95b2cbbf988649920333f9d9e52fc86af324be6c2" },
    { username: "jeremy.hughes", name: "Jeremy Hughes", role: "Board Member", admin: false, tempPasswordSha256: "ff1e49ffde7e23625b84276021eeba74fe42e5b35fc649bb290ca347d7b1e783" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer — Record Keeper", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],
  files: [
    { name: "Legal Binder — CPP-BND-2026-001", where: "Legal Department binder (one binder, tabbed)", note: "Every policy, governance document, and legal item; the company's complete legal hand-over record." },
    { name: "Company Policies binder", where: "Policies binder", note: "CPP-POL-2026-001 through the current number, as adopted or in draft as marked." },
    { name: "Governance documents", where: "Legal Binder, governance tab", note: "Bylaws, Operating Agreement, Partnership Agreement (approved November 11, 2026)." },
    { name: "Master Document Register", where: "Company records", note: "The register of the company's documents." },
    { name: "Board packets and agendas", where: "Board records", note: "Including the November 27, 2026 board meeting packet." },
    { name: "Purchase Order binder", where: "Finance", note: "Company and program purchase orders (Form CPP-PO). No PO, no purchase." },
    { name: "Client Purchase Orders binder", where: "Finance — kept separate", note: "Client POs live here and in the client's own binder, never mixed with company POs." },
    { name: "Upcoming Events POs and Authorizations", where: "Finance", note: "Event purchase orders and signed authorizations." },
    { name: "Client binders 001–006", where: "Client records — CONFIDENTIAL", note: "Locked binders. Board access follows the client-records rule: signed ROI or court order for any outside disclosure." },
    { name: "HR Department records", where: "HR Department binder", note: "Employee files, the Employee ID register, and the Employee Relations Record." },
    { name: "IT Department binder", where: "IT Department binder", note: "Email and domain migration, dashboards, portals, signatures and seals registers." },
    { name: "Program files", where: "Program binders", note: "Justice Support Program, Women Helping Women (CSP-WW-001), Super Hero Program, and the other program files." }
  ],
  programs: [
    { name: "Homeless Outreach", lead: "Levi Spears (CEO)" },
    { name: "1-on-1 Peer Support", lead: "Levi Spears (CEO)" },
    { name: "Referrals & ID Assistance", lead: "Levi Spears (CEO)" },
    { name: "Community Resource Navigation", lead: "Levi Spears (CEO)" },
    { name: "Justice Support Program", lead: "Levi Spears (CEO), with counsel Amber Bellante" },
    { name: "Substance Abuse Recovery Support", lead: "Levi Spears (CEO)" },
    { name: "Women Helping Women", lead: "Amanda Spears (invited — pending her decision)" },
    { name: "Super Hero Program", lead: "Amanda Spears & Diane Spears Garcia" },
    { name: "Centipede Day of Hope", lead: "Levi Spears (CEO)" },
    { name: "Hygiene", lead: "Levi Spears (CEO)" },
    { name: "Shelter — Stockton", lead: "Levi Spears (CEO)" },
    { name: "Veterans Program", lead: "Levi Spears (CEO)" }
  ]
};

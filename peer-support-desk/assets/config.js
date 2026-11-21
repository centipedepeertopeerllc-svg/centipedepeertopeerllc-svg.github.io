// Centipede Peer to Peer, LLC — Peer Support Dashboard configuration.
// Tom Clark's staff workspace in the Company Portal — built November 19,
// 2026 at the direction of the Chief Executive Officer (CPP-POL-2026-056).
// This is a staff desk, NOT the 1-on-1 Peer Support PROGRAM dashboard
// (that lives at /programs/peer-support/). Sign-in is the same as every
// dashboard: username + password + authenticator 2FA (assets/auth.js).
// Only SHA-256 hashes of one-time temporary passwords are stored here;
// the temporary passwords themselves are never in any file. The seed
// hashes are the SAME hashes the other dashboards already carry for
// each person.
// Access: Tom Clark (primary), the CEO (oversight, admin), and Jarvis.
window.PEER_DESK_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "f608b5d4344089b5b13ae31476d1e9aaa981f6074280ac2bf88dae0f68a9df69" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, tempPasswordSha256: "47400cc485f18196b6345108f222f3a733c01bed320524bcf7e82fdc98b1de4c" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],

  // What Tom needs to finish before his November 28, 2026 start.
  needsTom: [
    {
      name: "Sign and return two forms — before November 28",
      note: "The SB 294 Workplace Know Your Rights Acknowledgment and the Emergency Contact Designation Form. Both are live on the Portal's Sign a Form page — sign them there and return them before your November 28 start.",
      url: "https://centipedepeertopeerllc-svg.github.io/portal/sign/",
      linkText: "Open Sign a Form"
    },
    {
      name: "Mandated Reporter training — before November 28",
      note: "Complete the General Training at mandatedreporterca.com (the California Department of Social Services training) before November 28, 2026, under CPP-POL-2026-048. Your Mandated Reporter certificate (CPP-MR-2026-002) is issued when your training completion comes back — tell Jarvis or Eric when it is done.",
      url: "https://mandatedreporterca.com",
      linkText: "Open the training site"
    },
    {
      name: "Employment paperwork — before November 28",
      note: "You told the Chief Executive Officer you will submit your employment paperwork before November 28. If anything is missing or unclear, ask Jarvis or Eric Jacobson (Human Resources)."
    }
  ],

  // Assignment-level client information ONLY — no clinical detail, no
  // notes. The client's record lives in the Client Dashboard and the
  // client's locked binder, which remain the official record.
  myClients: [
    {
      name: "Kayla Vaughn — Client #007 (working record CP-0012)",
      note: "Your assigned client for peer support. The Chief Executive Officer is attending alongside you. Outstanding intake documents: a copy of her photo ID, her signed Release of Information, and her signed Intake & Participation Agreement. Her record itself is in the Client Dashboard and her binder — this desk carries the assignment and what is outstanding, nothing more."
    }
  ],

  // Programs offered in the appointment form (names as the Portal uses).
  programs: [
    "1-on-1 Peer Support",
    "Homeless Outreach",
    "Referrals & ID Assistance",
    "Community Resource Navigation",
    "Substance Abuse Recovery Support",
    "Women Helping Women",
    "Justice Support",
    "Other"
  ],

  // The documents Tom works from — Portal reading pages.
  documents: [
    { name: "OFFICER OF THE DAY FOLDER — Briefing for Saturday, November 21, 2026", url: "https://centipedepeertopeerllc-svg.github.io/peer-support-desk/ootd/", note: "READ FIRST. Your Officer of the Day trial day briefing paper: the day is yours to run, your phone line, Jarvis's check-in texts, your duties, and your boundaries." },
    { name: "Peer Support Manual — CPP-MAN-2026-001", url: "https://centipedepeertopeerllc-svg.github.io/portal/manual/", note: "The company's peer support manual — how Centipede does this work." },
    { name: "CPP-POL-2026-045 — Outreach Worker Skills, Training, and Field Gear", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-045.html", note: "Skills, training, and field gear standard for outreach and peer support work." },
    { name: "CPP-POL-2026-047 — Electronic Signatures", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-047.html", note: "How electronic signatures work at Centipede — the consent line and the paper alternative." },
    { name: "CPP-POL-2026-048 — Mandated Reporter Policy", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-048.html", note: "Every staff member is a mandated reporter by company policy: report by phone immediately, written report within 36 hours." },
    { name: "CPP-POL-2026-049 — Mandated Reporter Seal Use on Company Letterhead", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-049.html", note: "Once you are certified, the Mandated Reporter seal goes on your company letterhead beside your own seal." },
    { name: "CPP-POL-2026-053 — Video Check-In Calls", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-053.html", note: "Video calls with clients are non-clinical check-ins only — the Webex door, the lobby, the lock, and the 50-minute cap." },
    { name: "CPP-POL-2026-054 — Client Appointment Calendars and Text Sharing", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-054.html", note: "The shared appointment calendars and the one way to text a single appointment to the company cell." },
    { name: "CPP-POL-2026-056 — Peer Support Dashboard — Staff Workspace", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-056.html", note: "The policy behind this desk — who may use it, what it holds, and its limits." },
    { name: "Sign a Form", url: "https://centipedepeertopeerllc-svg.github.io/portal/sign/", note: "Sign company forms electronically — including your SB 294 acknowledgment and Emergency Contact form." },
    { name: "Shelter Directory", url: "https://centipedepeertopeerllc-svg.github.io/portal/shelters/", note: "Verified shelter listings for referrals." },
    { name: "Client Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/clients/", note: "Client records and paperwork — the working record beside the binders." }
  ]
};

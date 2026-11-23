// Centipede Peer to Peer, LLC — Field Team Dashboard configuration.
// The field team's staff workspace in the Company Portal — built
// November 19, 2026 at the direction of the Chief Executive Officer.
// Sign-in is the same as every dashboard: username + password +
// authenticator 2FA (assets/auth.js). Only SHA-256 hashes of one-time
// temporary passwords are stored here; the temporary passwords
// themselves are never in any file. The seed hashes are the SAME
// hashes the other dashboards already carry for each person.
// Access: the Chief Executive Officer (admin), Jarvis, Tom Clark,
// and Levi Spears (Junior).
window.FIELDTEAM_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "55ec255a70690484a84769bb7264cafb72e48d7d17467a02beebab7d83d33e45" },
    { username: "levi.recovery", name: "Levi Allen Spears (Recovery)", role: "Chief Executive Officer — Recovery Login", admin: true, tempPasswordSha256: "9eb7cc05173e7465ab8971643286057d0d909b6272f26d9ae82a5fafa68d9855" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, tempPasswordSha256: "47400cc485f18196b6345108f222f3a733c01bed320524bcf7e82fdc98b1de4c" },
    { username: "junior.spears", name: "Levi Spears (Junior)", role: "Field Team Member", admin: false, tempPasswordSha256: "db94131d335cbd5ee3d4672306b22fed0e887ba5295c245184fec25f2328a618" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],

  // Programs for the activity quick-log — slugs and names exactly as
  // the Portal's Program Activity log uses them (cpp.portal.progact.v1).
  programs: [
    { slug: "homeless-outreach", name: "Homeless Outreach" },
    { slug: "peer-support", name: "1-on-1 Peer Support" },
    { slug: "referrals-id", name: "Referrals & ID Assistance" },
    { slug: "resource-navigation", name: "Community Resource Navigation" },
    { slug: "justice-support", name: "Justice Support Program" },
    { slug: "recovery-support", name: "Substance Abuse Recovery Support" },
    { slug: "women-helping-women", name: "Women Helping Women" },
    { slug: "super-hero", name: "Super Hero Program" },
    { slug: "day-of-hope", name: "Centipede Day of Hope" },
    { slug: "hygiene-outreach", name: "Hygiene" },
    { slug: "homeless-shelter", name: "Shelter — Stockton" },
    { slug: "veterans", name: "Veterans Program" }
  ],

  // Document access — the SAME as every other desk (CEO direction,
  // Nov 19, 2026): the Company Documents library door first (the whole
  // library — policies, binders, company documents), then the working
  // set the field team uses day to day, the same Portal reading pages
  // the Peer Support Desk carries.
  documents: [
    { name: "Company Documents", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/", note: "Every company document in one place — all policies, the Peer Support Manual, the forms staff use, every program's dashboard and Drive folder, and the Reference Library." },
    { name: "Peer Support Manual — CPP-MAN-2026-001", url: "https://centipedepeertopeerllc-svg.github.io/portal/manual/", note: "The company's peer support manual — how Centipede does this work." },
    { name: "CPP-POL-2026-063 — The Field Team Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-063.html", note: "The policy behind this dashboard — who may use it, what it holds, and its limits." },
    { name: "CPP-POL-2026-045 — Outreach Worker Skills, Training, and Field Gear", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-045.html", note: "Skills, training, and field gear standard for outreach and peer support work." },
    { name: "CPP-POL-2026-047 — Electronic Signatures", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-047.html", note: "How electronic signatures work at Centipede — the consent line and the paper alternative." },
    { name: "CPP-POL-2026-048 — Mandated Reporter Policy", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-048.html", note: "Every staff member is a mandated reporter by company policy: report by phone immediately, written report within 36 hours." },
    { name: "CPP-POL-2026-049 — Mandated Reporter Seal Use on Company Letterhead", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-049.html", note: "Once you are certified, the Mandated Reporter seal goes on your company letterhead beside your own seal." },
    { name: "CPP-POL-2026-053 — Video Check-In Calls", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-053.html", note: "Video calls with clients are non-clinical check-ins only — the Webex door, the lobby, the lock, and the 50-minute cap." },
    { name: "CPP-POL-2026-054 — Client Appointment Calendars and Text Sharing", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-054.html", note: "The shared appointment calendars and the one way to text a single appointment to the company cell." },
    { name: "Sign a Form", url: "https://centipedepeertopeerllc-svg.github.io/portal/sign/", note: "Sign company forms electronically." },
    { name: "Program Activity Log", url: "https://centipedepeertopeerllc-svg.github.io/portal/program-activity/", note: "The full log — what we have done, what has been updated, and what is coming up, program by program." },
    { name: "Homeless Outreach Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/programs/homeless-outreach/", note: "The outreach program's own dashboard — its records and DAP-style notes." },
    { name: "Shelter Directory", url: "https://centipedepeertopeerllc-svg.github.io/portal/shelters/", note: "Verified shelter listings for referrals." },
    { name: "Client Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/clients/", note: "Client records and paperwork — the working record beside the binders." }
  ]
};

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
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" },
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

  // The documents and doors the field team works from — Portal pages.
  documents: [
    { name: "CPP-POL-2026-045 — Outreach Worker Skills, Training, and Field Gear", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-045.html", note: "The skills, training, and field gear standard for outreach work — the field team's own standard." },
    { name: "CPP-POL-2026-048 — Mandated Reporter Policy", url: "https://centipedepeertopeerllc-svg.github.io/portal/documents/policies/cpp-pol-2026-048.html", note: "Every staff member is a mandated reporter by company policy: report by phone immediately, written report within 36 hours." },
    { name: "Peer Support Manual — CPP-MAN-2026-001", url: "https://centipedepeertopeerllc-svg.github.io/portal/manual/", note: "The company's peer support manual — how Centipede does this work." },
    { name: "Program Activity Log", url: "https://centipedepeertopeerllc-svg.github.io/portal/program-activity/", note: "The full log — what we have done, what has been updated, and what is coming up, program by program." },
    { name: "Homeless Outreach Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/programs/homeless-outreach/", note: "The outreach program's own dashboard — its records and DAP-style notes." },
    { name: "Shelter Directory", url: "https://centipedepeertopeerllc-svg.github.io/portal/shelters/", note: "Verified shelter listings for referrals." }
  ]
};

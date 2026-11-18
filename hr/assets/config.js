// Centipede Peer to Peer, LLC — HR Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.HR_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "hr_records",

  // Sign-in users (username + password + 2FA — see assets/auth.js).
  // Only the SHA-256 hash of each person's one-time TEMPORARY password is
  // stored here; the temporary passwords themselves are never in any file.
  // At first sign-in the person must set their own password (at least 10
  // characters, at least one letter, never only numbers) and enroll an
  // authenticator app. The CEO (admin: true) can reset passwords and 2FA
  // from the "Admin — user access" panel after sign-in.
  // Member-view rule: each user sees ONLY their own record (filtered on
  // employeeId in app.js). Users with seeAll: true — the CEO (employeeId
  // 2001), Jarvis as HR administrator, and Eric Jacobson (Human
  // Resources) — see every record.
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, employeeId: 2001, seeAll: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, employeeId: 2005, seeAll: false, tempPasswordSha256: "f742fc459b375e7d15a85aed9f6d30568241b458f1f580aad97844790247dc02" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer / HR Administrator", admin: false, employeeId: null, seeAll: true, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" },
    { username: "eric.jacobson", name: "Eric Jacobson", role: "Human Resources", admin: false, employeeId: null, seeAll: true, tempPasswordSha256: "7589ffac8ada0beb0999a6905cf098c22aa3637c6297ea5dee0c4c92cb28e669" },
    { username: "junior.spears", name: "Levi Spears (Junior)", role: "Field Team Member", admin: false, employeeId: 2002, seeAll: false, tempPasswordSha256: "db94131d335cbd5ee3d4672306b22fed0e887ba5295c245184fec25f2328a618" },
    { username: "monica.frishkorn", name: "Monica Frishkorn-Wellner", role: "Board Director", admin: false, employeeId: 2003, seeAll: false, tempPasswordSha256: "f549de3b90666c5a6aa7dbf95b2cbbf988649920333f9d9e52fc86af324be6c2" },
    { username: "jeremy.hughes", name: "Jeremy Hughes", role: "Board Member", admin: false, employeeId: 2004, seeAll: false, tempPasswordSha256: "ff1e49ffde7e23625b84276021eeba74fe42e5b35fc649bb290ca347d7b1e783" }
  ],

  // People seed — names, employee IDs, and roles ONLY. No personal data
  // (no personal email addresses, no end dates, no ID numbers) is held here.
  people: [
    { employeeId: 2001, name: "Levi Allen Spears", role: "Chief Executive Officer" },
    { employeeId: 2002, name: "Levi Spears (Junior)", role: "Field Team Member" },
    { employeeId: 2003, name: "Monica Frishkorn-Wellner", role: "Board Director" },
    { employeeId: 2004, name: "Jeremy Hughes", role: "Board Member" },
    { employeeId: 2005, name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", startDate: "November 28, 2026" }
  ],

  // Documents register seed — register entries only (title + note), no files.
  // The stray register-only row from the in-app dashboard ("Psychologist",
  // doc_type "926543091", no file) is deliberately NOT carried in — see
  // README, "Known HR data flaws".
  documentsSeed: [
    { employeeId: 2005, title: "Psychology degree", note: "Psychology degree — verified by CEO Nov 15, 2026; paperwork being sent to CEO" }
  ],

  // Company policies offered in the Policies Acknowledgment section.
  policies: [
    "CPP-POL-2026-001 — Policy on Jarvis (Role, Use, Authority, and Separation of Records)",
    "Employee Handbook / HR Charter (CHR-2026-002)",
    "Confidentiality and Client Records Standard",
    "Family Run Company Standard (2026-11-13)"
  ]
};

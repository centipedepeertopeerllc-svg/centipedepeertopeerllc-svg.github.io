// Centipede Peer to Peer, LLC — HR Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.HR_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "hr_records",

  // Named users. accessCodeSha256 is the SHA-256 hex of the user's access
  // code (the code itself is never stored in this file). STARTER codes are
  // documented in README.md and MUST be changed by the CEO.
  // Member-view rule: each user sees ONLY their own record (filtered on
  // employeeId in app.js). Users with seeAll: true — the CEO (employeeId
  // 2001) and Jarvis as HR administrator — see every record.
  users: [
    { name: "Levi Allen Spears", role: "Chief Executive Officer", employeeId: 2001, seeAll: true, accessCodeSha256: "3b47492744946d5a188be73c702fb2e3cd1b635433f841381ae8d2e0ed67b45f" },
    { name: "Levi Spears (Junior)", role: "Field Team Member", employeeId: 2002, seeAll: false, accessCodeSha256: "0af7d7158becc6d02dc41536107090e77195cf90c556cadb37866528cc94e8a9" },
    { name: "Monica Frishkorn-Wellner", role: "Board Director", employeeId: 2003, seeAll: false, accessCodeSha256: "2cec8cf0e321c284fa0c2ebef804aac18bf1cbb85546f89e7e3d0b6aa8b9d2cf" },
    { name: "Jeremy Hughes", role: "Board Member", employeeId: 2004, seeAll: false, accessCodeSha256: "9a20ae78840d1a444686d7ef12f62082888b1f764151438badc3f5e0122f1429" },
    { name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", employeeId: 2005, seeAll: false, accessCodeSha256: "da26b77becf8bcc17aa4e59a0205d8910373e5a25e0d7993fd5b2856c21ecdbb" },
    { name: "Jarvis", role: "Board Officer / HR Administrator", employeeId: null, seeAll: true, accessCodeSha256: "7ac25d5d84cae3dcc037c52a93dfe320fe83b2a6abe787451b4fc15aeba2c9e7" }
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

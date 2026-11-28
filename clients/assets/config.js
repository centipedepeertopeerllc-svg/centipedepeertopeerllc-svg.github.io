// Centipede Peer to Peer, LLC — Client Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.CLIENT_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "client_records",

  // Sign-in users (username + password + 2FA — see assets/auth.js).
  // Only the SHA-256 hash of each person's one-time TEMPORARY password is
  // stored here; the temporary passwords themselves are never in any file.
  // At first sign-in the person must set their own password (at least 10
  // characters, at least one letter, never only numbers) and enroll an
  // authenticator app. The CEO (admin: true) can reset passwords and 2FA
  // from the "Admin — user access" panel after sign-in.
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "a0352d5f19ef4e95fca276f013a538efd0a074587637606c25b5768f733f7578" },
    { username: "levi.recovery", name: "Levi Allen Spears (Recovery)", role: "Chief Executive Officer — Recovery Login", admin: true, tempPasswordSha256: "9eb7cc05173e7465ab8971643286057d0d909b6272f26d9ae82a5fafa68d9855" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, tempPasswordSha256: "ed7b4fb9eab7adddc48880343cf45c3b5504db46064f7551a03d5f745e677a4c" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" },
    { username: "eric.jacobson", name: "Eric Jacobson", role: "Human Resources", admin: false, tempPasswordSha256: "7589ffac8ada0beb0999a6905cf098c22aa3637c6297ea5dee0c4c92cb28e669" }
  ],

  // Authors for entry Author drop-downs.
  authors: ["Levi Allen Spears", "Thomas Leo Clark III", "Jarvis"],

  // Programs — names + honest status labels mirroring the in-app dashboard
  // and the public website (Active / In Development / Pending Board Approval / Draft).
  programs: [
    "Peer Support",
    "Homeless Outreach",
    "Justice Support",
    "Housing Navigation",
    "Veterans Program",
    "Family Support",
    "Other"
  ],
  enrollmentStatuses: ["Active", "In Development", "Pending Board Approval", "Draft"],
  referralTypes: [
    "Shelter", "Medical", "Mental health", "Substance use treatment",
    "Benefits", "Housing navigation", "ID / documents", "Legal",
    "Employment", "Food", "Other"
  ],
  referralStatuses: ["Referred", "Contacted", "In Progress", "Completed", "Declined", "Unable to Reach"],
  services: [
    "Peer support", "Wellness check", "Shelter navigation", "Housing navigation",
    "Benefits help", "ID / documents help", "Medical support", "Mental health support",
    "Substance-use support", "Transportation", "Food / water / supplies", "Other"
  ],
  locationTypes: [
    "Encampment", "Street outreach", "Shelter", "Motel / hotel",
    "Office", "Phone", "Hospital", "Client home", "Other"
  ],

  // Client seed — names and codes ONLY, no clinical content, no SSNs, no notes.
  // Thomas Leo Clark III is staff, not a client — not in this list.
  // CP-0010 is a flagged placeholder ONLY: its record is missing from the
  // in-app dashboard and must NOT be recreated from assumption. It is
  // non-selectable for new entries (see app.js) until restored with the CEO.
  clients: [
    { code: "CP-0006", label: "Erene Daniolos Clark — CP-0006 (Client #001)", name: "Erene Daniolos Clark", clientNo: "Client #001", missing: false },
    { code: "Client #004", label: "Carol Shockley — Client #004", name: "Carol Shockley", clientNo: "Client #004", missing: false },
    { code: "Client #005", label: "Damarea Hutton — Client #005", name: "Damarea Hutton", clientNo: "Client #005", missing: false },
    { code: "Client #006", label: "Al — Client #006 (last name pending)", name: "Al", clientNo: "Client #006", missing: false },
    { code: "CP-0010", label: "Annette Duncan — CP-0010 — Record missing from dashboard — restore pending with CEO; do not use", name: "Annette Duncan", clientNo: "CP-0010", missing: true }
  ]
};

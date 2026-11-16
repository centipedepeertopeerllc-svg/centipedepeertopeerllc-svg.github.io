// Centipede Peer to Peer, LLC — Client Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.CLIENT_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "client_records",

  // Named users. accessCodeSha256 is the SHA-256 hex of the user's access
  // code (the code itself is never stored in this file). STARTER codes are
  // documented in README.md and MUST be changed by the CEO before real
  // client records are entered. Hashes reused exactly from the DAP dashboard.
  users: [
    { name: "Levi Allen Spears", role: "Chief Executive Officer", accessCodeSha256: "3b47492744946d5a188be73c702fb2e3cd1b635433f841381ae8d2e0ed67b45f" },
    { name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", accessCodeSha256: "da26b77becf8bcc17aa4e59a0205d8910373e5a25e0d7993fd5b2856c21ecdbb" },
    { name: "Jarvis", role: "Board Officer", accessCodeSha256: "7ac25d5d84cae3dcc037c52a93dfe320fe83b2a6abe787451b4fc15aeba2c9e7" }
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

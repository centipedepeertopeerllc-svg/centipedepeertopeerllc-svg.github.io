// Centipede Peer to Peer, LLC — DAP Noting Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.DAP_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "dap_notes",

  // Sign-in users (username + password + 2FA — see assets/auth.js).
  // Only the SHA-256 hash of each person's one-time TEMPORARY password is
  // stored here; the temporary passwords themselves are never in any file.
  // At first sign-in the person must set their own password (at least 10
  // characters, at least one letter, never only numbers) and enroll an
  // authenticator app. The CEO (admin: true) can reset passwords and 2FA
  // from the "Admin — user access" panel after sign-in.
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, tempPasswordSha256: "f742fc459b375e7d15a85aed9f6d30568241b458f1f580aad97844790247dc02" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" },
    { username: "eric.jacobson", name: "Eric Jacobson", role: "Human Resources", admin: false, tempPasswordSha256: "7589ffac8ada0beb0999a6905cf098c22aa3637c6297ea5dee0c4c92cb28e669" }
  ],

  // Authors for the note Author drop-down (per CEO direction, Nov 15, 2026).
  authors: ["Levi Allen Spears", "Thomas Leo Clark III", "Jarvis"],

  // Client drop-down seed — names and codes ONLY, no client note content.
  // Per CEO direction: Kelly Scott (terminated Nov 12, 2026) is excluded.
  // Thomas Leo Clark III graduated from client status Nov 14, 2026 and is
  // staff (an author), not a client — excluded.
  clients: [
    { code: "CP-0006", label: "Erene Daniolos Clark — CP-0006 (Client #001)" },
    { code: "Client #004", label: "Carol Shockley — Client #004" },
    { code: "Client #005", label: "Damarea Hutton — Client #005" },
    { code: "Client #006", label: "Al — Client #006 (last name pending)" },
    { code: "CP-0010", label: "Annette Duncan — CP-0010" }
  ]
};

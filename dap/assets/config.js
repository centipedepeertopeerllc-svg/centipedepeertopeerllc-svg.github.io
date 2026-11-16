// Centipede Peer to Peer, LLC — DAP Noting Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.DAP_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "dap_notes",

  // Named users. accessCodeSha256 is the SHA-256 hex of the user's access
  // code (the code itself is never stored in this file). STARTER codes are
  // documented in README.md and MUST be changed by the CEO before real
  // client notes are entered.
  users: [
    { name: "Levi Allen Spears", role: "Chief Executive Officer", accessCodeSha256: "3b47492744946d5a188be73c702fb2e3cd1b635433f841381ae8d2e0ed67b45f" },
    { name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", accessCodeSha256: "da26b77becf8bcc17aa4e59a0205d8910373e5a25e0d7993fd5b2856c21ecdbb" },
    { name: "Jarvis", role: "Board Officer", accessCodeSha256: "7ac25d5d84cae3dcc037c52a93dfe320fe83b2a6abe787451b4fc15aeba2c9e7" }
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

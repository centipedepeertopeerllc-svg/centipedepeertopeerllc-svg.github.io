// Centipede Peer to Peer, LLC — Legal Department Portal configuration.
// Built November 18, 2026 at the direction of the Chief Executive Officer:
// a portal for the Legal Department, set up like the other company portals
// (username + password + 2FA), with access for the CEO and Amber Bellante
// ONLY, so that things can be sent to the Legal Department and documented.
// The portal logo is the Justice Support Program seal (CEO direction).
// Only the SHA-256 hash of each person's one-time TEMPORARY password is
// stored here; the temporary passwords themselves are never in any file.
window.LEGAL_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "fe8c3117dfa67d4c19496be899393a5b490c290ca7ab7f14a3c5cd1293ba64f3" },
    { username: "amber.bellante", name: "Amber Bellante", role: "Counsel — Legal Department / Justice Support Program", admin: false, tempPasswordSha256: "fe8c3117dfa67d4c19496be899393a5b490c290ca7ab7f14a3c5cd1293ba64f3" }
  ],
  // Legal Binder (CPP-BND-2026-001) tab index — titles only. The binder
  // itself is the official record; document contents are NOT in this portal.
  register: [
    { tab: "Tab 1", title: "Policies", note: "Every company policy, CPP-POL-2026-001 onward, current text, drafts marked DRAFT." },
    { tab: "Tab 2", title: "Governance", note: "Bylaws, Operating Agreement, Partnership Agreement (executed November 11, 2026); board and entity records." },
    { tab: "Tab 3", title: "Correspondence", note: "Secretary of State exchange and legal correspondence." },
    { tab: "Tab 4", title: "Verifications", note: "CPP-VER-2026-001 / -002 / -003 verification records." },
    { tab: "Tab 5", title: "Department Records", note: "Legal Department charter, counsel outreach, Employee Relations Record notes, and department working records." },
    { tab: "Tab 6", title: "Client Legal Matter — Mrs. Clark Solar Matter", note: "The complete solar legal file, kept current from the matter binder." }
  ]
};

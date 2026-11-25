// Centipede Peer to Peer, LLC — Justice Support Center Case Tracker configuration.
// Built November 24, 2026 at the direction of the Chief Executive Officer:
// a Clio-style case tracker for the Justice Support Center, inside the
// Company Portal, in the Legal Department area. Centipede is NOT a law
// firm — this tracker supports people through the criminal justice
// process; it does not hold legal advice and it is not a law practice
// system. Access: the Chief Executive Officer (administrator),
// Amber Bellante (Legal Department / Justice Support Program), and
// Tom Clark (added November 24, 2026 at the CEO's direction — he will
// be working with people in the Justice Support Center; working access,
// not an administrator). Sign-in is the same as every dashboard: username + password
// + authenticator 2FA (assets/auth.js).
// Only the SHA-256 hash of each person's one-time TEMPORARY password is
// stored here; the temporary passwords themselves are never in any file.
// The seed hashes are the SAME hashes the other dashboards already
// carry for each person, so the Portal-wide sign-in agreement holds.
window.JUSTICE_DESK_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "cec71dcf978ab90a120f201c26110313914f995172c3c5e0c66a0d23897341c2" },
    { username: "levi.recovery", name: "Levi Allen Spears (Recovery)", role: "Chief Executive Officer — Recovery Login", admin: true, tempPasswordSha256: "9eb7cc05173e7465ab8971643286057d0d909b6272f26d9ae82a5fafa68d9855" },
    { username: "amber.bellante", name: "Amber Bellante", role: "Counsel — Legal Department / Justice Support Program", admin: false, tempPasswordSha256: "ab35e5ad31d4fd4fe4f3853eca29f4794b1fd31701a19a62bbde10cc556a75f4" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist — Justice Support Center", admin: false, tempPasswordSha256: "47400cc485f18196b6345108f222f3a733c01bed320524bcf7e82fdc98b1de4c" }
  ],

  // Stages of a matter in the criminal justice process, in plain
  // language, in the order they usually happen. "Resolved / Closed"
  // matters no longer count as open.
  stages: [
    "Awaiting Filing",
    "Arraignment",
    "Pretrial",
    "Hearing",
    "Sentencing",
    "Probation / Compliance",
    "Resolved / Closed"
  ],

  // Kinds of court dates and deadlines the tracker watches.
  hearingTypes: [
    "Arraignment",
    "Pretrial Conference",
    "Hearing",
    "Sentencing",
    "Probation Check-In",
    "Filing Deadline",
    "Other Court Date"
  ],

  // Roles for the contact book — the people and offices a matter touches.
  contactRoles: [
    "Court",
    "Probation",
    "Attorney",
    "Family",
    "Support Person",
    "Agency",
    "Other"
  ]
};

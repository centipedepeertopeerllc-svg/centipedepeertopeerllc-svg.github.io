// Centipede Peer to Peer, LLC — Banking Dashboard configuration.
// Only the Supabase PUBLISHABLE (anon) key belongs in browser code.
// The service_role key must NEVER appear here or anywhere client-side.
window.BANKING_CONFIG = {
  supabaseUrl: "https://xaogzcoefeirezhicovs.supabase.co",
  supabasePublishableKey: "sb_publishable_nek2I10pkRAWf8_-m3X0UA_aQVAH-lR",
  table: "banking_records",

  disclosure: "Account data shown is a point-in-time record kept by Centipede Peer to Peer, LLC; figures are labeled with their as-of date and are not live bank balances.",
  asOfLabel: "As of November 15, 2026",
  asOfDate: "2026-11-15",

  // Sign-in users (username + password + 2FA — see assets/auth.js).
  // Only the SHA-256 hash of each person's one-time TEMPORARY password is
  // stored here; the temporary passwords themselves are never in any file.
  // At first sign-in the person must set their own password (at least 10
  // characters, at least one letter, never only numbers) and enroll an
  // authenticator app. The CEO (admin: true) can reset passwords and 2FA
  // from the "Admin — user access" panel after sign-in.
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" },
    { username: "eric.jacobson", name: "Eric Jacobson", role: "Human Resources", admin: false, tempPasswordSha256: "7589ffac8ada0beb0999a6905cf098c22aa3637c6297ea5dee0c4c92cb28e669" }
  ],

  // Accounts on record. Balances are point-in-time records with an as-of
  // date — never live balances. See the disclosure line above.
  accounts: [
    { nickname: "Checking", last4: "2468", balance: "$1.03", asOf: "As of November 15, 2026" },
    { nickname: "Savings", last4: "8729", balance: "$0.00", asOf: "As of November 15, 2026" }
  ],

  // Program cards on record. All cards draw on Checking (last-4 2468)
  // per the record. Where no limit is on record, limit is null and the
  // page displays "limit not on record" — no limit is invented.
  // Where the last-4 has not been captured yet, last4 is null and the
  // page displays "last-4 pending capture".
  programCards: [
    { nickname: "Shelter", last4: "6444", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Veterans", last4: "2399", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Referrals & Hygiene", last4: "3257", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Referrals & IDs", last4: "3244", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Substance Abuse Support", last4: "5259", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Field Team Assistant", last4: "2056", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Justice Support", last4: "7549", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Homeless Outreach", last4: "7720", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Amanda Assistant", last4: "3490", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Centipede General", last4: "4643", limit: null, drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Super Hero Program", last4: null, limit: "$5,000", drawsOn: "Checking \u2022\u20222468" },
    { nickname: "Tom Clark Payroll Card", last4: null, limit: "$5,000", drawsOn: "Checking \u2022\u20222468" }
  ],

  // Tax Center seed — counts only, as recorded with date.
  taxCenter: {
    asOf: "As of November 15, 2026",
    pendingAssignment: 0,
    pendingAssignmentNote: "On record November 15, 2026: sync November 12\u201315, 2026 showed 0 transactions.",
    needingTaxCategory: 0,
    needingTaxCategoryNote: "On record November 15, 2026: 0 transactions are recorded, so 0 are waiting for a tax category.",
    cpaNote: "A licensed CPA/tax advisor confirms categories before any filing use."
  },

  // Transactions pending assignment seed — as recorded November 15, 2026.
  pendingTransactions: []
};

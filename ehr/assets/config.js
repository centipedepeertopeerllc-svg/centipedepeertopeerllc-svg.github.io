// Centipede Peer to Peer, LLC — Centipede EHR configuration.
// Built November 24, 2026 at the direction of the Chief Executive
// Officer: Centipede's own internal peer-support record system,
// modeled on the feature set of SimplePractice (clients, calendar,
// session notes, support plans, documents, billing & insurance,
// reminders) and reshaped for a NON-CLINICAL peer-support company.
// Centipede staff support, coach, mentor, and navigate — they do not
// diagnose and they do not provide clinical services. Sign-in is the
// same as every Portal dashboard: username + password + authenticator
// 2FA (assets/auth.js). Only the SHA-256 hash of each person's
// one-time TEMPORARY password is stored here; temporary passwords
// themselves are never in any file. The seed hashes are the SAME
// hashes the other dashboards already carry for each person, so the
// Portal-wide sign-in agreement holds.
window.EHR_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "8753c9cd72388ce70eb4a35fe04364adc3bf37e72b9daf9eeafbb80c13cb5037" },
    { username: "levi.recovery", name: "Levi Allen Spears (Recovery)", role: "Chief Executive Officer — Recovery Login", admin: true, tempPasswordSha256: "9eb7cc05173e7465ab8971643286057d0d909b6272f26d9ae82a5fafa68d9855" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Peer Support Administrator", admin: false, tempPasswordSha256: "47400cc485f18196b6345108f222f3a733c01bed320524bcf7e82fdc98b1de4c" }
  ],

  programs: [
    "Peer Support",
    "Homeless Outreach",
    "Housing Stability Services",
    "Mental Health Outreach & Navigation",
    "Crisis Support & Resource Connection",
    "Substance Use Recovery Support",
    "Justice Support",
    "Women Helping Women",
    "Veterans Program",
    "Super Hero Program",
    "Day of Hope",
    "Other"
  ],

  clientStatuses: ["Active", "Waitlist", "Paused", "Closed"],

  serviceTypes: [
    "Peer Support Session",
    "Intake / Enrollment",
    "Care Coordination",
    "Housing Navigation",
    "Benefits Navigation",
    "Wellness Check-In",
    "Group Support",
    "Transportation Support",
    "Follow-Up Visit",
    "Other Support"
  ],

  appointmentStatuses: ["Scheduled", "Completed", "Cancelled", "No-Show"],

  documentTypes: [
    "Intake Packet",
    "Release of Information (ROI)",
    "HIPAA Authorization",
    "Photo Authorization",
    "Authorization for Services",
    "Referral Form",
    "Billing Form",
    "Homeless Verification",
    "IHSS Enrollment",
    "Shelter Stay Agreement",
    "ID Assistance Request",
    "Signed Form — Other"
  ],

  documentStatuses: ["On File", "Pending Signature", "Signed", "Expired"],

  // Peer-support service codes used on the service log for billing
  // tracking only. This system tracks claim status; it does not
  // submit claims.
  serviceCodes: [
    { code: "H0038", label: "H0038 — Peer Support Services (per 15 min)" },
    { code: "T1016", label: "T1016 — Care Coordination (per 15 min)" },
    { code: "T1017", label: "T1017 — Support Navigation (per 15 min)" },
    { code: "OTHER", label: "Other — see note" }
  ],

  claimStatuses: ["Not Submitted", "Submitted", "Paid", "Denied"]
};

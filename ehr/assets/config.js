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

  // Profession / role options for staff profiles, mirroring the
  // list SimplePractice offers at profile setup (Levi's direction,
  // Nov 24, 2026). A data field only — each person selects the
  // profession that matches their own credential or role.
  professions: [
    "Social Worker",
    "Psychologist",
    "Counselor",
    "Therapist",
    "Psychiatrist",
    "Nurse Practitioner",
    "Marriage & Family Therapist",
    "Case Manager",
    "Peer Support Specialist",
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


  // Work-area outlines (Levi's direction, Nov 24, 2026): clicking a
  // profession / behavioral-health area opens its outline — what
  // that role works on, the kinds of services or support in that
  // area, and what gets documented in the EHR. Written factually,
  // the way SimplePractice presents its areas. Centipede's own
  // services are non-clinical peer support; outlines for licensed
  // professions describe those professions generally, for reference.
  workAreas: [
    { name: "Peer Support Specialist", summary: "Peer support is Centipede's own work: support from people with lived experience, walking beside a person as they work toward their own goals.", worksOn: ["Building trust and a steady support relationship", "Goal-setting with the person, in their own words", "Navigation to housing, benefits, health care, and community resources", "Wellness check-ins and follow-up"], services: ["Peer support sessions", "Care coordination and warm hand-offs", "Housing and benefits navigation", "Group support and community connection"], documents: ["DAP session notes", "Support plans and review dates", "Referrals and follow-ups in the service log"] },
    { name: "Case Manager", summary: "Case management coordinates a person's services and supports across agencies, keeping one clear picture of what is in place and what is still needed.", worksOn: ["Coordinating services across providers and agencies", "Tracking applications, appointments, and deadlines", "Connecting people to housing, income, and health coverage", "Keeping the care team and the person on the same page"], services: ["Care coordination meetings", "Referral tracking and follow-through", "Benefits and housing application support"], documents: ["Coordination notes", "Service log entries with status", "Documents checklist per client"] },
    { name: "Social Worker", summary: "Social work focuses on a person's social needs and environment — housing, family, community resources, and advocacy within systems.", worksOn: ["Psychosocial needs and social determinants of health", "Resource connection and advocacy", "Family and support-network involvement", "Discharge and transition planning"], services: ["Resource and benefits navigation", "Advocacy with agencies and landlords", "Support planning with the person and family"], documents: ["Session notes", "Support plans", "Referral and resource records"] },
    { name: "Counselor", summary: "Counseling is a licensed profession centered on structured talk-based support for mental health and life challenges, provided by licensed practitioners in their own settings.", worksOn: ["Structured sessions around goals the client sets", "Coping skills and problem-solving", "Progress reviews against a plan the practitioner maintains"], services: ["Individual sessions", "Group sessions", "Family sessions"], documents: ["Session notes in the practitioner's record system", "Plans and progress reviews"] },
    { name: "Therapist", summary: "Therapist is a general title used by several licensed professions (counseling, social work, marriage & family therapy, psychology) for talk-based support work.", worksOn: ["Talk-based sessions in the practitioner's licensed discipline", "Skill-building and support around the client's goals", "Coordination with the client's other providers, with consent"], services: ["Individual sessions", "Couples and family sessions", "Group sessions"], documents: ["Session notes", "Plans and reviews in the practitioner's own system"] },
    { name: "Psychologist", summary: "Psychology is a doctoral-level licensed profession covering assessment, testing, and talk-based support for mental health and behavior.", worksOn: ["Psychological testing and evaluation (in licensed settings)", "Evidence-based talk-based support", "Consultation with other providers"], services: ["Evaluation appointments", "Individual sessions", "Consultation"], documents: ["Evaluation reports (in licensed systems)", "Session notes"] },
    { name: "Psychiatrist", summary: "Psychiatry is a medical specialty: psychiatrists are physicians who evaluate mental health and can prescribe medication.", worksOn: ["Medical evaluation of mental health", "Medication prescribing and management", "Coordination with primary care and other providers"], services: ["Evaluation appointments", "Medication management visits"], documents: ["Medical records in the prescribing system", "Visit notes"] },
    { name: "Nurse Practitioner", summary: "Nurse practitioners are advanced practice nurses who provide primary and behavioral-health care, including prescribing, within their license and setting.", worksOn: ["Health assessments and ongoing care", "Behavioral-health care and prescribing in their setting", "Health education and follow-up"], services: ["Clinic visits", "Follow-up and monitoring visits"], documents: ["Visit notes in the medical record", "Care plans"] },
    { name: "Marriage & Family Therapist", summary: "Marriage & family therapy is a licensed profession focused on relationships — couples, families, and the systems around a person.", worksOn: ["Couples and family sessions", "Communication and relationship patterns", "Support through family transitions"], services: ["Couples sessions", "Family sessions", "Individual sessions focused on relationships"], documents: ["Session notes", "Plans and reviews in the practitioner's system"] },
    { name: "Substance Use Support", summary: "Substance-use support at Centipede is peer-led recovery support: encouragement, stabilization support, and connection to resources — never clinical services.", worksOn: ["Recovery goal-setting with the person", "Connection to meetings, programs, and community supports", "Relapse-prevention planning in the person's own terms", "Housing and stability support alongside recovery"], services: ["Peer recovery support sessions", "Resource navigation", "Group support"], documents: ["DAP session notes", "Support plans", "Service log entries"] },
    { name: "Other", summary: "Any other profession or role on the team. The profile records the person's own credential or role as they provide it.", worksOn: ["The work described in the person's own profile and program assignment"], services: ["As assigned by program"], documents: ["Session notes and records for their assigned work"] }
  ],

  claimStatuses: ["Not Submitted", "Submitted", "Paid", "Denied"]
};

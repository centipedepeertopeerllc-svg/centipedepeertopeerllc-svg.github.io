// Centipede Peer to Peer, LLC — Centipede EHR configuration.
// Built November 24, 2026 at the direction of the Chief Executive
// Officer: Centipede's own internal peer-support record system,
// modeled on the feature set of a full practice-management system
// (clients, calendar, session notes, support plans, documents,
// billing & insurance, reminders) and reshaped for a NON-CLINICAL
// peer-support company.
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

  // Profession / specialty options for staff profiles — the
  // "Specialty" list used at profile setup in standard practice
  // systems (Levi's direction, Nov 24, 2026). A data field only —
  // each person selects the specialty that matches their own
  // credential or role.
  professions: [
    "Other",
    "Acupuncture",
    "Lactation consulting",
    "Massage therapy",
    "Counseling",
    "Marriage and family therapy",
    "Psychology",
    "Social work",
    "Psychiatry",
    "Psychiatric-Mental Health Nursing",
    "Behavioral health therapy",
    "Dietetics or nutrition counseling",
    "Chiropractic",
    "Applied behavior analysis",
    "Occupational therapy",
    "Physical therapy",
    "Speech-language pathology",
    "Substance use counseling"
  ],

  // Team role patterns for staff profiles and Admin, mirroring the
  // three standard practice roles — full access, biller, scheduler —
  // restated in Centipede's non-clinical terms. The permission list
  // under each role is shown on the Staff Profiles tab so the whole
  // team can see who can do what.
  teamRoles: [
    { name: "Full Access", summary: "Entire practice access — client care, billing, and templates.", permissions: ["Schedule appointments", "Edit appointments", "Create client profiles", "Delete client profiles", "Search for clients", "View files uploaded by clients", "Create session notes", "View documents completed by clients", "Share documents with clients", "Manage appointment requests", "Edit clients' billing info", "Edit service fees", "Create billing documents", "Add client payments", "Add insurance payments", "Track claim status", "View payment reports", "Refund payments", "Edit notes and forms templates"] },
    { name: "Billing", summary: "Billing-focused — billing records and payments, limited client care.", permissions: ["Edit appointments", "Search for clients", "Edit clients' billing info", "Edit service fees", "Create billing documents", "Add client payments", "Add insurance payments", "Track claim status", "View payment reports", "Refund payments", "View financial summaries and reports"] },
    { name: "Scheduling", summary: "Scheduling-focused — calendar, client profiles, and appointment requests, limited billing.", permissions: ["Schedule appointments", "Edit appointments", "Create client profiles", "Search for clients", "Manage appointment requests", "Share documents with clients", "Edit clients' billing info", "Edit service fees", "Create billing documents", "Add client payments"] }
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
    "Consent for Telehealth Consultation",
    "Credit Card Authorization",
    "Consent to Record Audio",
    "Notice of Privacy Practices",
    "Practice Policies",
    "Standard Intake Questionnaire",
    "Third Party Financial Responsibility Form",
    "Good Faith Estimate",
    "Signed Form — Other"
  ],

  // Standard consent / shareable documents checklist — the set of
  // standard forms a complete client file carries. The Documents
  // tab checks a client's records against this list.
  consentChecklist: [
    "Consent for Telehealth Consultation",
    "Credit Card Authorization",
    "Consent to Record Audio",
    "Notice of Privacy Practices",
    "Practice Policies",
    "Release of Information (ROI)",
    "Standard Intake Questionnaire",
    "Third Party Financial Responsibility Form",
    "Good Faith Estimate"
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

  // Services catalog, structured the way standard practice systems
  // structure theirs: code, description, rate, default duration
  // (minutes), active flag, and whether the service can be picked
  // when scheduling. Centipede's peer-support codes are the
  // defaults. The standard CPT entries are carried as additional
  // selectable entries for TRACKING ONLY — this system does not
  // submit claims, and no entry here changes that.
  serviceCatalog: [
    { code: "H0038", description: "Peer Support Services (per 15 min)", rate: "", duration: 15, active: true, schedulable: true, peer: true },
    { code: "T1016", description: "Care Coordination (per 15 min)", rate: "", duration: 15, active: true, schedulable: true, peer: true },
    { code: "T1017", description: "Support Navigation (per 15 min)", rate: "", duration: 15, active: true, schedulable: true, peer: true },
    { code: "90834", description: "Psychotherapy, 45 min", rate: "", duration: 50, active: true, schedulable: true },
    { code: "90791", description: "Psychiatric Diagnostic Evaluation", rate: "", duration: 50, active: true, schedulable: true },
    { code: "90792", description: "Psychiatric Diagnostic Evaluation with Medical", rate: "", duration: 50, active: true, schedulable: true },
    { code: "90837", description: "Psychotherapy, 60 min", rate: "", duration: 60, active: true, schedulable: true },
    { code: "90847", description: "Family psychotherapy, conjoint psychotherapy with the patient present", rate: "", duration: 50, active: true, schedulable: true },
    { code: "90853", description: "Group Therapy", rate: "", duration: 50, active: true, schedulable: true },
    { code: "90887", description: "Collateral Visit", rate: "", duration: 50, active: true, schedulable: true },
    { code: "97110", description: "Therapeutic exercises", rate: "", duration: 50, active: true, schedulable: true },
    { code: "97124", description: "Therapeutic procedure; massage", rate: "", duration: 50, active: true, schedulable: true },
    { code: "97530", description: "Therapeutic activities, direct (one-on-one) patient contact", rate: "", duration: 50, active: true, schedulable: true },
    { code: "99204", description: "Level 4 new patient office visit", rate: "", duration: 50, active: true, schedulable: true },
    { code: "99205", description: "Level 5 new patient office visit", rate: "", duration: 50, active: true, schedulable: true },
    { code: "99213", description: "Level 3 office visit", rate: "", duration: 50, active: true, schedulable: true },
    { code: "99214", description: "Level 4 office visit", rate: "", duration: 50, active: true, schedulable: true },
    { code: "99344", description: "New Patient E/M Home Visit — 60 minutes face-to-face", rate: "", duration: 50, active: true, schedulable: true },
    { code: "+90833", description: "Psychotherapy Add-on, 30 min", rate: "", duration: 50, active: true, schedulable: false },
    { code: "+90836", description: "Psychotherapy Add-on, 45 min", rate: "", duration: 50, active: true, schedulable: false },
    { code: "+90838", description: "Psychotherapy Add-on, 60 min", rate: "", duration: 50, active: true, schedulable: false }
  ],

  billDocKinds: ["Invoice", "Statement", "Superbill"],
  billDocStatuses: ["Draft", "Sent", "Unpaid", "Partially Paid", "Paid", "Void"],

  // Calendar locations, following the standard pattern: the video
  // office and physical places, plus Unassigned.
  locations: ["Video Office", "Office", "Client Home", "Community Site", "Unassigned"],

  cancellationPolicies: [
    "Require a phone call to cancel",
    "At least 24 hours before the appointment",
    "At least 48 hours before the appointment",
    "At least 72 hours before the appointment"
  ],

  // Appointment reminder rules, modeled on the standard pattern:
  // an email reminder 48 hours before, a text reminder 24 hours
  // before, a voice reminder 24 hours before, and an extra reminder
  // 10 minutes before video appointments. In Local Mode these rules
  // are recorded and displayed for the team's reference — this
  // browser-based system does not send reminders by itself.
  reminderRuleDefaults: { emailHours: 48, textHours: 24, voiceHours: 24, videoMinutes: 10, emailOn: true, textOn: true, voiceOn: true, videoOn: true },
  reminderHourOptions: [24, 36, 48, 72],

  languages: [
    "No answer", "English", "Spanish", "Arabic", "Armenian", "Bengali", "Cambodian (Khmer)", "Chinese (Cantonese)", "Chinese (Mandarin)", "Farsi (Persian)", "French", "German", "Greek", "Haitian Creole", "Hebrew", "Hindi", "Hmong", "Italian", "Japanese", "Korean", "Laotian", "Polish", "Portuguese", "Punjabi", "Russian", "Samoan", "Tagalog", "Thai", "Ukrainian", "Urdu", "Vietnamese", "American Sign Language (ASL)", "Other"
  ],

  planReviewOptions: [7, 30, 60, 90, 120, 180, 365],


  // Work-area outlines (Levi's direction, Nov 24, 2026): clicking a
  // profession / behavioral-health area opens its outline — what
  // that role works on, the kinds of services or support in that
  // area, and what gets documented in the EHR. Written factually,
  // the way practice systems present their areas. Centipede's own
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

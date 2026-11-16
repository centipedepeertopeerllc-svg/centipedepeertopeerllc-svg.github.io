"use strict";
/* Centipede Peer to Peer, LLC — Client Dashboard paperwork definitions.
   BLANK TEMPLATES ONLY. This file contains no client data. It is loaded
   by app.js only AFTER a successful sign-in, so nothing here renders
   before login.

   ROUTE (stated plainly): every source PDF in the Library was checked
   for AcroForm fields on Nov 16, 2026 — all have ZERO form fields, so
   no form could take the "true AcroForm filled in-page" route. Every
   fillable form below therefore uses the in-dashboard route: the
   dashboard form mirrors the paper original's fields exactly, and on
   completion the dashboard generates a filled PDF in the official form
   layout (assets/pdfgen.js) for the record, viewing, and download.

   Rules honored here:
   - Fields mirror the paper originals. No field was added that is not
     on the paper form, and no clinical field exists on any of these
     forms (all are non-clinical peer-support paperwork).
   - NO field collects a Social Security number or a full ID number.
     Where a paper form asks whether a Social Security number is on
     file, the dashboard mirrors it as a Yes/No choice ONLY — the
     number itself is never typed into this dashboard.
   - Signature fields are typed-name signature fields: the signer types
     their full name, and the completion record + generated PDF carry
     the author, the client, and the date/time the form was completed
     in the dashboard (the source trace). A wet-ink signature can still
     be taken on the printed PDF whenever a paper signature is needed.
*/
window.CLIENT_FORMS = [
  {
    id: "authorization-services",
    title: "Authorization to Receive Services",
    source: "Library: Forms/centipede-authorization-services/centipede-authorization-services.pdf (2 pages, blank original)",
    status: "Active",
    intro: "Voluntary consent for outreach, peer support, stabilization assistance, navigation, and referrals. Checking a service authorizes Centipede to provide or coordinate that service. Availability, eligibility, placement, and acceptance by outside providers are not guaranteed. This form does not authorize Centipede to release confidential information to outside organizations — a separate written Release of Information is required unless disclosure is required or permitted by law.",
    sections: [
      { heading: "1. Client information", fields: [
        { key: "client_full_name", label: "Client full name", type: "text", required: true },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "preferred_name", label: "Preferred name", type: "text" },
        { key: "pronouns", label: "Pronouns (optional)", type: "text" },
        { key: "phone", label: "Phone", type: "tel" },
        { key: "email", label: "Email", type: "email" },
        { key: "current_location", label: "Current location / mailing address (optional)", type: "textarea", rows: 2 },
        { key: "emergency_contact", label: "Emergency contact (optional) — name / relationship / phone", type: "textarea", rows: 2 }
      ]},
      { heading: "2. Services I authorize", fields: [
        { key: "services_authorized", label: "Services authorized (check each one)", type: "checkboxes", options: [
          "Peer support and recovery guidance",
          "Nonclinical mental-health outreach",
          "Substance-use stabilization support",
          "Treatment and recovery referrals",
          "Shelter and housing referrals",
          "Benefits and community-resource navigation",
          "Follow-up contact and wellness check-ins"
        ]},
        { key: "services_other", label: "Other", type: "text" }
      ]},
      { heading: "3. Signatures", note: "The client confirms: I voluntarily authorize Centipede Peer to Peer, LLC to provide the services selected above. I understand Centipede provides peer-based, nonclinical support, outreach, navigation, and referrals; it does not diagnose medical or mental-health conditions, prescribe medication, provide psychotherapy, perform medical detoxification, or act as law enforcement. I may decline any service and may withdraw this authorization at any time, verbally or in writing.", fields: [
        { key: "client_signature", label: "Client signature (type full name)", type: "signature", required: true },
        { key: "client_signature_datetime", label: "Date / time", type: "datetime" },
        { key: "rep_signature", label: "Parent, guardian, or authorized representative signature (if applicable) — type full name", type: "signature" },
        { key: "rep_datetime", label: "Representative date / time", type: "datetime" },
        { key: "rep_printed_name_relationship", label: "Printed name and relationship of representative", type: "text" },
        { key: "declined_to_sign", label: "Client declined to sign — staff initials / date", type: "text" },
        { key: "staff_name_signature", label: "Centipede staff name and signature (type full name)", type: "signature" },
        { key: "staff_datetime", label: "Staff date / time", type: "datetime" }
      ]}
    ]
  },
  {
    id: "release-of-information",
    title: "Authorization for Release of Information",
    source: "Library: Forms/centipede-release-information/centipede-release-information.pdf (3 pages, blank original)",
    status: "Active",
    intro: "The client authorizes the person or organization named below to disclose information to, receive information from, and/or exchange information with Centipede Peer to Peer, LLC, only as selected in this form. Complete all applicable sections. A copy of the signed authorization is valid as the original. Company practice: client information is shared only with a signed release of information or a judge-signed court order.",
    sections: [
      { heading: "1. Client information", fields: [
        { key: "client_full_legal_name", label: "Client full legal name", type: "text", required: true },
        { key: "preferred_name_pronouns", label: "Preferred name / pronouns (optional)", type: "text" },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "phone", label: "Phone", type: "tel" },
        { key: "client_id_record_no", label: "Client ID / record no. (if any)", type: "text" },
        { key: "mailing_address", label: "Current mailing address or location where client may be contacted", type: "textarea", rows: 2 }
      ]},
      { heading: "2. Person or organization authorized to share information", fields: [
        { key: "org_name", label: "Name of provider, agency, program, facility, court, school, or other person/organization", type: "text" },
        { key: "org_contact_person", label: "Contact person / department", type: "text" },
        { key: "org_phone", label: "Phone", type: "tel" },
        { key: "org_address_email_fax", label: "Address, secure email, or fax", type: "textarea", rows: 2 }
      ]},
      { heading: "3. Direction of disclosure", fields: [
        { key: "direction", label: "Direction", type: "radio", options: [
          "Send information to Centipede",
          "Receive information from Centipede",
          "Two-way exchange with Centipede",
          "Verbal coordination only"
        ]}
      ]},
      { heading: "4. Purpose of disclosure", fields: [
        { key: "purposes", label: "Purpose (check each one)", type: "checkboxes", options: [
          "Care coordination / continuity of services",
          "Housing or shelter referral",
          "Peer support / outreach follow-up",
          "Benefits, eligibility, or case planning",
          "Legal, probation, or court coordination",
          "At my request"
        ]},
        { key: "purpose_other", label: "Other specific purpose", type: "text" }
      ]},
      { heading: "5. Information authorized for release", note: "Check each category authorized. Leave unchecked anything the client does not want released. Limit dates whenever possible.", fields: [
        { key: "information_categories", label: "Information categories (check each one)", type: "checkboxes", options: [
          "Contact and demographic information",
          "Referral, intake, and eligibility information",
          "Service plan, goals, and progress updates",
          "Housing, shelter, and placement information",
          "Medication list / medical information",
          "Mental health information (see section 6)",
          "Substance use disorder information (see section 6)",
          "Justice-system / probation coordination records"
        ]},
        { key: "records_from", label: "Records from (date)", type: "date" },
        { key: "records_through", label: "Records through (date)", type: "date" },
        { key: "other_information_limits", label: "Other information or specific limits", type: "textarea", rows: 2 }
      ]},
      { heading: "6. Specially protected information", note: "Initial only the categories the client specifically authorizes. A selection applies only if the named person or organization is legally permitted to disclose the information. Psychotherapy notes are not included unless authorized on a separate form when required by law.", fields: [
        { key: "initials_mental_health", label: "Mental health information — client initials", type: "initials" },
        { key: "initials_substance_use", label: "Substance use disorder information — client initials", type: "initials" },
        { key: "initials_hiv_aids", label: "HIV/AIDS test results or related information — client initials", type: "initials" },
        { key: "initials_genetic", label: "Genetic test information — client initials", type: "initials" },
        { key: "other_protected", label: "Other specially protected information", type: "text" },
        { key: "initials_other_protected", label: "Other specially protected information — client initials", type: "initials" }
      ]},
      { heading: "7. Method and limits", fields: [
        { key: "methods", label: "Method (check each one)", type: "checkboxes", options: [
          "Secure email or secure electronic exchange",
          "Mail",
          "Fax",
          "Telephone / verbal exchange",
          "In person / client pickup",
          "Minimum necessary summary only"
        ]},
        { key: "additional_instructions", label: "Additional communication instructions or limits", type: "textarea", rows: 2 }
      ]},
      { heading: "8. Expiration", note: "If no date or event is entered, this authorization expires one year after the date signed, unless a shorter period is required by law.", fields: [
        { key: "expiration_date", label: "Expiration date", type: "date" },
        { key: "expiration_event", label: "Expiration event", type: "text" }
      ]},
      { heading: "9. Signature", note: "By signing, the client confirms they have read or had this form explained to them, had an opportunity to ask questions, and authorize the disclosure described above. The client may revoke this authorization at any time with a written revocation; revocation does not affect information already disclosed in reliance on it.", fields: [
        { key: "client_or_rep_signature", label: "Client or personal representative signature (type full name)", type: "signature", required: true },
        { key: "signature_date", label: "Date", type: "date" },
        { key: "rep_printed_name", label: "Representative printed name (if applicable)", type: "text" },
        { key: "rep_relationship_authority", label: "Relationship / legal authority (if applicable)", type: "text" },
        { key: "witness_signature", label: "Witness / interpreter signature (if used) — type full name", type: "signature" },
        { key: "witness_date", label: "Witness date", type: "date" }
      ]},
      { heading: "For Centipede use only", fields: [
        { key: "office_checks", label: "Office checks (check each one done)", type: "checkboxes", options: [
          "Copy given to client",
          "Identity / authority verified",
          "Revocation received",
          "Disclosure logged"
        ]},
        { key: "received_by", label: "Received by", type: "text" },
        { key: "date_received", label: "Date received", type: "date" },
        { key: "date_processed", label: "Date processed", type: "date" }
      ]},
      { heading: "Optional written revocation of this authorization", note: "Use this section only if the client later decides to revoke this authorization. Revocation applies going forward and does not affect information already disclosed in reliance on the authorization.", fields: [
        { key: "revocation_of_auth_signed_on", label: "I revoke the authorization signed on (date)", type: "date" },
        { key: "revocation_client_signature", label: "Client signature (type full name)", type: "signature" },
        { key: "revocation_date", label: "Revocation date", type: "date" },
        { key: "revocation_received_by", label: "Received by", type: "text" },
        { key: "revocation_date_received", label: "Date received", type: "date" }
      ]}
    ]
  },
  {
    id: "hipaa-acknowledgment",
    title: "HIPAA Privacy Understanding & Confidentiality Acknowledgment",
    source: "Library: Forms/centipede-hipaa-authorization/centipede-hipaa-authorization.pdf (3 pages, blank original; revision date September 25, 2026)",
    status: "Active",
    intro: "This form explains privacy practices and records the client's understanding. It is NOT a Release of Information: signing acknowledges privacy information only and does not authorize Centipede to disclose client information to a third party. Centipede will not routinely share the client's personal or service information unless the client signs a separate written Release of Information. Limited disclosures may occur without a written release only when required or permitted by law (for example a serious and imminent safety threat, a mandated report of suspected abuse or neglect, or a court order or valid legal process).",
    sections: [
      { heading: "Client information", fields: [
        { key: "client_full_name", label: "Client full name", type: "text", required: true },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "preferred_name", label: "Preferred name", type: "text" },
        { key: "client_id", label: "Client ID (optional)", type: "text" }
      ]},
      { heading: "Client understanding — please initial each statement", fields: [
        { key: "initials_explanation", label: "I received an explanation of HIPAA and Centipede's confidentiality practices in language I understand. — Initials", type: "initials" },
        { key: "initials_no_routine_sharing", label: "I understand that Centipede will not routinely share my information unless I sign a separate Release of Information and provide it to Centipede. — Initials", type: "initials" },
        { key: "initials_not_a_release", label: "I understand that this acknowledgment is not itself permission to release my information. — Initials", type: "initials" },
        { key: "initials_legal_exceptions", label: "I understand that limited disclosures may occur without my written release when required or permitted by law, including certain emergencies, mandated reports, or valid legal process. — Initials", type: "initials" },
        { key: "initials_questions", label: "I had the opportunity to ask questions and received answers I understand. — Initials", type: "initials" }
      ]},
      { heading: "Acknowledgment and signatures", note: "The signature documents acknowledgment of privacy practices; it does not authorize disclosure to a third party.", fields: [
        { key: "client_signature", label: "Client signature (type full name)", type: "signature", required: true },
        { key: "client_signature_date", label: "Date", type: "date" },
        { key: "rep_signature", label: "Parent / guardian / authorized representative signature (if applicable) — type full name", type: "signature" },
        { key: "rep_date", label: "Representative date", type: "date" },
        { key: "rep_printed_name_relationship", label: "Printed name of representative and relationship to client", type: "text" },
        { key: "authority_verified_by", label: "Authority verified by", type: "text" },
        { key: "staff_witness_signature", label: "Centipede staff / witness signature (type full name)", type: "signature" },
        { key: "staff_witness_date", label: "Staff / witness date", type: "date" }
      ]},
      { heading: "Communication assistance", fields: [
        { key: "communication_assistance", label: "Assistance used (check each one)", type: "checkboxes", options: [
          "Form read aloud to client",
          "Interpreter or communication assistance used"
        ]},
        { key: "interpreter_name_service", label: "Interpreter / assistance — name / service", type: "text" },
        { key: "declined_staff_note", label: "Client declined to sign — staff note", type: "textarea", rows: 2 }
      ]}
    ]
  },
  {
    id: "photo-authorization",
    title: "Photograph Authorization Form",
    source: "Library: Forms/centipede-photo-authorization/centipede-photo-authorization.pdf (2 pages, blank original)",
    status: "Active",
    intro: "For outreach activities in encampments and other community settings. The choice is voluntary: saying no, changing one's mind, or asking the photographer to stop will not affect the ability to receive outreach, referrals, peer support, or other available services. Unchecked options are not authorized. Staff safeguard: do not photograph anyone who declines, withdraws permission, is sleeping, is in crisis, appears unable to provide informed consent, or is pressured.",
    sections: [
      { heading: "Person being photographed", fields: [
        { key: "full_legal_name", label: "Full legal name", type: "text", required: true },
        { key: "preferred_name", label: "Preferred name", type: "text" },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "contact_optional", label: "Telephone or other contact (optional)", type: "text" },
        { key: "general_location", label: "General outreach location (do not list exact camp coordinates)", type: "text" },
        { key: "photo_date", label: "Date photograph(s) may be taken", type: "date" }
      ]},
      { heading: "Authorization choice", fields: [
        { key: "do_not_authorize", label: "Choice", type: "radio", options: [
          "I authorize photographs under only the choices I mark below",
          "I do not authorize photographs (stop here and sign to record my choice)"
        ]}
      ]},
      { heading: "How I may be photographed", fields: [
        { key: "how_photographed", label: "Check every option approved", type: "checkboxes", options: [
          "My face or other identifying features may be visible",
          "Only non-identifying images may be taken (for example, from behind, face obscured, or hands/activity only)",
          "Group photographs may include me, provided everyone shown has separately consented",
          "My general story or quotation may accompany an approved photograph, after I approve the wording"
        ]}
      ]},
      { heading: "How my name may appear", fields: [
        { key: "name_use", label: "Name use", type: "radio", options: [
          "Use my full name",
          "Use my first name only",
          "Use a chosen name or pseudonym (enter below)",
          "Do not use my name"
        ]},
        { key: "pseudonym", label: "Chosen name or pseudonym", type: "text" }
      ]},
      { heading: "Authorized uses", fields: [
        { key: "authorized_uses", label: "Check every use approved. Centipede may not use the photographs for an unchecked purpose.", type: "checkboxes", options: [
          "Internal program records and service documentation",
          "Grant applications, reports, and funder updates",
          "Printed education, outreach, or fundraising materials",
          "Centipede website and social media",
          "News media or public presentations approved by Centipede"
        ]},
        { key: "uses_other", label: "Other", type: "text" }
      ]},
      { heading: "Duration of authorization", fields: [
        { key: "duration_choice", label: "Choose one", type: "radio", options: [
          "This authorization expires on the date entered below",
          "This authorization expires one year after I sign it",
          "This authorization does not expire unless I revoke it in writing"
        ]},
        { key: "expires_on", label: "Expiration date (if the first choice is selected)", type: "date" }
      ]},
      { heading: "Acknowledgment and signature", note: "The person confirms: I have read this form, or it was read and explained to me in a way I understand. I had the opportunity to ask questions. I understand my choices and sign voluntarily. I may ask the photographer to stop at any time. I may revoke this authorization at any time by contacting Centipede in writing; revocation applies to future use after it is received.", fields: [
        { key: "signature", label: "Signature of person being photographed (type full name)", type: "signature", required: true },
        { key: "signature_date", label: "Date", type: "date" },
        { key: "printed_name", label: "Printed name", type: "text" },
        { key: "time", label: "Time", type: "time" }
      ]},
      { heading: "If the person is under 18 or cannot legally provide authorization", fields: [
        { key: "rep_signature", label: "Parent/legal guardian/authorized representative signature (type full name)", type: "signature" },
        { key: "rep_date", label: "Date", type: "date" },
        { key: "rep_printed_name_relationship", label: "Printed name and relationship/authority", type: "text" },
        { key: "rep_contact", label: "Telephone or email", type: "text" }
      ]},
      { heading: "Staff verification", note: "Staff confirms: I explained the form, confirmed the selected choices, and offered a copy. To the best of my observation, the person appeared able to understand and make this decision voluntarily.", fields: [
        { key: "staff_signature_name", label: "Centipede staff/volunteer signature and printed name (type full name)", type: "signature" },
        { key: "staff_date", label: "Date", type: "date" },
        { key: "photographer_name", label: "Photographer name", type: "text" },
        { key: "file_reference_number", label: "File/reference number (do not use Social Security number)", type: "text" }
      ]}
    ]
  },
  {
    id: "referral-form-services",
    title: "Referral Form for Services",
    source: "Library: Forms/centipede-referral-form/centipede-referral-form.pdf (3 pages, blank original; September 2026)",
    status: "Active",
    intro: "Use this form to request voluntary, nonclinical outreach and service coordination. A referral does not guarantee acceptance, shelter, housing, treatment placement, or benefits. The participant may decline any service. This form is not an emergency response request: call 911 for immediate danger or a medical emergency; call or text 988 for suicide or mental health crisis support. Confidential — share only for authorized service coordination.",
    sections: [
      { heading: "1. Referral identification", fields: [
        { key: "referral_date", label: "Referral date", type: "date" },
        { key: "referral_time", label: "Referral time", type: "time" },
        { key: "referral_id", label: "Referral ID / case no.", type: "text" },
        { key: "requested_response", label: "Requested response", type: "text" },
        { key: "priority", label: "Priority", type: "radio", options: ["Routine", "Time-sensitive", "Same-day if available"] }
      ]},
      { heading: "2. Referral source", fields: [
        { key: "source", label: "Source (check each one)", type: "checkboxes", options: [
          "Self-referral",
          "Family / community member",
          "Stockton Police Department",
          "San Joaquin County Probation",
          "Healthcare / behavioral health",
          "Shelter / housing provider",
          "Other agency",
          "Outreach team"
        ]},
        { key: "source_other", label: "Other source", type: "text" },
        { key: "referrer_name_title", label: "Referrer name and title", type: "text" },
        { key: "referrer_agency", label: "Agency / unit", type: "text" },
        { key: "referrer_phone", label: "Phone", type: "tel" },
        { key: "referrer_email", label: "Email", type: "email" },
        { key: "may_contact_referrer", label: "May Centipede contact the referrer?", type: "radio", options: ["Yes", "No", "Participant consent pending"] }
      ]},
      { heading: "3. Participant information", fields: [
        { key: "preferred_name", label: "Preferred name", type: "text" },
        { key: "legal_name", label: "Legal name, if different / needed", type: "text" },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "approximate_age", label: "Approximate age", type: "text" },
        { key: "pronouns", label: "Pronouns (optional)", type: "text" },
        { key: "preferred_language", label: "Preferred language", type: "text" },
        { key: "phone_safe", label: "Phone / safe voicemail number", type: "tel" },
        { key: "email_safe", label: "Email or other safe contact method", type: "text" },
        { key: "current_location", label: "Current location / camp / cross streets", type: "textarea", rows: 2 },
        { key: "best_contact_times", label: "Best days, times, and conditions for contact", type: "textarea", rows: 2 },
        { key: "housing_status", label: "Housing status", type: "radio", options: [
          "Unsheltered", "Shelter", "Temporary / doubled up", "At risk of homelessness", "Unknown"
        ]}
      ]},
      { heading: "4. Services requested", fields: [
        { key: "services_requested", label: "Services requested (check each one)", type: "checkboxes", options: [
          "Peer support: engagement, encouragement, advocacy",
          "Mental health outreach: nonclinical support and referral",
          "Substance use / addiction stabilization: support and treatment referral",
          "Housing referral: shelter, coordinated entry, navigation",
          "Benefits / identification document support",
          "Transportation coordination",
          "Basic-needs connection"
        ]},
        { key: "services_other", label: "Other", type: "text" }
      ]},
      { heading: "5. Immediate priorities and referral summary", fields: [
        { key: "immediate_priorities", label: "Immediate priorities (check each one)", type: "checkboxes", options: [
          "Food / water", "Shelter tonight", "Medical attention",
          "Overdose prevention", "Safety concern", "Hygiene / clothing"
        ]},
        { key: "reason_summary", label: "Reason for referral, participant goals, strengths, and immediate barriers", type: "textarea", rows: 4 }
      ]},
      { heading: "6. Current supports and practical barriers", fields: [
        { key: "current_supports", label: "Current providers, programs, case managers, or supervision contacts", type: "textarea", rows: 3 },
        { key: "emergency_contact", label: "Emergency contact or trusted support person (only with permission)", type: "textarea", rows: 2 },
        { key: "barriers", label: "Practical barriers (check each one)", type: "checkboxes", options: [
          "Identification documents", "Transportation", "Phone / charging access",
          "Benefits / income", "Mobility / accessibility", "Pets / belongings",
          "Family reunification", "Legal / probation obligations"
        ]},
        { key: "barriers_other", label: "Other barrier", type: "text" }
      ]},
      { heading: "7. Service-specific information", note: "Non-clinical peer-support information only — no diagnosis.", fields: [
        { key: "peer_support_info", label: "Peer support: participant priorities, lived-experience match, preferred approach", type: "textarea", rows: 3 },
        { key: "mental_health_outreach_info", label: "Mental health outreach: observed concerns and participant-requested support (no diagnosis)", type: "textarea", rows: 3 },
        { key: "substance_use_info", label: "Substance use stabilization: immediate needs, overdose concerns, treatment interest", type: "textarea", rows: 3 },
        { key: "housing_info", label: "Housing: shelter interest, coordinated entry status, documents, accessibility needs", type: "textarea", rows: 3 }
      ]},
      { heading: "8. Safety and outreach planning", fields: [
        { key: "safety", label: "Safety (check each one)", type: "checkboxes", options: [
          "No known immediate concern", "Medical concern", "Behavioral health concern",
          "Overdose risk", "Environmental / camp hazard"
        ]},
        { key: "safety_other", label: "Other safety concern", type: "text" },
        { key: "safety_information", label: "Safety information needed for respectful outreach", type: "textarea", rows: 3 },
        { key: "preferences", label: "Participant preferences, accommodations, or people to include / avoid", type: "textarea", rows: 3 }
      ]},
      { heading: "9. Warm handoff and follow-up plan", fields: [
        { key: "handoff_rows", label: "Warm handoff rows", type: "rows", rows: 3, rowFields: [
          { key: "service_provider", label: "Service / provider" },
          { key: "contact_person", label: "Contact person" },
          { key: "date_time", label: "Date / time" },
          { key: "status_outcome", label: "Status / outcome" },
          { key: "followup_owner", label: "Follow-up / owner" }
        ]},
        { key: "referral_status", label: "Referral status", type: "select", options: [
          "Pending", "Contact attempted", "Participant engaged",
          "Warm handoff completed", "Declined", "Unable to locate"
        ]}
      ]},
      { heading: "10. Participant permission and acknowledgment", note: "The participant understands that Centipede Peer to Peer, LLC provides voluntary peer support, nonclinical mental health outreach, substance use stabilization support, and referrals, and gives permission for Centipede to contact them about this referral and, as selected, to coordinate with the named referral source or service providers. Permission may be withdrawn and services declined at any time.", fields: [
        { key: "permissions", label: "Permissions given (check each one)", type: "checkboxes", options: [
          "Permission to contact participant",
          "Permission to coordinate with referral source",
          "Permission to coordinate with named providers"
        ]},
        { key: "permission_documented_as", label: "Permission documented as", type: "radio", options: [
          "Written signature", "Verbal permission witnessed", "Not yet obtained"
        ]},
        { key: "participant_signature", label: "Participant signature / mark (type full name)", type: "signature" },
        { key: "participant_signature_date", label: "Date", type: "date" },
        { key: "witness_signature", label: "Witness / staff name and signature (type full name)", type: "signature" },
        { key: "witness_date", label: "Witness date", type: "date" }
      ]},
      { heading: "11. Centipede staff completion", fields: [
        { key: "assigned_staff", label: "Assigned staff / peer", type: "text" },
        { key: "first_contact_date", label: "First contact date", type: "date" },
        { key: "next_followup_date", label: "Next follow-up date", type: "date" },
        { key: "staff_notes", label: "Staff notes / disposition", type: "textarea", rows: 3 }
      ]}
    ]
  },
  {
    id: "id-assistance-request",
    title: "ID Assistance Request Form",
    source: "Library: Forms/centipede-id-assistance-program/centipede-member-id-assistance-request-form.pdf (2 pages, blank original) — Centipede ID Assistance Program; no fee, this service is always free",
    status: "Active",
    intro: "Member form — confidential peer support record. Centipede does not issue IDs — only the DMV does — and a qualified partner verifier (not Centipede) signs the no-fee verification form. Note: this form asks only whether a Social Security number is on file (Yes/No). The number itself is never entered into this dashboard.",
    sections: [
      { heading: "Member information", fields: [
        { key: "full_legal_name", label: "Full legal name (print)", type: "text", required: true },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "phone_contact", label: "Phone / contact info", type: "text" },
        { key: "where_to_reach", label: "Where can we reach you? (address, shelter, usual spot — whatever works)", type: "textarea", rows: 2 }
      ]},
      { heading: "What do you need help with? (check all that apply)", fields: [
        { key: "help_needed", label: "Help needed", type: "checkboxes", options: [
          "California ID card (no-fee, under AB 1733)",
          "Certified birth certificate (no-fee, under AB 1733)",
          "Both"
        ]}
      ]},
      { heading: "Your situation, in your own words", fields: [
        { key: "situation", label: "Briefly describe your current housing situation (a few lines is fine)", type: "textarea", rows: 3 }
      ]},
      { heading: "Documents you already have", note: "Yes/No only. Never type a Social Security number or ID number into this form.", fields: [
        { key: "ssn_on_file", label: "Social Security number on file?", type: "radio", options: ["Yes", "No"] },
        { key: "birth_certificate_on_file", label: "Certified birth certificate?", type: "radio", options: ["Yes", "No"] },
        { key: "passport_or_photo_id", label: "Passport or other photo ID?", type: "radio", options: ["Yes", "No"] },
        { key: "documents_describe", label: "If yes to any above, describe", type: "textarea", rows: 2 }
      ]},
      { heading: "Consent and signature", note: "The member asks Centipede Peer to Peer, LLC for help getting a California ID and/or birth certificate at no cost, and gives permission for Centipede staff to help gather documents, coordinate with the verifier, and accompany them to the DMV. Records are kept confidential as described in the program policy.", fields: [
        { key: "member_signature", label: "Member signature (type full name)", type: "signature", required: true },
        { key: "member_signature_date", label: "Date", type: "date" },
        { key: "member_name_print", label: "Member name (print)", type: "text" }
      ]},
      { heading: "Staff use only", fields: [
        { key: "mckinney_vento_confirmation", label: "McKinney-Vento homeless-status confirmation (basis, factual)", type: "textarea", rows: 2 },
        { key: "verifier_name", label: "Qualified verifier name", type: "text" },
        { key: "verifier_organization", label: "Verifier organization", type: "text" },
        { key: "dl933_signed_date", label: "DL 933 signed date", type: "date" },
        { key: "birth_cert_requested_date", label: "Birth certificate requested date", type: "date" },
        { key: "dmv_appointment_date", label: "DMV appointment date", type: "date" },
        { key: "dmv_office_location", label: "DMV office location", type: "text" },
        { key: "outcome_id_received_date", label: "Outcome / ID received date", type: "date" },
        { key: "staff_signature", label: "Staff signature (type full name)", type: "signature" },
        { key: "staff_signature_date", label: "Staff date", type: "date" },
        { key: "staff_name_print", label: "Staff name (print)", type: "text" }
      ]}
    ]
  },
  {
    id: "member-id-referral",
    title: "Centipede Member ID Referral Form",
    source: "Library: Forms/centipede-id-assistance-program/centipede-member-id-referral-form-2026-10-25.pdf (5 pages, blank original) — Form CENTIPEDE-ID-REF-2026-001, approved by the CEO October 25, 2026",
    status: "Active",
    intro: "Referral to another agency or organization for ID help. This form is a referral, not a DMV verification: it is NOT a DL 933 or DL 937, it does not verify homeless status for DMV purposes, and it does not waive any fee. Only the California DMV issues ID cards and driver's licenses, and only a qualified verifier signs DL 933/DL 937 forms — Centipede never holds, pre-fills, or signs those forms. Confidential — share only with the member's signed consent on this form. Fees are set by the California DMV and must be verified on dmv.ca.gov at each application.",
    sections: [
      { heading: "1. Member information", fields: [
        { key: "full_legal_name", label: "Full legal name (print)", type: "text", required: true },
        { key: "date_of_birth", label: "Date of birth", type: "date" },
        { key: "phone", label: "Phone", type: "tel" },
        { key: "email_or_contact", label: "Email or other contact", type: "text" },
        { key: "centipede_client_id", label: "Centipede client ID", type: "text" },
        { key: "date_of_referral", label: "Date of referral", type: "date" }
      ]},
      { heading: "2. Referral type (check all that apply)", fields: [
        { key: "referral_types", label: "Referral type", type: "checkboxes", options: [
          "No-fee ID card (DL 933 track — verifier partner signs)",
          "Reduced-fee ID card (DL 937 track)",
          "Standard ID card",
          "Senior ID card (age 62+)",
          "Class C driver's license",
          "Certified birth certificate (fee-exempt affidavit track)",
          "DMV2GO / outreach event"
        ]},
        { key: "referral_type_other", label: "Other (describe)", type: "text" }
      ]},
      { heading: "3. Receiving agency / organization", fields: [
        { key: "agency_name", label: "Agency / organization name", type: "text" },
        { key: "agency_contact_person", label: "Contact person", type: "text" },
        { key: "agency_phone", label: "Phone", type: "tel" },
        { key: "agency_email", label: "Email", type: "email" },
        { key: "agency_address", label: "Address", type: "textarea", rows: 2 },
        { key: "service_requested", label: "Service requested from this agency", type: "textarea", rows: 2 }
      ]},
      { heading: "4. Track choice — one track only", note: "A member generally cannot hold both a California driver's license and a California ID card (Vehicle Code §13000(a)(2)). Choose ONE track. Never start both tracks at once.", fields: [
        { key: "track", label: "Track", type: "radio", options: [
          "Track A — California ID card",
          "Track B — Class C driver's license"
        ]},
        { key: "card_kind", label: "Card kind", type: "radio", options: [
          "Real ID (gold bear and star)",
          "Standard (Federal Limits Apply)"
        ]}
      ]},
      { heading: "5. Documents — what the member has / still needs", note: "Copies only in the file; originals stay with the member. These are Have/Need checks only — no document numbers are entered.", fields: [
        { key: "doc_identity", label: "Identity document (birth certificate / passport / other DMV-accepted document)", type: "radio", options: ["Have", "Need"] },
        { key: "doc_ssn_proof", label: "Social Security number proof", type: "radio", options: ["Have", "Need"] },
        { key: "doc_residency_1", label: "California residency proof 1", type: "radio", options: ["Have", "Need"] },
        { key: "doc_residency_2", label: "California residency proof 2 (Real ID only)", type: "radio", options: ["Have", "Need"] },
        { key: "doc_name_change", label: "Name-change proof (if applicable)", type: "radio", options: ["Have", "Need"] },
        { key: "doc_dl933_937", label: "DL 933 / DL 937 from verifier partner (partner signs — never Centipede)", type: "radio", options: ["Have", "Need"] },
        { key: "doc_other", label: "Other document (describe)", type: "text" }
      ]},
      { heading: "6. 90-day verification clock", note: "If this referral involves a signed DL 933 or DL 937 from a qualified verifier partner, that form must reach the DMV not more than 90 days after it is issued.", fields: [
        { key: "verifier_partner_name", label: "Verifier partner name", type: "text" },
        { key: "verifier_form_kind", label: "Verifier form", type: "radio", options: ["DL 933 (no-fee)", "DL 937 (reduced-fee)"] },
        { key: "date_issued", label: "Date issued", type: "date" },
        { key: "dmv_deadline", label: "DMV submission deadline (issue date + 90 days)", type: "date" },
        { key: "date_submitted_dmv", label: "Date submitted to DMV", type: "date" }
      ]},
      { heading: "7. Follow-up tracking", fields: [
        { key: "followup_rows", label: "Follow-up rows", type: "rows", rows: 3, rowFields: [
          { key: "date", label: "Date" },
          { key: "action_taken", label: "Action taken" },
          { key: "outcome", label: "Outcome" }
        ]}
      ]},
      { heading: "8. Member consent to share information", note: "The member consents to Centipede Peer to Peer, LLC sharing the information on this form with the receiving agency named above, for the purpose of this ID referral only. The member understands Centipede does not issue ID cards or driver's licenses, does not sign DMV verification forms, and cannot guarantee any DMV outcome.", fields: [
        { key: "member_signature", label: "Member signature (type full name)", type: "signature", required: true },
        { key: "member_signature_date", label: "Date", type: "date" },
        { key: "member_name_print", label: "Member name (print)", type: "text" }
      ]},
      { heading: "9. Staff use only", fields: [
        { key: "referred_by", label: "Referred by (peer supporter, print)", type: "text" },
        { key: "referred_by_date", label: "Date", type: "date" },
        { key: "contact_method", label: "Contact method", type: "radio", options: ["In person", "Phone", "Email"] },
        { key: "referral_outcome", label: "Referral outcome", type: "textarea", rows: 2 },
        { key: "staff_signature", label: "Staff signature — sign only when this form is actually used (type full name)", type: "signature" },
        { key: "staff_signature_date", label: "Staff date", type: "date" }
      ]},
      { heading: "11. Who pays", note: "Mark the payer before this referral is sent. Do not send this form with the payer blank. If Centipede is marked as payer, CEO approval for that case must be recorded before the referral is sent.", fields: [
        { key: "payer", label: "Payer", type: "radio", options: [
          "Member pays",
          "Centipede Peer to Peer, LLC pays (separate CEO approval required per case)",
          "Receiving agency or partner program pays",
          "Other (specify below)"
        ]},
        { key: "payer_amount", label: "Amount", type: "text" },
        { key: "payer_agency_name", label: "Receiving agency / program name (if agency pays)", type: "text" },
        { key: "payer_other", label: "Other payer (specify)", type: "text" },
        { key: "ceo_approval_record", label: "CEO approval for Centipede payment (record approval here if Centipede is the payer; leave blank otherwise)", type: "textarea", rows: 2 }
      ]}
    ]
  }
];

/* Paperwork that exists in the Library but is NOT fillable in the
   dashboard in this build — listed so the catalog is complete and the
   reason is on the record. These entries render as information only. */
window.CLIENT_FORM_CATALOG = [
  {
    id: "shelter-checkin-stay-agreement",
    title: "Shelter Check-In Form & Stay Agreement (CSP-CI-001)",
    source: "Library: Forms/centipede-shelter-checkin-form/centipede-shelter-checkin-stay-agreement.pdf (8 pages)",
    status: "Draft — not in effect",
    reason: "The form itself states: DRAFT — subject to Board adoption; it takes effect when the shelter opens, and no opening date has been set (Shelter program: In Development). Most of its 8 pages are the daily schedule and stay rules, not fields. It becomes a fillable dashboard form when the shelter program opens."
  },
  {
    id: "job-search-verification",
    title: "Job Search Verification Form (CSP-JS-001)",
    source: "Library: Forms/centipede-search-verification-forms/centipede-job-housing-search-verification-forms.pdf",
    status: "Draft — not in effect",
    reason: "DRAFT — subject to Board adoption; takes effect on the opening of the shelter and rehabilitation program. It is a weekly paper log signed by each employer visited, so its signatures are gathered on paper in the field; it is not completed inside the dashboard."
  },
  {
    id: "housing-search-verification",
    title: "Housing Search Verification Form (CSP-HS-001)",
    source: "Library: Forms/centipede-search-verification-forms/centipede-job-housing-search-verification-forms.pdf",
    status: "Draft — not in effect",
    reason: "DRAFT — subject to Board adoption; takes effect on the opening of the shelter and rehabilitation program. It is a weekly paper log signed by each landlord or manager visited, so its signatures are gathered on paper in the field; it is not completed inside the dashboard."
  }
];

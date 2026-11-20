// Centipede Peer to Peer, LLC — Insurance Dashboard configuration.
// Built November 18, 2026 at the direction of the Chief Executive Officer.
// Holds the company's insurance register: policies, certificates issued,
// claims, and renewals. The CEO holds an internal reference for the
// company's policy with NEXT, policy number 081457547410 (provided by the
// CEO November 18, 2026). That reference is NOT a certificate of insurance
// and is NOT proof of coverage, and it is not verified with the carrier;
// the official Certificate of Insurance is held by the CEO and is not
// posted here. Coverage details, effective/renewal dates, and claims
// contact are on file with the CEO and are not recorded here — nothing is
// entered from memory or invented. Sign-in is the same as every dashboard.
window.INSURANCE_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer — Administrator", admin: true, tempPasswordSha256: "f608b5d4344089b5b13ae31476d1e9aaa981f6074280ac2bf88dae0f68a9df69" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer — Record Keeper", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],
  openItems: [
    { name: "Company insurance — NEXT Insurance, Policy 081457547410 (internal reference on file)", note: "Internal reference only — this is NOT a certificate of insurance and is NOT proof of coverage. The official Certificate of Insurance is held by the CEO and is not posted here. Verify coverage directly with the carrier. Coverage details, effective/renewal dates, and claims contact: on file with the CEO — not shown on this reference." },
    { name: "Centipede Day of Hope — event insurance", note: "An open gate on the Day of Hope: event coverage must be in place before the event is set. Tracked here when bound." },
    { name: "Homeless shelter — property & liability", note: "The shelter is in development; its insurance is arranged with the site, and entered here when bound." },
    { name: "Financial Officer & Chief Compliance Officer access", note: "Michael Thompson (Financial Officer) and Tammy Lopazzo (Chief Compliance Officer) receive their dashboard sign-ins with the December 1 credential letter and are added to this roster then." }
  ]
};

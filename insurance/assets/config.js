// Centipede Peer to Peer, LLC — Insurance Dashboard configuration.
// Built November 18, 2026 at the direction of the Chief Executive Officer.
// Holds the company's insurance register: policies, certificates issued,
// claims, and renewals. No policy is entered here until it is real and on
// paper — the register starts from the record, and the record today holds
// no bound policy. Sign-in is the same as every dashboard.
window.INSURANCE_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer — Administrator", admin: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer — Record Keeper", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" }
  ],
  openItems: [
    { name: "No insurance policy is on record yet", note: "When the first policy is bound, it is entered here in full — carrier, policy number, coverage, dates, premium, and agent — from the policy paper itself, never from memory." },
    { name: "Centipede Day of Hope — event insurance", note: "An open gate on the Day of Hope: event coverage must be in place before the event is set. Tracked here when bound." },
    { name: "Homeless shelter — property & liability", note: "The shelter is in development; its insurance is arranged with the site, and entered here when bound." },
    { name: "Financial Officer & Chief Compliance Officer access", note: "Michael Thompson (Financial Officer) and Tammy Lopazzo (Chief Compliance Officer) receive their dashboard sign-ins with the December 1 credential letter and are added to this roster then." }
  ]
};

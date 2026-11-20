// Centipede Peer to Peer, LLC — Program Activity configuration.
// Program Activity is the Company Portal's program-by-program activity
// log (CPP-POL-2026-058, DRAFT): for every program, what we have done,
// what has been updated, and what is coming up — one place, kept current
// the same day the work happens, so any team member can open it and see
// where a program stands. Built November 19, 2026 at the direction of
// the Chief Executive Officer.
// Sign-in is the same as every dashboard: username + password +
// authenticator 2FA (assets/auth.js). Only SHA-256 hashes of the
// one-time temporary passwords are stored here — the SAME seed hashes
// the Company Portal carries for each person. Program-level information
// only: no client names, no client records, no case detail ever goes in
// this app (CPP-POL-2026-058).
window.PROGACT_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "f608b5d4344089b5b13ae31476d1e9aaa981f6074280ac2bf88dae0f68a9df69" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, tempPasswordSha256: "47400cc485f18196b6345108f222f3a733c01bed320524bcf7e82fdc98b1de4c" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" },
    { username: "eric.jacobson", name: "Eric Jacobson", role: "Human Resources", admin: false, tempPasswordSha256: "7589ffac8ada0beb0999a6905cf098c22aa3637c6297ea5dee0c4c92cb28e669" },
    { username: "junior.spears", name: "Levi Spears (Junior)", role: "Field Team Member", admin: false, tempPasswordSha256: "db94131d335cbd5ee3d4672306b22fed0e887ba5295c245184fec25f2328a618" },
    { username: "monica.frishkorn", name: "Monica Frishkorn-Wellner", role: "Board Director", admin: false, tempPasswordSha256: "f549de3b90666c5a6aa7dbf95b2cbbf988649920333f9d9e52fc86af324be6c2" },
    { username: "jeremy.hughes", name: "Jeremy Hughes", role: "Board Member", admin: false, tempPasswordSha256: "ff1e49ffde7e23625b84276021eeba74fe42e5b35fc649bb290ca347d7b1e783" },
    { username: "amanda.spears", name: "Amanda Spears", role: "Women Helping Women — Program Lead", admin: false, tempPasswordSha256: "75fe803604c231d9ae625fc491fe25c20f99c5f4c942f26d62b9c086ce5b067b" }
  ],
  // The company's twelve programs — names, statuses, and dashboard
  // addresses exactly as the Company Portal carries them (portal
  // config, November 19, 2026). Seals are the Portal's program seals.
  programs: [
    { slug: "homeless-outreach", name: "Homeless Outreach", status: "Active", seal: "../assets/program-seals/homeless-outreach.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/homeless-outreach/" },
    { slug: "peer-support", name: "1-on-1 Peer Support", status: "Active", seal: "../assets/program-seals/peer-support.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/peer-support/" },
    { slug: "referrals-id", name: "Referrals & ID Assistance", status: "Active", seal: "../assets/program-seals/referrals-id-assistance.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/referrals-id/" },
    { slug: "resource-navigation", name: "Community Resource Navigation", status: "Active", seal: "../assets/program-seals/community-resource-navigation.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/resource-navigation/" },
    { slug: "justice-support", name: "Justice Support Program", status: "Approved — approved by counsel, November 18, 2026", seal: "../assets/program-seals/justice-support.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/justice-support/" },
    { slug: "recovery-support", name: "Substance Abuse Recovery Support", status: "Adopted — not yet enrolling", seal: "../assets/program-seals/substance-abuse-recovery.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/recovery-support/" },
    { slug: "women-helping-women", name: "Women Helping Women", status: "In Development", seal: "../assets/program-seals/women-helping-women.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/women-helping-women/" },
    { slug: "super-hero", name: "Super Hero Program", status: "In Development", seal: "../assets/program-seals/super-hero-program.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/super-hero/" },
    { slug: "day-of-hope", name: "Centipede Day of Hope", status: "In Development", seal: "../assets/program-seals/centipede-day-of-hope.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/day-of-hope/" },
    { slug: "hygiene-outreach", name: "Hygiene", status: "In Development", seal: "../assets/program-seals/hygiene-outreach.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/hygiene-outreach/" },
    { slug: "homeless-shelter", name: "Shelter — Stockton", status: "In Development", seal: "../assets/program-seals/homeless-shelter.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/homeless-shelter/" },
    { slug: "veterans", name: "Veterans Program", status: "Pending Board Approval", seal: "../assets/program-seals/veterans-program.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/veterans/" }
  ],
  // Seed entries — the log's starting record, drawn from the Portal,
  // the program dashboards, and the program files as they stood on
  // November 19, 2026. Program-level facts only. New entries are added
  // in the app and stored in cpp.portal.progact.v1.
  seedEntries: [
    { program: "homeless-outreach", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "homeless-outreach", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-032 (Homeless Outreach Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "homeless-outreach", kind: "done", date: "2026-11-17", text: "Purchase order CPP-PO-2026-005 signed — 100 blanket and pillow sets ordered for the December blanket drive.", by: "Jarvis" },
    { program: "homeless-outreach", kind: "coming", date: "2026-12-10", text: "Outreach Day — December 10, 2026, 12:00 PM, with the December blanket drive.", by: "Jarvis" },
    { program: "peer-support", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "peer-support", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-033 (1-on-1 Peer Support Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "peer-support", kind: "done", date: "2026-11-19", text: "Peer Support Dashboard opened in the Portal — the staff workspace for the program's Certified Peer Support Specialist (CPP-POL-2026-056).", by: "Jarvis" },
    { program: "peer-support", kind: "coming", date: "2026-11-28", text: "Tom Clark, Certified Peer Support Specialist, starts November 28, 2026.", by: "Jarvis" },
    { program: "referrals-id", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "referrals-id", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-034 (Referrals and ID Assistance Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "resource-navigation", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "resource-navigation", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-035 (Community Resource Navigation Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "resource-navigation", kind: "done", date: "2026-11-18", text: "Shelter & Housing Directory opened in the Company Portal — shelters and housing resources for Stockton and San Joaquin County, kept current for navigation work.", by: "Jarvis" },
    { program: "justice-support", kind: "updated", date: "2026-11-18", text: "Program approved by counsel (Amber Bellante), November 18, 2026. Peer support only — Centipede prepares factual letters to defense counsel and helps with logistics and court navigation; it is not legal representation.", by: "Jarvis" },
    { program: "justice-support", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "recovery-support", kind: "updated", date: "2026-10-16", text: "Program adopted October 16, 2026 — adopted, not yet enrolling.", by: "Jarvis" },
    { program: "recovery-support", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "recovery-support", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-036 (Substance Abuse Recovery Support Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "women-helping-women", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "women-helping-women", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-037 (Women Helping Women Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "women-helping-women", kind: "updated", date: "2026-11-18", text: "Program lead: Amanda Spears invited to lead the program — pending her decision.", by: "Jarvis" },
    { program: "super-hero", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked. Program leads: Amanda Spears and Diane Spears Garcia.", by: "Jarvis" },
    { program: "super-hero", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-038 (Super Hero Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "super-hero", kind: "coming", date: "2026-11-27", text: "Board vote on the Super Hero Program — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "day-of-hope", kind: "done", date: "2026-11-14", text: "Program adopted by the Chief Executive Officer, November 14, 2026 — a free community service day for Stockton. Status: In Development.", by: "Jarvis" },
    { program: "day-of-hope", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "day-of-hope", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-039 (Centipede Day of Hope Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "day-of-hope", kind: "updated", date: "2026-11-19", text: "Target set: two days in March 2027 (the exact days are set when the venue confirms). No funding in 2026 — this year is planning and partner-building only; no money is spent on the program.", by: "Jarvis" },
    { program: "day-of-hope", kind: "done", date: "2026-11-19", text: "Venue research completed — Stockton venues ranked against the size bar (half a football field or more of open ground). Weber Point Events Center and the San Joaquin County Fairgrounds lead the rentable list; donated-space prospects identified.", by: "Jarvis" },
    { program: "day-of-hope", kind: "done", date: "2026-11-19", text: "Partner organizing opened — the partner register is built (49 organizations, tracked by status: invited, replied, confirmed, and what each is providing) and the general partner invitation packet is drafted. The Gospel Center Rescue Mission invitation letter is drafted and awaits the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "day-of-hope", kind: "coming", date: "2026-11-27", text: "Board notification — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "day-of-hope", kind: "coming", date: "2027-01-16", text: "Partner planning reply date — partners are asked to reply by January 16, 2027 so the day can be planned around who is coming and what they are bringing.", by: "Jarvis" },
    { program: "hygiene-outreach", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "hygiene-outreach", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-040 (Hygiene Outreach Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "homeless-shelter", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "homeless-shelter", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-041 (Homeless Shelter Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "veterans", kind: "done", date: "2026-11-18", text: "Program dashboard opened in the Company Portal, with the program's Google Drive folder linked.", by: "Jarvis" },
    { program: "veterans", kind: "done", date: "2026-11-18", text: "Program policy drafted — CPP-POL-2026-042 (Veterans Program Policy), for the Chief Executive Officer's approval.", by: "Jarvis" },
    { program: "veterans", kind: "coming", date: "2026-11-27", text: "Board approval decision — the Veterans Program is pending board approval; the Board of Directors meets November 27, 2026.", by: "Jarvis" },
    { program: "homeless-outreach", kind: "done", date: "2026-11-18", text: "Outreach Worker Skills, Training, and Field Gear policy issued — CPP-POL-2026-045, the standing standard for outreach field work.", by: "Jarvis" },
    { program: "homeless-outreach", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-032) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "peer-support", kind: "done", date: "2026-11-18", text: "Peer Support Manual issued — CPP-MAN-2026-001, live in the Company Portal for the whole team.", by: "Jarvis" },
    { program: "peer-support", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-033) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "referrals-id", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-034) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "resource-navigation", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-035) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "recovery-support", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-036) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "women-helping-women", kind: "updated", date: "2026-11-18", text: "Program policy updated at the CEO's direction (November 18, 2026): a Domestic Violence section was added to CPP-POL-2026-037 — peer scope, danger-first (call 911), the strictest confidentiality in the program, and professional referral routes. The working detail lives in the policy and the program dashboard, never in this log.", by: "Jarvis" },
    { program: "women-helping-women", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-037) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "super-hero", kind: "coming", date: "2026-12-12", text: "Family sign-up deadline for the program's seasonal giving — December 12, 2026 (per the CEO's plan). Donations to Centipede are not tax-deductible, and all donor-facing material says so.", by: "Jarvis" },
    { program: "day-of-hope", kind: "updated", date: "2026-11-19", text: "Counsel question drafted for interim counsel: how a California for-profit LLC may lawfully take charitable donations and sponsorships for the day. No donation or sponsorship asks go out until counsel answers and the board takes the program up.", by: "Jarvis" },
    { program: "hygiene-outreach", kind: "coming", date: "2026-11-27", text: "Board notification of the program's draft policy (CPP-POL-2026-040) — Board of Directors meeting, November 27, 2026.", by: "Jarvis" },
    { program: "homeless-shelter", kind: "coming", date: "2026-11-27", text: "Board decision on the shelter project's funding entity path — Board of Directors meeting, November 27, 2026. Nothing about the shelter is represented as operating until it is.", by: "Jarvis" },
  ]
};

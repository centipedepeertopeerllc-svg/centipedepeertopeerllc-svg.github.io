// Centipede Peer to Peer, LLC — Company Portal configuration.
// Built November 18, 2026 at the direction of the Chief Executive Officer:
// one company-wide portal, with its own web link, giving app-style access
// to every dashboard, for every program. Sign-in is the same as every
// dashboard — the same username, the same password, and two-factor
// authentication (CEO rule, Nov 18, 2026). The seed hashes below are the
// SAME hashes the dashboards already carry for each person (verified
// identical across the Client, Banking, and HR dashboards on Nov 18, 2026).
// Only SHA-256 hashes of the one-time temporary passwords are stored here.
window.PORTAL_CONFIG = {
  users: [
    { username: "levi.spears", name: "Levi Allen Spears", role: "Chief Executive Officer", admin: true, tempPasswordSha256: "5891421a4bea9d36fd0ae3034376fee9ebecf3cb3baf73de3324c884ea4c1ed4" },
    { username: "tom.clark", name: "Thomas Leo Clark III", role: "Certified Peer Support Specialist", admin: false, tempPasswordSha256: "f742fc459b375e7d15a85aed9f6d30568241b458f1f580aad97844790247dc02" },
    { username: "jarvis", name: "Jarvis", role: "Board Officer", admin: false, tempPasswordSha256: "be7797464911240005bd88a9eca851f383a73980c333b50ac5ead87f7dbbb1d5" },
    { username: "eric.jacobson", name: "Eric Jacobson", role: "Human Resources", admin: false, tempPasswordSha256: "7589ffac8ada0beb0999a6905cf098c22aa3637c6297ea5dee0c4c92cb28e669" },
    { username: "junior.spears", name: "Levi Spears (Junior)", role: "Field Team Member", admin: false, tempPasswordSha256: "db94131d335cbd5ee3d4672306b22fed0e887ba5295c245184fec25f2328a618" },
    { username: "monica.frishkorn", name: "Monica Frishkorn-Wellner", role: "Board Director", admin: false, tempPasswordSha256: "f549de3b90666c5a6aa7dbf95b2cbbf988649920333f9d9e52fc86af324be6c2" },
    { username: "jeremy.hughes", name: "Jeremy Hughes", role: "Board Member", admin: false, tempPasswordSha256: "ff1e49ffde7e23625b84276021eeba74fe42e5b35fc649bb290ca347d7b1e783" },
    { username: "amanda.spears", name: "Amanda Spears", role: "Women Helping Women — Program Lead", admin: false, tempPasswordSha256: "75fe803604c231d9ae625fc491fe25c20f99c5f4c942f26d62b9c086ce5b067b" }
  ],
  tiles: [
    { name: "Company Website", url: "https://centipedepeertopeerllc-svg.github.io/", note: "Our public website — the only website address we use." },
    { name: "DAP Notes Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/dap/", note: "Session notes in DAP format and encounter documentation." },
    { name: "Client Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/clients/", note: "Client records, paperwork, and purchase orders." },
    { name: "HR Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/hr/", note: "Employee records and human-resources work." },
    { name: "Clients Without Insurance", url: "https://centipedepeertopeerllc-svg.github.io/uninsured/", note: "Clients with no coverage — the coverage work list, kept separate from insurance." },
    { name: "Banking Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/banking/", note: "The company banking program and program cards." },
    { name: "Legal Department Portal", url: "https://centipedepeertopeerllc-svg.github.io/legal/", note: "Restricted — the Chief Executive Officer and counsel only." },
    { name: "Board Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/board/", note: "Board of Directors only — shown to you as administrator.", adminOnly: true },
    { name: "IT Department Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/it/", note: "IT Department only — shown to you as administrator.", adminOnly: true },
    { name: "Insurance Dashboard", url: "https://centipedepeertopeerllc-svg.github.io/insurance/", note: "Company insurance register — shown to you as administrator.", adminOnly: true }
  ],
  programs: [
    { name: "Homeless Outreach", status: "Active", seal: "assets/program-seals/homeless-outreach.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/homeless-outreach/" , drive: "https://drive.google.com/drive/folders/16QRxzdxYAe-FTYNcZ0gexvfxjsKhnhHS" },
    { name: "1-on-1 Peer Support", status: "Active", seal: "assets/program-seals/peer-support.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/peer-support/" , drive: "https://drive.google.com/drive/folders/1XyoD7VW4N-bj2-Uqct_1MU7nC9kpIaMZ" },
    { name: "Referrals & ID Assistance", status: "Active", seal: "assets/program-seals/referrals-id-assistance.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/referrals-id/" , drive: "https://drive.google.com/drive/folders/1Q3QHi6gm0ndjp3jCddRjRokKc_GsgYIP" },
    { name: "Community Resource Navigation", status: "Active", seal: "assets/program-seals/community-resource-navigation.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/resource-navigation/" , drive: "https://drive.google.com/drive/folders/1C86sz4q5Ea3Q7W43NYTcvtfr2VpiJFaQ" },
    { name: "Justice Support Program", status: "Approved — approved by counsel, November 18, 2026", seal: "assets/program-seals/justice-support.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/justice-support/" , drive: "https://drive.google.com/drive/folders/1zfy4y7aTFPNM3Yr09RlfLzzipcFow7p1" },
    { name: "Substance Abuse Recovery Support", status: "Adopted — not yet enrolling", seal: "assets/program-seals/substance-abuse-recovery.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/recovery-support/" , drive: "https://drive.google.com/drive/folders/1NkrciZ9PG_7mEmVxbbs4VN42U3rOL4TU" },
    { name: "Women Helping Women", status: "In Development", seal: "assets/program-seals/women-helping-women.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/women-helping-women/" , drive: "https://drive.google.com/drive/folders/14rc4_JKVfaCNeceR8d02rkW9FqB6s_hF" },
    { name: "Super Hero Program", status: "In Development", seal: "assets/program-seals/super-hero-program.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/super-hero/" , drive: "https://drive.google.com/drive/folders/1bQ6YrJvvAoJrVn4t7uvmh7GhpTTC2uuQ" },
    { name: "Centipede Day of Hope", status: "In Development", seal: "assets/program-seals/centipede-day-of-hope.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/day-of-hope/" , drive: "https://drive.google.com/drive/folders/12QLWeB-FCNH_MfDOPSMfl7bBYiy2M5HL" },
    { name: "Hygiene", status: "In Development", seal: "assets/program-seals/hygiene-outreach.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/hygiene-outreach/" , drive: "https://drive.google.com/drive/folders/1VF3jT1WmMJQQYuy2wz6LHDBBLIBPDU5R" },
    { name: "Shelter — Stockton", status: "In Development", seal: "assets/program-seals/homeless-shelter.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/homeless-shelter/" , drive: "https://drive.google.com/drive/folders/1NBHTJf_MvFGONbWoy4hWOpYBCkt1uFEw" },
    { name: "Veterans Program", status: "Pending Board Approval", seal: "assets/program-seals/veterans-program.png", url: "https://centipedepeertopeerllc-svg.github.io/programs/veterans/" , drive: "https://drive.google.com/drive/folders/1dGwJlfnPrntiS9aVyR5qC6WATpRK33lj" }
  ]
};

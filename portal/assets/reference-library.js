/* Centipede Peer to Peer, LLC — Reference Library (Portal, signed-in view).
   Added November 18, 2026 at the CEO's direction: mental-health reference
   material for employees, for DOCUMENTATION LITERACY ONLY.
   Centipede is a NON-CLINICAL peer support company. These references help
   staff understand terms that appear in client paperwork. Staff do not
   diagnose, assess clinically, or counsel — diagnosis belongs to licensed
   clinicians.
   The DSM-5-TR is a copyrighted publication of the American Psychiatric
   Association. There is NO legal free full copy online, so this library
   LINKS to official sources only — the book itself is never hosted here.
   There is no DSM-6: the DSM-5-TR (APA, March 2022) is the current edition
   and supersedes the DSM-5 (2013).
   SAMHSA is Centipede's standing reference (CEO direction, Nov 18, 2026):
   the SAMHSA Library below links official samhsa.gov / SAMHSA Library
   pages only — no publication text is copied here. */
(function () {
  function mount() {
    var el = document.getElementById("reference-library");
    if (!el) return;
    el.innerHTML =
      '<div style="border:1px solid #b8933a;background:#fdf6dd;border-radius:10px;padding:12px;">' +
      '<h3 style="margin-top:0;">Mental Health Reference — Documentation Literacy Only</h3>' +
      '<p><strong>Centipede provides non-clinical peer support. These references help staff understand terms used in client paperwork. Staff do not diagnose, assess clinically, or counsel. Diagnosis belongs to licensed clinicians.</strong></p>' +

      '<p><strong>DSM-5-TR</strong> <span class="hint">(current edition, American Psychiatric Association, 2022)</span></p>' +
      '<ul>' +
      '<li><a href="https://www.psychiatry.org/psychiatrists/practice/dsm/about-dsm" target="_blank" rel="noopener">About DSM-5-TR</a> — the APA\'s official page on the current edition.</li>' +
      '<li><a href="https://www.psychiatry.org/psychiatrists/practice/dsm/history-of-the-dsm" target="_blank" rel="noopener">History of the DSM</a> — how the manual has developed over the years.</li>' +
      '</ul>' +
      '<p class="hint">The DSM-5-TR is a copyrighted APA publication. The company copy is purchased through the PO process; there is no free legal copy online. DSM-6 has not been published — DSM-5-TR is the current edition.</p>' +

      '<p><strong>ICD-11</strong> <span class="hint">(World Health Organization) — free to read online</span></p>' +
      '<ul>' +
      '<li><a href="https://icd.who.int/" target="_blank" rel="noopener">ICD-11</a> — the WHO\'s free classification reference.</li>' +
      '</ul>' +

      '<h3>SAMHSA Library — our standing reference</h3>' +
      '<p class="hint">SAMHSA (Substance Abuse and Mental Health Services Administration) is Centipede\'s standing reference for peer support and recovery. Links below go to official SAMHSA pages. The same non-clinical scope applies: these are references for our peer work — staff do not diagnose, assess clinically, or counsel.</p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/" target="_blank" rel="noopener">SAMHSA — main site</a> — free federal peer-support and recovery resources.</li>' +
      '</ul>' +

      '<p><strong>Peer Support</strong></p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/substance-use/recovery/peer-support-workers/core-competencies" target="_blank" rel="noopener">Core Competencies for Peer Workers in Behavioral Health Services</a> — SAMHSA\'s core competencies for the peer workforce: what good peer work is.</li>' +
      '<li><a href="https://cafetacenter.net/new/wp-content/uploads/2025/11/nationalguidelines_updated.pdf" target="_blank" rel="noopener">National Practice Guidelines for Peer Supporters</a> — the national practice guidelines for peer supporters (National Association of Peer Supporters; reviewed by a peer leadership panel at SAMHSA), full text via a SAMHSA-funded technical assistance center.</li>' +
      '</ul>' +

      '<p><strong>Trauma</strong></p>' +
      '<ul>' +
      '<li><a href="https://library.samhsa.gov/product/tip-57-trauma-informed-care-behavioral-health-services/sma14-4816" target="_blank" rel="noopener">TIP 57: Trauma-Informed Care in Behavioral Health Services</a> — includes SAMHSA\'s Concept of Trauma and Guidance for a Trauma-Informed Approach (SAMHSA Library).</li>' +
      '</ul>' +
      '<p class="hint">For peer work: recognize trauma\'s effects, and respond without retraumatizing. Trauma <em>treatment</em> is clinical and outside Centipede\'s scope — our part is a trauma-informed way of working, and warm referrals.</p>' +

      '<p><strong>Recovery</strong></p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/substance-use/recovery" target="_blank" rel="noopener">SAMHSA Recovery</a> — SAMHSA\'s recovery resources and the recovery model: recovery is a process of change, person-driven, and supported by peers, family, and community.</li>' +
      '</ul>' +

      '<p><strong>Homelessness</strong></p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/communities/homelessness-programs-resources" target="_blank" rel="noopener">Homelessness Programs and Resources</a> — SAMHSA\'s homelessness programs and resources (PATH, GBHI, housing supports).</li>' +
      '</ul>' +

      '<p><strong>Substance Use</strong></p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/substance-use" target="_blank" rel="noopener">SAMHSA Substance Use</a> — SAMHSA\'s substance use resources.</li>' +
      '<li><a href="https://www.samhsa.gov/find-help/helplines/national-helpline" target="_blank" rel="noopener">SAMHSA National Helpline — 1-800-662-4357</a> — the free, confidential treatment-referral line, 24/7, in English and Spanish.</li>' +
      '</ul>' +

      '<p><strong>Mental Health</strong></p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/mental-health" target="_blank" rel="noopener">SAMHSA Mental Health</a> — SAMHSA\'s mental health resources.</li>' +
      '</ul>' +

      '<p><strong>Crisis</strong></p>' +
      '<ul>' +
      '<li><a href="https://988lifeline.org/" target="_blank" rel="noopener">988 Suicide &amp; Crisis Lifeline</a> — call or text 988, for crisis situations — and <strong>911 for emergencies</strong>.</li>' +
      '</ul>' +

      '<p><strong>Privacy &amp; Confidentiality — HIPAA and California Law</strong></p>' +
      '<ul>' +
      '<li><a href="hipaa/index.html">HIPAA &amp; California Confidentiality — What Every Centipede Staff Member Must Know</a> — the HIPAA Privacy Rule, PHI, minimum necessary, safeguards, and breach duties; 42 CFR Part 2 for substance use records (stricter than HIPAA); and California\'s CMIA and LPS Act — California law can be stricter than HIPAA, and the stricter rule governs. Official sources only (HHS, SAMHSA, California Attorney General, official California law text). The standing rule: client information is disclosed only on a signed client Release of Information or a judge-signed court order — a subpoena alone is not a court order.</li>' +
      '</ul>' +

      '<p><strong>Company Manuals</strong></p>' +
      '<ul>' +
      '<li><a href="manual/index.html">Centipede Peer Support Manual (CPP-MAN-2026-001)</a> — how peer support is done at Centipede: the SAMHSA core competencies as company practice, the peer relationship, trauma-informed peer support, intake, DAP documentation, confidentiality, field work, crisis response, ethics, supervision and certification, and the programs overview. <span class="hint">Issued November 18, 2026, by direction of the Chief Executive Officer.</span></li>' +
      '</ul>' +

      '<p><strong>Company Policies</strong></p>' +
      '<ul>' +
      '<li><a href="policy-045/index.html">CPP-POL-2026-045 — Outreach Worker Skills, Training, and Field Gear Policy</a> — the standard for every outreach and field worker: the four skill standards (trauma-informed communication and empathy; crisis de-escalation and conflict resolution; resource navigation and same-day DAP documentation; adaptability, resilience, and self-care), the training and certification targets (First Aid/CPR, Mental Health First Aid, trauma-informed care, crisis prevention/de-escalation — the company does not itself certify; CalMHSA is the state peer certification route), and the standard field gear kit. <span class="hint">Issued November 18, 2026, by direction of the Chief Executive Officer. Section 9 (personal pepper spray) is marked in the policy for counsel review.</span></li>' +
      '</ul>' +
      '</div>';
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

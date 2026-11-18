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
   and supersedes the DSM-5 (2013). */
(function () {
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
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

      '<p><strong>SAMHSA resources</strong></p>' +
      '<ul>' +
      '<li><a href="https://www.samhsa.gov/" target="_blank" rel="noopener">SAMHSA</a> — free federal peer-support and recovery resources.</li>' +
      '</ul>' +
      '</div>';
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

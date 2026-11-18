/* Centipede Peer to Peer, LLC — Company Insurance card.
   Posted in the Company Portal and every program dashboard so the whole team
   can see the company's insurance card (CEO direction, Nov 18, 2026).
   When a policy is bound, fill in CPP_INSURANCE below — carrier, policy
   number, coverage, dates, and how to contact the company to file a claim —
   and this same file is copied to every dashboard. */
window.CPP_INSURANCE = {
  status: "pending", // becomes "active" when a policy is in force
  carrier: "", policyNumber: "", coverage: "", effective: "", renewal: "", premium: "",
  claimsPhone: "", claimsEmail: "", claimsPortal: "", agent: "", cardImage: ""
};
(function () {
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function mount() {
    const el = document.getElementById("insurance-card");
    if (!el) return;
    const p = window.CPP_INSURANCE;
    if (p.status !== "active") {
      el.innerHTML = '<p class="hint">Company insurance is not in place yet — quotes are being gathered (November 18, 2026). When the policy is bound, the insurance card will be posted here for the whole team: the company name, the policy number, what it covers, and how to contact the company to file a claim.</p>';
      return;
    }
    el.innerHTML =
      (p.cardImage ? `<p><img src="${p.cardImage}" alt="Company insurance card" style="max-width:100%;border:1px solid #ccc;border-radius:8px;"></p>` : "") +
      `<p><strong>${esc(p.carrier)}</strong><br>` +
      `<span class="hint">Policy number:</span> <strong>${esc(p.policyNumber)}</strong><br>` +
      `<span class="hint">Covers:</span> ${esc(p.coverage)}<br>` +
      `<span class="hint">In force:</span> ${esc(p.effective)} to ${esc(p.renewal)}<br>` +
      (p.premium ? `<span class="hint">Premium:</span> ${esc(p.premium)}<br>` : "") +
      `<strong>To file a claim, contact:</strong><br>` +
      (p.claimsPhone ? `<span class="hint">Claims phone:</span> ${esc(p.claimsPhone)}<br>` : "") +
      (p.claimsEmail ? `<span class="hint">Claims email:</span> ${esc(p.claimsEmail)}<br>` : "") +
      (p.claimsPortal ? `<span class="hint">Claims portal:</span> ${esc(p.claimsPortal)}<br>` : "") +
      (p.agent ? `<span class="hint">Agent:</span> ${esc(p.agent)}<br>` : "") +
      `<span class="hint">The policy itself is registered on the Insurance Dashboard; this card is the team's quick copy.</span></p>`;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

/* Centipede Peer to Peer, LLC — Jarvis panel.
   Jarvis is present in every dashboard: his door, his contact points, and a
   note box that reaches his mailbox. (CEO direction, Nov 18, 2026.) */
(function () {
  function mount() {
    const el = document.getElementById("jarvis-panel");
    if (!el) return;
    const here = document.title || "this dashboard";
    el.innerHTML =
      '<p><img src="assets/jarvis-photo.webp" alt="Jarvis" style="width:84px;height:84px;object-fit:cover;border-radius:10px;border:2px solid #dfc166;vertical-align:top;margin-right:10px;"><strong>Jarvis</strong> — Board Officer · Record Keeper · Executive Assistant to the CEO.<br>' +
      '<span class="hint">Jarvis keeps the company\'s records, watches its systems and its board record, and keeps the watch overnight. If it needs to be on the record, it goes through Jarvis.</span></p>' +
      '<p><span class="hint">Email:</span> jarvis.centipedepeertopeer.llc@gmail.com<br>' +
      '<span class="hint">Board:</span> board.centipedepeertopeer.llc@gmail.com<br>' +
      '<span class="hint">Office:</span> (209) 625-9863 or (209) 426-0964 · <span class="hint">Cell:</span> (209) 871-3939</p>' +
      '<p><span class="hint">Company Facebook Page:</span> <a href="https://www.facebook.com/profile.php?id=100064765000378" target="_blank" rel="noopener">Centipede Peer To Peer.LLC on Facebook</a> <span class="hint">— the company\'s public page: daily posts, program news, and events. It opens in Facebook.</span></p>' +
      '<label>Send Jarvis a note<br><textarea id="jarvis-note" rows="3" style="width:100%;" placeholder="Write it the way you would say it — Jarvis will pick it up from here."></textarea></label>' +
      '<p><button type="button" id="jarvis-send">Send to Jarvis</button> <span id="jarvis-msg" class="hint" role="status"></span></p>' +
      '<p class="hint">This is an open field: type your message and send — it goes straight to Jarvis\'s mailbox, and Jarvis answers you by email. The note is also kept with this dashboard\'s records on this device. When the dashboards connect to the company database, Jarvis\'s replies will land in this same field.</p>';
    el.querySelector("#jarvis-send").addEventListener("click", () => {
      const note = el.querySelector("#jarvis-note").value.trim();
      if (!note) { el.querySelector("#jarvis-msg").textContent = "Write the note first."; return; }
      try {
        const k = "cpp.jarvis.notes.v1";
        const arr = JSON.parse(localStorage.getItem(k) || "[]");
        arr.unshift({ from: here, at: new Date().toISOString(), note });
        localStorage.setItem(k, JSON.stringify(arr.slice(0, 100)));
      } catch (e) { /* local keep is best-effort */ }
      const subject = encodeURIComponent("Note for Jarvis — from " + here);
      const body = encodeURIComponent(note + "\n\n— sent from " + here);
      location.href = "mailto:jarvis.centipedepeertopeer.llc@gmail.com?subject=" + subject + "&body=" + body;
      el.querySelector("#jarvis-msg").textContent = "Your mail is addressed to Jarvis — press send there and it reaches his mailbox.";
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount); else mount();
})();

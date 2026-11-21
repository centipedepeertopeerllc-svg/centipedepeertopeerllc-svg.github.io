"use strict";
/* Centipede Peer to Peer, LLC — Emergency Billboard (assets/emergency-board.js).
   A branded company billboard — the Centipede dark-green-and-gold frame —
   that appears ONLY while an emergency notice is live. Notices live in one
   shared JSON feed named by the data-feed attribute on the
   #emergency-billboard section, so the public homepage and the Portal home
   always show the same notice from the same file
   (assets/emergency-billboard.json).

   How it works:
   - The section starts hidden. This script fetches the feed, keeps the
     notices that are live (expires is null, or expires is today or later),
     and renders them as a slideshow in the Portal Message Board style:
     rotate every 8 seconds, pause on hover / focus / tap, previous/next
     arrows and slide dots, a tag pill, headline, body, and a meta line
     with the date and "Posted by".
   - When NO notice is live — or the feed cannot be read — the whole
     section stays hidden (display:none) and nothing is rendered. There is
     no empty billboard on the page.
   - All feed text is escaped before it reaches the page.
   - No external libraries, no CDN.
   Built Nov 21, 2026 at the CEO's direction. */
(function () {
  var ROTATE_MS = 8000;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }
  function fmtDay(d) {
    if (!d) return "";
    try {
      return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch (e) { return d; }
  }
  function isLive(s, today) { return !s.expires || String(s.expires) >= today; }
  function tagClass(tag) {
    return String(tag || "").toUpperCase() === "EMERGENCY" ? "tag-emergency" : "tag-notice";
  }

  function init() {
    var section = document.getElementById("emergency-billboard");
    if (!section) return;
    var feed = section.getAttribute("data-feed");
    if (!feed && document.currentScript) feed = document.currentScript.getAttribute("data-feed");
    if (!feed || typeof fetch !== "function") { section.style.display = "none"; return; }
    fetch(feed, { cache: "no-store" }).then(function (r) {
      return r && r.ok ? r.json() : null;
    }).then(function (data) {
      var today = todayISO();
      var all = data && Array.isArray(data.notices) ? data.notices : [];
      var notices = [];
      for (var i = 0; i < all.length; i++) {
        if (all[i] && isLive(all[i], today)) notices.push(all[i]);
      }
      if (!notices.length) { section.style.display = "none"; return; }
      render(section, notices);
    }).catch(function () {
      section.style.display = "none";
    });
  }

  function render(section, slides) {
    var stage = section.querySelector(".eb-stage");
    var dotsBox = section.querySelector(".eb-dots");
    var count = section.querySelector(".eb-count");
    var prev = section.querySelector(".eb-prev");
    var next = section.querySelector(".eb-next");
    if (!stage) { section.style.display = "none"; return; }

    var idx = 0, timer = null, paused = false;

    function draw() {
      if (idx >= slides.length) idx = 0;
      stage.innerHTML = slides.map(function (s, i) {
        return '<article class="eb-slide' + (i === idx ? " active" : "") + '" aria-hidden="' + (i === idx ? "false" : "true") + '">' +
          '<span class="eb-tag ' + tagClass(s.tag) + '">' + esc(s.tag || "NOTICE") + "</span>" +
          '<h3 class="eb-headline">' + esc(s.headline) + "</h3>" +
          '<p class="eb-body">' + esc(s.body) + "</p>" +
          '<p class="eb-meta">' + esc(fmtDay(s.date)) + " · Posted by " + esc(s.by || "Jarvis") + "</p>" +
          "</article>";
      }).join("");
      if (dotsBox) {
        dotsBox.innerHTML = slides.map(function (s, i) {
          return '<button type="button" class="eb-dot' + (i === idx ? " active" : "") + '" data-dot="' + i + '" aria-label="Notice ' + (i + 1) + ": " + esc(s.headline) + '"></button>';
        }).join("");
        var dots = dotsBox.querySelectorAll("[data-dot]");
        for (var k = 0; k < dots.length; k++) {
          dots[k].addEventListener("click", function () {
            goTo(Number(this.getAttribute("data-dot")));
            restart();
          });
        }
      }
      if (count) {
        count.textContent = slides.length > 1
          ? "Notice " + (idx + 1) + " of " + slides.length + (paused ? " · paused" : "")
          : "";
      }
    }
    function goTo(i) { idx = i; draw(); }
    function step(dir) {
      if (slides.length > 1) {
        idx = ((idx + dir) % slides.length + slides.length) % slides.length;
        draw();
      }
    }
    function stopTimer() { if (timer !== null) { clearInterval(timer); timer = null; } }
    function startTimer() {
      stopTimer();
      if (slides.length < 2) return;
      var reduced = false;
      try { reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { reduced = false; }
      if (reduced) return;
      timer = setInterval(function () { if (!paused) step(1); }, ROTATE_MS);
    }
    function restart() { startTimer(); }
    function setPaused(p) {
      paused = p;
      if (count && slides.length > 1) {
        count.textContent = "Notice " + (idx + 1) + " of " + slides.length + (paused ? " · paused" : "");
      }
    }

    if (prev) prev.addEventListener("click", function () { step(-1); restart(); });
    if (next) next.addEventListener("click", function () { step(1); restart(); });
    section.addEventListener("mouseenter", function () { setPaused(true); });
    section.addEventListener("mouseleave", function () { setPaused(false); });
    section.addEventListener("focusin", function () { setPaused(true); });
    section.addEventListener("focusout", function () { setPaused(false); });
    section.addEventListener("pointerdown", function () { setPaused(!paused); });

    draw();
    section.removeAttribute("hidden");
    section.style.display = "";
    startTimer();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

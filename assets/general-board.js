"use strict";
/* Centipede Peer to Peer, LLC — General Billboard / Company Board
   (assets/general-board.js).
   Controlled by the Chief Executive Officer. Nothing posts to this
   billboard except at the CEO's direction; Jarvis operates the feed on
   the CEO's word and keeps the posting record (Policy CPP-POL-2026-066,
   draft).

   A branded company billboard — the Centipede dark-green-and-gold
   frame — for GENERAL company items: announcements, study and
   compilation work, and program news. It is separate from the Emergency
   Billboard (assets/emergency-board.js), which carries emergencies only
   and takes visual precedence. Items live in one shared JSON feed named
   by the data-feed attribute on the #general-billboard section
   (assets/general-billboard.json), so the public homepage and the
   Portal home show the same items from the same file.

   How it works:
   - The section starts hidden. This script fetches the feed, keeps the
     items that are live (expires is null, or expires is today or
     later), and renders them as a rotating slideshow: advance every 8
     seconds, pause on hover / focus / tap, previous/next arrows and
     slide dots, a COMPANY BOARD tag pill, headline, body, an optional
     link, and a meta line with the date and "Posted by".
   - When NO item is live — or the feed cannot be read — the whole
     section stays hidden (display:none) and nothing is rendered. There
     is no empty billboard on the page.
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

  function init() {
    var section = document.getElementById("general-billboard");
    if (!section) return;
    var feed = section.getAttribute("data-feed");
    if (!feed && document.currentScript) feed = document.currentScript.getAttribute("data-feed");
    if (!feed || typeof fetch !== "function") { section.style.display = "none"; return; }
    fetch(feed, { cache: "no-store" }).then(function (r) {
      return r && r.ok ? r.json() : null;
    }).then(function (data) {
      var today = todayISO();
      var all = data && Array.isArray(data.notices) ? data.notices : [];
      var items = [];
      for (var i = 0; i < all.length; i++) {
        if (all[i] && isLive(all[i], today)) items.push(all[i]);
      }
      if (!items.length) { section.style.display = "none"; return; }
      render(section, items);
    }).catch(function () {
      section.style.display = "none";
    });
  }

  function render(section, slides) {
    var stage = section.querySelector(".gb-stage");
    var dotsBox = section.querySelector(".gb-dots");
    var count = section.querySelector(".gb-count");
    var prev = section.querySelector(".gb-prev");
    var next = section.querySelector(".gb-next");
    if (!stage) { section.style.display = "none"; return; }

    var idx = 0, timer = null, paused = false;

    function draw() {
      if (idx >= slides.length) idx = 0;
      stage.innerHTML = slides.map(function (s, i) {
        var link = "";
        if (s.link) {
          link = '<p class="gb-link"><a href="' + esc(s.link) + '">' + esc(s.linkText || "Learn more") + " &rarr;</a></p>";
        }
        return '<article class="gb-slide' + (i === idx ? " active" : "") + '" aria-hidden="' + (i === idx ? "false" : "true") + '">' +
          '<span class="gb-tag tag-board">' + esc(s.tag || "COMPANY BOARD") + "</span>" +
          '<h3 class="gb-headline">' + esc(s.headline) + "</h3>" +
          '<p class="gb-body">' + esc(s.body) + "</p>" +
          link +
          '<p class="gb-meta">' + esc(fmtDay(s.date)) + " · Posted by " + esc(s.by || "Jarvis") + "</p>" +
          "</article>";
      }).join("");
      if (dotsBox) {
        dotsBox.innerHTML = slides.map(function (s, i) {
          return '<button type="button" class="gb-dot' + (i === idx ? " active" : "") + '" data-dot="' + i + '" aria-label="Item ' + (i + 1) + ": " + esc(s.headline) + '"></button>';
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
          ? "Item " + (idx + 1) + " of " + slides.length + (paused ? " · paused" : "")
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
        count.textContent = "Item " + (idx + 1) + " of " + slides.length + (paused ? " · paused" : "");
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

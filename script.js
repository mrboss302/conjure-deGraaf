/* =================================================================
   deGraaf Conjure — interactions
   Vanilla JS. Everything degrades gracefully and respects
   prefers-reduced-motion.
   ================================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Nav scroll state ---------- */
  var nav = document.getElementById("nav");
  var onScroll = function () {
    if (window.scrollY > 16) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.getElementById("mobile-menu");
  if (toggle && mobileMenu) {
    var setMenu = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      if (open) {
        mobileMenu.hidden = false;
      } else {
        mobileMenu.hidden = true;
      }
    };
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ---------- Placeholder links (privacy/terms etc.) ---------- */
  document.querySelectorAll("[data-placeholder]").forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); });
  });

  /* ---------- Cursor glow + glow-card tracking ---------- */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var glow = document.querySelector(".cursor-glow");
    var rafId = null, mx = 0, my = 0;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (rafId) return;
      rafId = requestAnimationFrame(function () {
        rafId = null;
        if (glow) { glow.style.left = mx + "px"; glow.style.top = my + "px"; }
      });
    }, { passive: true });

    document.querySelectorAll(".glow-card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
          setTimeout(function () { el.classList.add("in"); }, delay);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* =================================================================
     Hero window: the workflow animation
     Steps light up; the draft crossfades into the designed preview;
     the assistant types a refinement line; then it loops.
     ================================================================= */
  var win = document.getElementById("conjure-window");
  var timeline = document.getElementById("hero-timeline");
  var assistMsg = document.getElementById("assist-msg");
  var typedEl = document.getElementById("typed-line");

  if (win && timeline) {
    var steps = Array.prototype.slice.call(timeline.querySelectorAll("li"));
    var refinementLine = "Make the hero feel warmer and more premium.";

    if (reduceMotion) {
      // Resolve to the finished state immediately.
      steps.forEach(function (s) { s.classList.add("done"); });
      win.classList.add("is-designed");
      if (assistMsg) {
        assistMsg.classList.add("show");
        assistMsg.setAttribute("aria-hidden", "false");
      }
      if (typedEl) typedEl.textContent = refinementLine;
      var caretEl = win.querySelector(".caret");
      if (caretEl) caretEl.style.display = "none";
    } else {
      var timers = [];
      var clearTimers = function () { timers.forEach(clearTimeout); timers = []; };
      var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

      var typeLine = function (text, done) {
        var i = 0;
        if (typedEl) typedEl.textContent = "";
        var tick = function () {
          if (!typedEl) return;
          typedEl.textContent = text.slice(0, i);
          i++;
          if (i <= text.length) { later(tick, 34); }
          else if (done) { later(done, 1600); }
        };
        tick();
      };

      var runCycle = function () {
        clearTimers();
        // reset
        steps.forEach(function (s) { s.classList.remove("active", "done"); });
        win.classList.remove("is-designed");
        if (assistMsg) { assistMsg.classList.remove("show"); assistMsg.setAttribute("aria-hidden", "true"); }
        if (typedEl) typedEl.textContent = "";

        var stepDelay = 760;
        steps.forEach(function (s, idx) {
          later(function () {
            steps.forEach(function (p, j) { if (j < idx) p.classList.add("done"); });
            s.classList.remove("done");
            s.classList.add("active");
          }, idx * stepDelay);
        });

        var afterSteps = steps.length * stepDelay;

        // Reveal the designed preview shortly after "Opening preview".
        later(function () {
          steps.forEach(function (s) { s.classList.remove("active"); s.classList.add("done"); });
          win.classList.add("is-designed");
        }, afterSteps + 200);

        // Show + type the assistant refinement.
        later(function () {
          if (assistMsg) { assistMsg.classList.add("show"); assistMsg.setAttribute("aria-hidden", "false"); }
          typeLine(refinementLine, function () {
            // hold, then restart
            later(runCycle, 2600);
          });
        }, afterSteps + 1100);
      };

      // Only animate while the hero window is on screen.
      var running = false;
      if ("IntersectionObserver" in window) {
        var winIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting && !running) {
              running = true;
              runCycle();
            } else if (!e.isIntersecting && running) {
              running = false;
              clearTimers();
            }
          });
        }, { threshold: 0.25 });
        winIO.observe(win);
      } else {
        runCycle();
      }
    }
  }

  /* =================================================================
     Beta waitlist form → Loops.so
     Submissions POST to a Loops newsletter form endpoint. No backend
     server required — Loops stores the contact and lets you send
     TestFlight invites in waves.

     SETUP: in Loops, create a Form (Audience → Forms), copy its
     endpoint ID, and paste it below. The endpoint looks like:
       https://app.loops.so/api/newsletter-form/<THIS_ID>
     Until LOOPS_FORM_ID is set, the form falls back to the local
     success state so the page still works in preview.

     Custom fields sent (name, platform, role, building, feedbackOptIn)
     must also exist as Contact Properties in Loops to be stored.
     ================================================================= */
  var LOOPS_FORM_ID = "cmqekc1qe00nu0j00j3ourjkt";

  var form = document.getElementById("beta-form");
  var success = document.getElementById("beta-success");

  if (form) {
    var required = ["name", "email", "platform", "role"];

    var fieldOf = function (input) {
      return input.closest(".field");
    };
    var clearError = function (input) {
      var f = fieldOf(input);
      if (f) f.classList.remove("invalid");
    };
    var markError = function (input) {
      var f = fieldOf(input);
      if (f) f.classList.add("invalid");
    };

    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () { clearError(el); });
      el.addEventListener("change", function () { clearError(el); });
    });

    // Feedback consent is a required checkbox (its label isn't a .field).
    var feedbackEl = form.elements["feedback"];
    var feedbackField = document.getElementById("bf-feedback-field");
    if (feedbackEl && feedbackField) {
      feedbackEl.addEventListener("change", function () {
        feedbackField.classList.remove("invalid");
      });
    }

    var validEmail = function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var firstInvalid = null;
      var ok = true;

      required.forEach(function (name) {
        var input = form.elements[name];
        var value = (data.get(name) || "").toString().trim();
        var fieldOK = value.length > 0;
        if (name === "email" && fieldOK) fieldOK = validEmail(value);
        if (!fieldOK) {
          ok = false;
          markError(input);
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearError(input);
        }
      });

      // Feedback consent must be checked.
      if (feedbackEl && !feedbackEl.checked) {
        ok = false;
        if (feedbackField) feedbackField.classList.add("invalid");
        if (!firstInvalid) firstInvalid = feedbackEl;
      }

      if (!ok) {
        if (firstInvalid && firstInvalid.focus) firstInvalid.focus();
        return;
      }

      var payload = {
        name: (data.get("name") || "").toString().trim(),
        email: (data.get("email") || "").toString().trim(),
        platform: data.get("platform"),
        role: data.get("role"),
        building: (data.get("building") || "").toString().trim(),
        feedbackOptIn: form.elements["feedback"].checked,
        submittedAt: new Date().toISOString(),
        source: "conjure-landing"
      };

      var showSuccess = function () {
        if (!success) return;
        form.hidden = true;
        success.hidden = false;
        success.setAttribute("tabindex", "-1");
        success.focus();
        success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      };

      var submitBtn = form.querySelector('button[type="submit"]');

      // No Loops form configured yet → keep the page working in preview.
      if (!LOOPS_FORM_ID) {
        console.log("[Conjure waitlist] LOOPS_FORM_ID not set; showing local success.", payload);
        showSuccess();
        return;
      }

      // Loops expects url-encoded form data. Custom fields ride alongside email.
      var body = new URLSearchParams({
        email: payload.email,
        name: payload.name,
        platform: payload.platform || "",
        role: payload.role || "",
        building: payload.building,
        feedbackOptIn: String(payload.feedbackOptIn),
        source: payload.source
      });

      if (submitBtn) { submitBtn.disabled = true; }

      fetch("https://app.loops.so/api/newsletter-form/" + LOOPS_FORM_ID, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString()
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, json: j }; }); })
        .then(function (r) {
          if (r.ok && r.json && r.json.success !== false) {
            showSuccess();
          } else {
            throw new Error((r.json && r.json.message) || "Submission failed");
          }
        })
        .catch(function (err) {
          console.error("[Conjure waitlist] submit failed:", err);
          markError(form.elements["email"]);
          if (submitBtn) { submitBtn.disabled = false; }
          alert("Something went wrong joining the waitlist. Please try again.");
        });
    });
  }

  /* =================================================================
     Cookie consent banner (Google Analytics Consent Mode)
     Analytics defaults to "denied" in the page <head>. This banner
     lets the visitor opt in/out; the choice is stored in localStorage
     and applied via gtag('consent', 'update', …).
     ================================================================= */
  (function () {
    var KEY = "conjure-consent";
    var stored;
    try { stored = localStorage.getItem(KEY); } catch (e) { stored = "denied"; }
    if (stored === "granted" || stored === "denied") return; // decision already made

    var setConsent = function (granted) {
      try { localStorage.setItem(KEY, granted ? "granted" : "denied"); } catch (e) {}
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
      }
      if (banner && banner.parentNode) {
        banner.classList.remove("show");
        setTimeout(function () { if (banner.parentNode) banner.parentNode.removeChild(banner); }, 300);
      }
    };

    var banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML =
      '<p class="cookie-text">We use cookies for analytics to understand how the site is used. ' +
      'See our <a href="privacy.html">Privacy</a> notice.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn-ghost cookie-decline">Decline</button>' +
      '<button type="button" class="btn btn-primary cookie-accept">Accept</button>' +
      '</div>';
    document.body.appendChild(banner);

    banner.querySelector(".cookie-accept").addEventListener("click", function () { setConsent(true); });
    banner.querySelector(".cookie-decline").addEventListener("click", function () { setConsent(false); });

    // Animate in after insertion.
    requestAnimationFrame(function () { banner.classList.add("show"); });
  })();
})();

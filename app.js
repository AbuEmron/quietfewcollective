/* =====================================================================
   The Quiet Few Collective — interactions
   Dependency-free. Every motion effect respects prefers-reduced-motion.
   ===================================================================== */
(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(pointer: fine)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- current year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- header scrolled state + scroll progress ---------- */
  const header = $("#siteHeader");
  const progress = $("#scrollProgress");
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (header) header.classList.toggle("scrolled", y > 24);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- cursor glow (desktop, smoothed) ---------- */
  const glow = $("#cursorGlow");
  if (glow && isFinePointer && !prefersReduced) {
    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty, shown = false;
    window.addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY;
      if (!shown) { glow.style.opacity = "1"; shown = true; }
    }, { passive: true });
    const raf = () => {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  /* ---------- scroll reveals ---------- */
  const reveals = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- active nav link on scroll ---------- */
  const navLinks = $$(".nav a[href^='#']");
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.getAttribute("href") === "#" + id));
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- mobile nav ---------- */
  const toggle = $("#navToggle");
  const mobileNav = $("#mobileNav");
  if (toggle && mobileNav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileNav.hidden = false;             // keep in flow for the transition
      requestAnimationFrame(() => mobileNav.classList.toggle("open", open));
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () =>
      setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", mobileNav).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") setOpen(false);
    });
  }

  /* ---------- 3D tilt cards ---------- */
  if (isFinePointer && !prefersReduced) {
    $$(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      const reset = () => { card.style.transform = ""; };
      card.addEventListener("pointerleave", reset);
      card.addEventListener("blur", reset, true);
    });

    /* ---------- magnetic buttons ---------- */
    $$(".magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.25;
        const y = (e.clientY - r.top - r.height / 2) * 0.35;
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* =====================================================================
     WAITLIST  —  ⬇⬇  CONNECT YOUR BACKEND HERE  ⬇⬇
     ---------------------------------------------------------------------
     Right now submissions are validated client-side and stored locally so
     nothing is lost during development. To go live, implement submitEmail()
     to POST to your provider (Klaviyo / Mailchimp / Supabase / Firebase /
     a serverless function). Do NOT hardcode secret API keys in this file —
     call a serverless endpoint that holds the key. See README "Connect the
     waitlist backend" for copy-paste snippets.
     ===================================================================== */
  async function submitEmail(email) {
    // TODO(waitlist): replace this stub with a real request, e.g.
    //
    //   const res = await fetch("/api/waitlist", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ email }),
    //   });
    //   if (!res.ok) throw new Error("Subscription failed");
    //
    // Until then, persist locally so early signups aren't dropped:
    try {
      const key = "qf_waitlist";
      const list = JSON.parse(localStorage.getItem(key) || "[]");
      if (!list.includes(email)) list.push(email);
      localStorage.setItem(key, JSON.stringify(list));
    } catch (_) { /* private mode — ignore */ }
    return true;
  }

  const form = $("#waitlistForm");
  const state = $("#joinState");
  const input = $("#waitlistEmail");
  const btn = $("#waitlistBtn");

  const setState = (msg, kind) => {
    if (!state) return;
    state.textContent = msg;
    state.classList.remove("success", "error");
    if (kind) state.classList.add(kind);
  };

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Honeypot: if the hidden field is filled, silently drop the bot.
      const hp = form.querySelector(".hp-field");
      if (hp && hp.value) return;

      const email = (input?.value || "").trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        setState("Enter a valid email to request access.", "error");
        input?.focus();
        return;
      }

      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = "Sending…";
      try {
        await submitEmail(email);
        form.reset();
        setState("You’re on the quiet list. Members hear first.", "success");
      } catch (err) {
        setState("Something went quiet on our end. Try again in a moment.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  /* ---------- app-card links: guard un-swapped placeholders ---------- */
  // App links currently point at #waitlist. When you swap in real store URLs
  // (see README), no code change is needed here — this just keeps analytics tidy.
  $$(".app-link[data-app]").forEach((a) => {
    a.addEventListener("click", () => {
      // Hook for analytics, e.g. window.plausible?.("app_click", { props: { app: a.dataset.app } });
    });
  });

  /* ---------- service worker ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("service-worker.js").catch(() => { /* offline-first is best-effort */ });
    });
  }
})();

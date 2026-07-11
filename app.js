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

  /* ---------- header scrolled state + scroll progress ----------
     One passive scroll listener. Atmosphere parallax now lives inside the
     WebGL shader (depth layers scroll on their own clock), so no per-scroll
     CSS-var writes are needed here anymore. */
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

  /* ---------- living atmosphere: WebGL volumetric smoke ----------
     A single full-screen fragment shader renders domain-warped fractal smoke
     with the brand palette embedded and depth layers scrolling at different
     rates. See initAtmosphere() near the bottom of this file. */
  const atmController = initAtmosphere({ prefersReduced, isFinePointer });

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

  /* =====================================================================
     LIVING ATMOSPHERE — WebGL volumetric smoke
     ---------------------------------------------------------------------
     A single full-screen fragment shader renders domain-warped fractal
     (fbm) smoke with the brand palette embedded INSIDE the smoke and two
     depth layers scrolling at different rates (the "4D" parallax). One
     GPU-composited layer → smooth 60fps, no repaint jank (this replaced a
     stack of animated blur()+mix-blend feTurbulence sheets that stuttered).

     Cost is tiered per device (DPR cap, internal render scale, octave
     count, mobile frame throttle). If WebGL is unavailable or the device
     is very low-end, we fall back to a static CSS composition (.no-webgl).
     prefers-reduced-motion → exactly one static frame, no loop.
     The render loop is cancelled when the tab is hidden (battery/GPU).
     ===================================================================== */
  function initAtmosphere({ prefersReduced, isFinePointer }) {
    const wrap = $("#livingAtmosphere");
    const canvas = $("#atmCanvas");
    if (!wrap || !canvas) return null;

    const useFallback = () => { wrap.classList.add("no-webgl"); return null; };

    // Very low-end guard → skip GL entirely, use the static composition.
    const cores = navigator.hardwareConcurrency || 8;
    const mem = navigator.deviceMemory || 8;
    if (cores <= 2 || mem <= 1) return useFallback();

    const glOpts = { alpha: true, antialias: false, depth: false, stencil: false,
                     premultipliedAlpha: true, powerPreference: "low-power",
                     failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext("webgl", glOpts) || canvas.getContext("experimental-webgl", glOpts);
    if (!gl) return useFallback();

    // Device tier ---------------------------------------------------------
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const smallScreen = window.matchMedia("(max-width: 620px)").matches;
    const mobileTier = coarse || smallScreen || !isFinePointer;
    const dprCap = mobileTier ? 1.5 : 2;
    const renderScale = mobileTier ? 0.72 : 1.0;   // internal buffer scale
    const quality = mobileTier ? 0.0 : 1.0;        // 0 → 4 octaves, 1 → 6
    const minFrameMs = mobileTier ? 33 : 0;        // ~30fps throttle on mobile

    const VERT = `
      attribute vec2 a_pos;
      void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

    const FRAG = `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
      #else
        precision mediump float;
      #endif
      uniform vec2  u_res;
      uniform float u_time;
      uniform vec2  u_mouse;     // 0..1
      uniform float u_mouseAmt;  // 0..1
      uniform float u_quality;   // 0..1

      float hash(vec2 p){
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p){
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      float fbm(vec2 p, float oct){
        float sum = 0.0, amp = 0.5, freq = 1.0;
        for (int i = 0; i < 6; i++){
          if (float(i) >= oct) break;
          sum += amp * vnoise(p * freq);
          freq *= 2.0;
          amp  *= 0.5;
        }
        return sum;
      }
      // Domain-warped smoke: returns density; exports the warp vector for colour.
      float smoke(vec2 p, float t, float oct, out vec2 warpOut){
        vec2 q = vec2(
          fbm(p + vec2(0.0, 0.30 * t), oct),
          fbm(p + vec2(5.2, 1.3) + vec2(0.26 * t, 0.0), oct)
        );
        vec2 r = vec2(
          fbm(p + 3.4 * q + vec2(1.7, 9.2) + 0.15 * t, oct),
          fbm(p + 3.4 * q + vec2(8.3, 2.8) - 0.12 * t, oct)
        );
        warpOut = q + r;
        return fbm(p + 3.0 * r + 0.10 * t, oct);
      }
      // Brand palette ramp — muted indigo → cobalt → violet → cyan → indigo.
      vec3 ramp(float h){
        vec3 indigo = vec3(0.13, 0.17, 0.44);
        vec3 cobalt = vec3(0.10, 0.24, 1.00);
        vec3 violet = vec3(0.36, 0.16, 0.92);
        vec3 cyan   = vec3(0.10, 0.72, 0.84);
        vec3 c = indigo;
        c = mix(c, cobalt, smoothstep(0.00, 0.35, h));
        c = mix(c, violet, smoothstep(0.35, 0.60, h));
        c = mix(c, cyan,   smoothstep(0.60, 0.85, h));
        c = mix(c, indigo, smoothstep(0.85, 1.00, h));
        return c;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        float aspect = u_res.x / u_res.y;
        vec2 p = vec2(uv.x * aspect, uv.y);

        float oct = mix(4.0, 6.0, u_quality);
        float t = u_time;

        // Two depth layers at different scales/speeds → volumetric parallax.
        vec2 wFar, wNear;
        float far  = smoke(p * 0.85 + vec2(0.020 * t, 0.012 * t), t * 0.5, oct - 1.0, wFar);
        float near = smoke(p * 1.70 - vec2(0.030 * t, 0.020 * t), t * 0.8, oct,       wNear);

        float density = smoothstep(0.26, 0.90, mix(far, near, 0.5));

        // Colour lives inside the smoke: hue drifts with the far warp field.
        float hue = clamp((wFar.x + wFar.y) * 0.5, 0.0, 1.0);
        vec3 col = ramp(hue);

        // Restrained silver / magenta accents from the near field (sparse).
        // Silver kept light so it tints without greying the whole field out.
        float acc = clamp((wNear.x + wNear.y) * 0.5, 0.0, 1.0);
        col = mix(col, vec3(0.62, 0.68, 0.80), smoothstep(0.68, 0.84, acc) * 0.30); // smoky silver
        col = mix(col, vec3(0.72, 0.20, 0.56), smoothstep(0.83, 0.96, acc) * 0.34); // magenta

        // Gently lift saturation so the abstract colour reads through the smoke
        // (still restrained — nowhere near neon).
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col = clamp(mix(vec3(lum), col, 1.28), 0.0, 1.0);

        // Energy sits OUTSIDE the central reading column; soft clearing behind
        // the hero text (upper-centre) keeps cream typography razor-sharp.
        vec2 c = uv - vec2(0.5, 0.42);
        float d = length(vec2(c.x * 1.10, c.y * 0.90));
        float clearing = smoothstep(0.14, 0.60, d);
        float hero = smoothstep(0.34, 0.0, distance(uv, vec2(0.5, 0.32)));
        clearing *= (1.0 - 0.62 * hero);

        float amt = density * clearing;

        vec3 color = col * amt * 1.12;

        // A very subtle desktop cursor illumination, still clearing-masked.
        float m = smoothstep(0.34, 0.0, distance(vec2(uv.x * aspect, uv.y),
                                                 vec2(u_mouse.x * aspect, u_mouse.y)));
        color += vec3(0.10, 0.24, 1.00) * m * u_mouseAmt * 0.05 * clearing;

        // Premultiplied output; base near-black stays under the CSS floor.
        float a = clamp(amt * 1.15 + m * u_mouseAmt * 0.05 * clearing, 0.0, 1.0);
        gl_FragColor = vec4(color, a);
      }`;

    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return useFallback();

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return useFallback();
    gl.useProgram(prog);

    // Fullscreen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseAmt = gl.getUniformLocation(prog, "u_mouseAmt");
    const uQuality = gl.getUniformLocation(prog, "u_quality");
    gl.uniform1f(uQuality, quality);

    gl.disable(gl.DEPTH_TEST);

    // Sizing -------------------------------------------------------------
    // Prefer visualViewport: in an iOS installed PWA (standalone) window.inner*
    // can report a stale/zero size at launch under viewport-fit=cover, which
    // sizes the canvas to 0 → nothing paints → the near-black floor shows
    // ("black background" bug). visualViewport reflects the real drawable area.
    let W = 0, H = 0;
    const viewportSize = () => {
      const vv = window.visualViewport;
      const cssW = (vv && vv.width) || window.innerWidth || document.documentElement.clientWidth || 1;
      const cssH = (vv && vv.height) || window.innerHeight || document.documentElement.clientHeight || 1;
      return { cssW, cssH };
    };
    const resize = () => {
      const { cssW, cssH } = viewportSize();
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap) * renderScale;
      W = Math.max(1, Math.round(cssW * dpr));
      H = Math.max(1, Math.round(cssH * dpr));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
        gl.viewport(0, 0, W, H);
      }
    };
    resize();

    // Smoothed cursor influence (desktop / fine pointer only).
    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, mouseAmt = 0;
    if (isFinePointer && !prefersReduced) {
      window.addEventListener("pointermove", (e) => {
        tmx = e.clientX / window.innerWidth;
        tmy = 1.0 - e.clientY / window.innerHeight;   // GL y-up
        mouseAmt = 1;
      }, { passive: true });
    }

    // Render loop --------------------------------------------------------
    let raf = 0, running = false, last = 0, acc = 0, t = 0;
    const SPEED = 0.09;                 // slow, luxurious clock

    const draw = () => {
      resize();
      gl.uniform2f(uRes, W, H);
      gl.uniform1f(uTime, t);
      mx += (tmx - mx) * 0.05;
      my += (tmy - my) * 0.05;
      gl.uniform2f(uMouse, mx, my);
      gl.uniform1f(uMouseAmt, mouseAmt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const frame = (now) => {
      if (!running) return;
      if (!last) last = now;
      let dt = (now - last) / 1000;
      if (dt < 0) dt = 0;
      if (minFrameMs && (now - last) < minFrameMs) { raf = requestAnimationFrame(frame); return; }
      last = now;
      if (dt > 0.05) dt = 0.05;         // clamp after a stall / tab-away
      t += dt * SPEED;
      draw();
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || prefersReduced) return;
      running = true; last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // Reveal once we know the first frame is on screen.
    const reveal = () => canvas.classList.add("is-live");

    // Re-measure + repaint on demand. When the loop is running it will pick up
    // the new size on its next frame, so we only force a manual draw when idle.
    const kick = () => {
      resize();
      if (running) { last = 0; } else { draw(); }
    };

    if (prefersReduced) {
      // Beautiful STATIC frame — render one warmed-up moment, no loop.
      t = 14.0;
      draw();
      reveal();
    } else {
      t = 6.0;                          // start already "in motion", not blank
      draw();
      requestAnimationFrame(reveal);
      start();
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop(); else start();
      });

      // iOS standalone launch quirks: the viewport can be reported stale/zero on
      // first paint and rAF is sometimes deferred until the window settles. A
      // couple of deferred re-kicks re-measure and repaint once it's real.
      window.addEventListener("load", kick);
      const standalone = navigator.standalone === true ||
        window.matchMedia("(display-mode: standalone)").matches;
      if (standalone) {
        setTimeout(kick, 60);
        setTimeout(kick, 400);
      }

      // Watchdog: if no frame has landed shortly after init (rAF never fired, or
      // the buffer came up 0-sized), force one draw + reveal. If it still can't
      // produce a real-sized buffer, drop to the static CSS fallback. Either way
      // the enriched .la-base guarantees the background is never pure black.
      setTimeout(() => {
        if (canvas.classList.contains("is-live")) return;
        resize();
        if (W < 2 || H < 2) { useFallback(); return; }
        draw();
        reveal();
        if (!running) start();
      }, 700);
    }

    // Resize is cheap (only reallocs the buffer when dimensions change).
    // orientationchange + visualViewport cover mobile / standalone rotations and
    // the iOS URL-bar / safe-area viewport shifts that plain "resize" can miss.
    let rz = 0;
    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(kick, 150);
    };
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onResize, { passive: true });
    }

    // Context loss / recovery + teardown.
    canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stop(); }, false);
    canvas.addEventListener("webglcontextrestored", () => { /* rare; fall back cleanly */ useFallback(); }, false);
    window.addEventListener("pagehide", () => {
      stop();
      const lose = gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    });

    return { start, stop };
  }
})();

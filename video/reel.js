/* limora-unslop reel engine.
   Reads window.REEL from the reel file, wraps #screen in a stage (checklist, device, camera, cursor),
   builds the timeline, and exposes window.reel = { ready, seek, play, duration, cues, size }.
   render.mjs injects this file; seek(ms) makes every frame reproducible. */
(() => {
  const q = new URLSearchParams(location.search);
  const cfg = Object.assign({ size: [1440, 1080], screen: [1440, 900], device: "tablet", steps: [], credit: "", end: {} }, window.REEL || {});
  if (q.get("size")) cfg.size = q.get("size").split("x").map(Number);
  const [W, H] = cfg.size, [SW, SH] = cfg.screen;

  // Step icons (24px, stroke). Unknown ids get a plain dot.
  const ICONS = {
    declutter: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    spacing: '<path d="M4 4v16M20 4v16M8 12h8M10 9.5 7.5 12 10 14.5M14 9.5l2.5 2.5-2.5 2.5"/>',
    color: '<path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5Z"/>',
    copy: '<path d="M5 6h14M5 11h14M5 16h9"/>',
    type: '<path d="M4 18 8.5 6h1L14 18M5.6 14h6.8M15.5 10.5c1-1 2-1.2 3-1.2 1.7 0 2.5 1 2.5 2.5V18M21 14.5c-3.5 0-5.5.4-5.5 2s1.2 1.6 2 1.6c1.8 0 3.5-1.2 3.5-3"/>',
    icons: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    imagery: '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4.5 3.5"/>',
    empty: '<path d="M4 13.5 6.5 6h11l2.5 7.5V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.5ZM4 13.5h4.5l1 2h5l1-2H20"/>',
    details: '<path d="M5 19V11a6 6 0 0 1 6-6h8"/><path d="M15 2.5 19 5l-4 2.5"/>',
    layout: '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M10 10v10"/>',
    motion: '<path d="M4 12h3l2-5 4 10 2-5h5"/>',
  };
  const DOT = '<circle cx="12" cy="12" r="4"/>';
  const TICK = '<path d="m5.5 12.5 4 4 9-9"/>';
  const svg = (inner, cls, w = 1.7) => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const make = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; };
  const iconFor = (s) => ICONS[s.icon] || ICONS[s.id] || ICONS[String(s.id).split(/[-\s]/)[0]] || DOT;

  const screen = document.getElementById("screen");
  if (!screen) throw new Error('The reel file needs one element with id="screen" holding the screen.');

  // ---------- stage ----------
  const font = make("link"); font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap";
  document.head.appendChild(font);

  const stage = make("div", "lu-stage");
  Object.assign(stage.style, { width: W + "px", height: H + "px" });
  const list = make("div", "lu-list");
  const items = cfg.steps.map((s) => {
    const it = make("div", "lu-item", `<span class="lu-ico">${svg(iconFor(s), "lu-base")}${svg(TICK, "lu-tick", 2)}</span>${s.label}${s.count != null ? `<span class="lu-num">${s.count}</span>` : ""}`);
    list.appendChild(it); return it;
  });
  const note = make("div", "lu-note", '<span class="lu-logo"></span><span></span>');
  const rig = make("div", "lu-rig");
  const device = make("div", "lu-device" + (cfg.device === "none" ? " lu-bare" : ""));
  const view = make("div", "lu-view");
  const canvas = make("div", "lu-canvas");
  const grid = make("div", "lu-grid");
  const scan = make("div", "lu-scan");
  const cursor = make("div", "lu-cursor", '<svg viewBox="0 0 26 26"><path d="M5 3 L5 21 L10 16.5 L13.5 24 L16.5 22.6 L13 15.3 L20 15.3 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>');
  const badge = make("div", "lu-badge");
  const credit = make("div", "lu-credit", cfg.credit ? `made by ${cfg.credit}` : "");
  const end = make("div", "lu-end", `<h2>${cfg.end.title || 'Unslopped with <span>limora-unslop</span>'}</h2><p>${cfg.end.line || "Free Claude skill · visuals drawn with Limora AI"}</p>`);

  screen.parentNode.insertBefore(stage, screen);
  Object.assign(screen.style, { width: SW + "px", height: SH + "px" });
  canvas.append(screen, grid, scan, cursor);
  view.appendChild(canvas); device.appendChild(view); rig.append(device, badge);
  stage.append(list, note, rig, credit, end);

  // ---------- layout ----------
  let k = 1, devBox = null;
  function layout() {
    const top = 40 + list.offsetHeight + 34, bottom = 76;
    const pad = cfg.device === "none" ? 0 : 22;
    const availW = W - 2 * 72, availH = H - top - bottom;
    k = Math.min((availW - 2 * pad) / SW, (availH - 2 * pad) / SH);
    const dw = SW * k + 2 * pad, dh = SH * k + 2 * pad;
    const left = (W - dw) / 2, dtop = top + (availH - dh) / 2;
    devBox = { left, top: dtop, w: dw, h: dh };
    Object.assign(device.style, { left: left + "px", top: dtop + "px", width: dw + "px", height: dh + "px" });
    Object.assign(view.style, { left: pad + "px", top: pad + "px", width: SW * k + "px", height: SH * k + "px" });
    canvas.style.transform = `scale(${k})`;
    canvas.style.setProperty("--lu-inv", (1 / k).toFixed(4));
    cursor.style.width = cursor.style.height = 26 / k + "px";
    Object.assign(badge.style, { left: W / 2 + "px", top: dtop - 17 + "px" });
    note.style.bottom = "20px";
  }

  // ---------- helpers in screen pixels ----------
  const box = (n) => { const s = screen.getBoundingClientRect(), r = n.getBoundingClientRect(), z = s.width / SW; return { x: (r.left - s.left) / z, y: (r.top - s.top) / z, w: r.width / z, h: r.height / z }; };
  const all = (attr, id) => [...screen.querySelectorAll(`[${attr}]`)].filter((n) => n.getAttribute(attr).split(/\s+/).includes(id));
  const chrome = (off) => { list.classList.toggle("lu-off", off); credit.classList.toggle("lu-off", off); };

  function camera(n, zoom) {
    rig.style.transitionDuration = "950ms";
    if (!n) { rig.style.transform = "translate(0px, 0px) scale(1)"; return; }
    const r = n.getBoundingClientRect(), st = stage.getBoundingClientRect();
    const cx = r.left - st.left + r.width / 2, cy = r.top - st.top + r.height / 2;
    const z = zoom || Math.max(1.3, Math.min(2.4, (W * 0.74) / r.width, (H * 0.7) / r.height));
    rig.style.transform = `translate(${W / 2 - cx * z}px, ${H / 2 - cy * z}px) scale(${z})`;
  }
  function cursorTo(n, dx = 0.5, dy = 0.5, ms = 700) {
    const b = box(n);
    cursor.style.transitionDuration = ms + "ms, 280ms";
    cursor.style.transform = `translate(${b.x + b.w * dx}px, ${b.y + b.h * dy}px)`;
  }

  // effect animations we may need to rewind for the before/after flash
  const effects = [];
  const fx = (n, frames, opts) => { const a = n.animate(frames, Object.assign({ fill: "both", easing: "cubic-bezier(0.5, 0, 0.15, 1)" }, opts)); effects.push(a); return a; };

  function prepare() {
    screen.querySelectorAll("*").forEach((n) => {
      const b = box(n);
      n.style.setProperty("--lu-lag", Math.round(Math.min(380, Math.max(0, b.y) / SH * 260 + Math.max(0, b.x) / SW * 120)) + "ms");
    });
    screen.querySelectorAll("[data-gone]").forEach((n) => { const b = box(n); n.dataset.luH = Math.ceil(b.h); n.dataset.luW = Math.ceil(b.w); });
    screen.querySelectorAll("[data-arrive], [data-pop]").forEach((n) => { n.style.opacity = 0; });
    screen.querySelectorAll("[data-reveal]").forEach((n) => { n.style.clipPath = "inset(0 100% 0 0)"; });
    screen.querySelectorAll("video[data-play]").forEach((v) => { v.pause(); v.loop = true; v.muted = true; v.currentTime = 0; });
  }

  const playing = [];
  function apply(s, i) {
    const d = (screen.dataset.done || "").split(/\s+/).filter(Boolean);
    d.push(s.id); screen.dataset.done = d.join(" ");
    items[i].classList.add("lu-on");
    all("data-gone", s.id).forEach((n) => {
      const p = n.parentElement, cs = getComputedStyle(p), row = /flex/.test(cs.display) && cs.flexDirection.startsWith("row");
      const gap = parseFloat(row ? cs.columnGap : cs.rowGap) || 0;
      fx(n, [
        { maxHeight: n.dataset.luH + "px", maxWidth: n.dataset.luW + "px", opacity: 1 },
        { maxHeight: row ? n.dataset.luH + "px" : "0px", maxWidth: row ? "0px" : n.dataset.luW + "px", opacity: 0, paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px",
          marginTop: row ? "0px" : -gap + "px", marginLeft: row ? -gap + "px" : "0px", marginBottom: "0px", borderWidth: "0px" },
      ], { duration: 700 });
      n.style.overflow = "hidden";
    });
    all("data-arrive", s.id).forEach((n) => fx(n, [{ opacity: 0, transform: "translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 600, delay: 150 }));
    all("data-reword", s.id).forEach((n) => {
      const [a, b] = n.children;
      fx(a, [{ opacity: 1, filter: "blur(0px)", transform: "none" }, { opacity: 0, filter: "blur(8px)", transform: "translateY(-12px)" }], { duration: 420 });
      fx(b, [{ opacity: 0, filter: "blur(8px)", transform: "translateY(12px)" }, { opacity: 1, filter: "blur(0px)", transform: "none" }], { duration: 520, delay: 160 });
    });
    all("data-reveal", s.id).forEach((n) => {
      fx(n, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], { duration: 1300, easing: "cubic-bezier(0.76, 0, 0.24, 1)" });
      const img = n.querySelector("img, video");
      if (img) fx(img, [{ transform: "scale(1.08)" }, { transform: "scale(1)" }], { duration: 1600, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    });
    all("data-play", s.id).forEach((v) => playing.push({ v, from: now }));
  }
  function pop(n, delay) {
    fx(n, [{ opacity: 0, transform: "scale(0.4)" }, { opacity: 1, transform: "scale(1.12)", offset: 0.6 }, { opacity: 1, transform: "scale(1)" }], { duration: 520, delay, easing: "cubic-bezier(0.34, 1.4, 0.64, 1)" });
  }

  // ---------- flags (highlighter scan) ----------
  let flagEls = [];
  function showFlag(n) {
    const b = box(n), below = n.dataset.flagPos === "below" || b.y < 70, f = make("div", "lu-flag" + (below ? " lu-below" : ""), `<b><span class="lu-logo"></span>${n.dataset.flag}</b>`);
    Object.assign(f.style, { left: b.x - 6 + "px", top: b.y - 6 + "px", width: b.w + 12 + "px", height: b.h + 12 + "px" });
    canvas.appendChild(f); flagEls.push(f);
    f.animate([{ opacity: 0, transform: "scale(0.96)" }, { opacity: 1, transform: "none" }], { duration: 260, fill: "forwards" });
  }
  function clearFlags() { flagEls.forEach((f) => f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" })); }

  // ---------- timeline ----------
  const T = [], cues = [], marks = [];
  const pace = Number(cfg.pace) || 1; // below 1 shortens every default hold
  const at = (t, fn, sound, vol) => { T.push({ t, fn }); if (sound) cues.push({ t: +t.toFixed(3), sound, vol: vol ?? 1 }); };
  let duration = 0, now = 0, stash = [];

  function build() {
    let t = 0.7;
    const flags = [...screen.querySelectorAll("[data-flag]")];
    if (flags.length) {
      const SCAN = 1.7;
      at(t, () => { scan.style.opacity = 1; scan.animate([{ transform: "translateY(0px)" }, { transform: `translateY(${SH}px)` }], { duration: SCAN * 1000, easing: "cubic-bezier(0.4, 0, 0.6, 1)", fill: "forwards" }); }, "sweep", 0.8);
      flags.map((n) => ({ n, y: box(n).y })).sort((a, b) => a.y - b.y).forEach(({ n, y }) => at(t + SCAN * Math.min(1, Math.max(0, y) / SH), () => showFlag(n), "tick", 0.5));
      marks.push({ t: t + SCAN * 0.85, label: "scan" });
      t += SCAN;
      at(t, () => scan.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }));
      t += 1.1;
      at(t, clearFlags);
      t += 0.4;
    }
    cfg.steps.forEach((s, i) => {
      const focus = s.focus && screen.querySelector(s.focus);
      if (focus) { at(t, () => { chrome(true); camera(focus, s.zoom); }, "sweep", 0.6); t += 0.95; }
      at(t, () => apply(s, i), "tick", 0.9);
      marks.push({ t: t + 0.55, label: s.label });
      if (s.note) { at(t + 0.2, () => { note.lastChild.textContent = s.note; note.classList.add("lu-show"); credit.classList.add("lu-off"); }, null); }
      const pops = all("data-pop", s.id);
      pops.forEach((n, j) => { at(t + 0.2 + j * 0.11, () => pop(n, 0), "pop", 0.55); });
      if (all("data-reveal", s.id).length) cues.push({ t: t + 0.05, sound: "reveal", vol: 1 });
      const spacing = /spac/i.test(s.id);
      if (spacing) { at(t, () => grid.classList.add("lu-show")); }
      const hold = s.hold ?? ((focus ? 2.6 : spacing ? 1.9 : 1.35) + pops.length * 0.08) * pace;
      t += hold;
      if (spacing) at(t - 0.3, () => grid.classList.remove("lu-show"), "ding", 0.35);
      if (s.note) at(t - 0.1, () => { note.classList.remove("lu-show"); if (!focus) credit.classList.remove("lu-off"); });
      if (focus) { at(t, () => { camera(null); chrome(false); }, "sweep", 0.5); t += 1.05; }
    });

    const o = cfg.outro || {};
    const hovers = (o.hover || []).map((sel) => screen.querySelector(sel)).filter(Boolean);
    if (hovers.length) {
      at(t, () => { cursor.classList.add("lu-show"); cursorTo(hovers[0], 0.2, 1.3, 1); });
      hovers.forEach((n, j) => {
        at(t + 0.1 + j * 0.75, () => cursorTo(n, 0.62, 0.62, 600));
        at(t + 0.5 + j * 0.75, () => { hovers.forEach((h) => h.classList.remove("is-hover")); n.classList.add("is-hover"); }, "tick", 0.25);
      });
      t += 0.1 + hovers.length * 0.75 + 0.3;
      const last = hovers[hovers.length - 1];
      at(t, () => { cursor.classList.add("lu-press"); last.classList.add("is-press"); }, "click", 0.8);
      at(t + 0.14, () => { cursor.classList.remove("lu-press"); last.classList.remove("is-press"); last.classList.add("is-picked"); });
      t += 1.0;
      at(t, () => cursor.classList.remove("lu-show"));
    }

    // REEL.compare = false skips this part (about 6 s)
    if (cfg.compare !== false) {
      // before / after: hold the old screen, then drag a divider across to reveal the new one
      const DRAG_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";
      let after = null, divider = null;
      at(t, () => {
        // freeze the finished screen into a copy that will be revealed by the drag
        effects.forEach((a) => { try { a.commitStyles(); } catch {} });
        after = screen.cloneNode(true);
        after.removeAttribute("id"); after.classList.add("lu-after-copy", "lu-snap");
        after.querySelectorAll("video").forEach((v, i) => { const src = screen.querySelectorAll("video")[i]; const p = playing.find((x) => x.v === src); v.muted = true; v.loop = true; if (p) playing.push({ v, from: p.from }); });
        after.style.clipPath = "inset(0 100% 0 0)";
        canvas.insertBefore(after, grid);
        divider = make("div", "lu-divider", '<span class="lu-knob"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 7-5 5 5 5M15 7l5 5-5 5"/></svg></span>');
        canvas.insertBefore(divider, grid);
        // the screen underneath goes back to how it started
        screen.classList.add("lu-snap");
        screen.dataset.luDone = screen.dataset.done; screen.dataset.done = "";
        effects.forEach((a) => held.set(a, 0)); flagEls.forEach((f) => f.remove()); flagEls = [];
        stash = [...screen.querySelectorAll(".is-hover, .is-picked")].map((n) => [n, n.className]);
        stash.forEach(([n]) => n.classList.remove("is-hover", "is-picked"));
        badge.textContent = "Before"; badge.classList.remove("lu-after"); badge.classList.add("lu-show");
      }, "sweep", 0.4);
      marks.push({ t: t + 1.0, label: "before" });
      t += 2.0;
      const MID = 0.5, at0 = 0.03;
      const moveTo = (from, to, ms) => {
        after.animate([{ clipPath: `inset(0 ${(1 - from) * 100}% 0 0)` }, { clipPath: `inset(0 ${(1 - to) * 100}% 0 0)` }], { duration: ms, easing: DRAG_EASE, fill: "forwards" });
        divider.animate([{ transform: `translateX(${from * SW}px)` }, { transform: `translateX(${to * SW}px)` }], { duration: ms, easing: DRAG_EASE, fill: "forwards" });
        cursor.style.transitionDuration = ms + "ms, 280ms";
        cursor.style.transform = `translate(${to * SW + 4}px, ${SH / 2 + 6}px)`;
      };
      at(t, () => {
        divider.classList.add("lu-show");
        divider.animate([{ transform: `translateX(${at0 * SW}px)` }, { transform: `translateX(${at0 * SW}px)` }], { duration: 1, fill: "forwards" });
        cursor.style.transitionDuration = "1ms, 280ms";
        cursor.style.transform = `translate(${at0 * SW + 70}px, ${SH / 2 + 60}px)`;
        cursor.classList.add("lu-show");
      });
      at(t + 0.15, () => { cursor.style.transitionDuration = "450ms, 280ms"; cursor.style.transform = `translate(${at0 * SW + 4}px, ${SH / 2 + 6}px)`; });
      at(t + 0.65, () => { cursor.classList.add("lu-press"); divider.classList.add("lu-grab"); }, "click", 0.5);
      t += 0.8;
      at(t, () => moveTo(at0, MID, 1000), "sweep", 0.35);
      marks.push({ t: t + 1.1, label: "compare" });
      t += 1.0;
      at(t, () => { badge.textContent = "After"; badge.classList.add("lu-after"); });
      t += 0.45;
      at(t, () => moveTo(MID, 1, 900), "sweep", 0.35);
      t += 0.95;
      at(t, () => {
        cursor.classList.remove("lu-press", "lu-show"); divider.classList.remove("lu-show", "lu-grab");
        // put the real screen back in its finished state and drop the copy
        screen.dataset.done = screen.dataset.luDone;
        effects.forEach((a) => held.set(a, Infinity));
        stash.forEach(([n, c]) => { n.className = c; });
      }, "ding", 0.5);
      at(t + 0.4, () => { if (after) after.remove(); if (divider) divider.remove(); });
      t += 1.3;
    }

    // end card
    at(t, () => {
      chrome(true); badge.classList.remove("lu-show");
      // device and text are centered together, as one group
      const s = Math.min(0.62, (H - 300) / devBox.h), gap = 44, block = devBox.h * s + gap + end.offsetHeight, y = (H - block) / 2;
      rig.style.transitionDuration = "1000ms";
      rig.style.transform = `translate(${W / 2 - (W / 2) * s}px, ${y - devBox.top * s}px) scale(${s})`;
      end.style.top = y + devBox.h * s + gap + "px";
      end.classList.add("lu-show");
    }, "sweep", 0.6);
    marks.push({ t: t + 2.6, label: "end card" });
    t += 3.0;
    duration = t;
    T.sort((a, b) => a.t - b.t);
  }

  // ---------- clock ----------
  const born = new Map(), held = new Map();
  let fired = 0, live = false;
  function seek(ms) {
    now = ms;
    while (fired < T.length && T[fired].t * 1000 <= ms + 0.5) T[fired++].fn();
    for (const a of document.getAnimations()) {
      if (!born.has(a)) { born.set(a, ms); a.pause(); }
      const endT = a.effect ? a.effect.getComputedTiming().endTime : Infinity;
      let local = held.has(a) ? held.get(a) : ms - born.get(a);
      if (local === Infinity) local = endT;
      if (Number.isFinite(endT) && local >= endT) a.currentTime = endT; else a.currentTime = Math.max(0, local);
    }
    const waits = [];
    if (live) { for (const p of playing) if (p.v.paused) p.v.play().catch(() => {}); return null; }
    for (const p of playing) {
      const v = p.v; if (!v.duration) continue;
      const want = ((ms - p.from) / 1000) % v.duration;
      if (Math.abs(v.currentTime - want) > 0.004) waits.push(new Promise((ok) => { v.addEventListener("seeked", ok, { once: true }); v.currentTime = want; }));
    }
    return waits.length ? Promise.all(waits) : null;
  }

  async function ready() {
    await document.fonts.ready;
    await Promise.all([...document.images].map((im) => im.complete ? null : new Promise((ok) => { im.onload = im.onerror = ok; })));
    await Promise.all([...document.querySelectorAll("video")].map((v) => v.readyState >= 1 ? null : new Promise((ok) => v.addEventListener("loadedmetadata", ok, { once: true }))));
    layout(); prepare(); build();
    window.reel.duration = duration;
    window.reel.marks = marks;
    return { duration, cues, marks, size: [W, H] };
  }
  // Real-time playback. hooks.onCue(cue) fires as each sound is due, hooks.onEnd() once at the end.
  function play(hooks = {}) {
    live = true;
    const start = performance.now(), due = [...cues].sort((a, b) => a.t - b.t);
    let next = 0;
    const loop = () => {
      const ms = performance.now() - start;
      seek(ms);
      while (next < due.length && due[next].t * 1000 <= ms) { if (hooks.onCue) hooks.onCue(due[next]); next++; }
      if (ms < duration * 1000) requestAnimationFrame(loop); else if (hooks.onEnd) hooks.onEnd();
    };
    requestAnimationFrame(loop);
  }
  window.reel = { ready, seek, play, duration: 0, cues, marks, size: [W, H] };

  // ?live: play on load inside an iframe and report to the parent page (used by the landing page)
  if (q.has("live")) {
    const tell = (msg) => { try { parent.postMessage(Object.assign({ from: "limora-unslop" }, msg), "*"); } catch {} };
    const go = () => ready().then(() => {
      tell({ type: "ready", size: [W, H], duration });
      play({ onCue: (c) => tell({ type: "cue", sound: c.sound, vol: c.vol }), onEnd: () => tell({ type: "end" }) });
    });
    if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true });
  }
})();

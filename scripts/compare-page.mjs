#!/usr/bin/env node
/**
 * Builds the before/after page for a finished run: a drag-to-compare slider, Before / After / Side by side views,
 * what changed, and what Limora drew. Plain Node, nothing to install.
 *
 *   node compare-page.mjs --before before.png --after after.png --data compare.json --out limora-unslop-compare
 *
 * before/after: full-page screenshots at the same width (1440). Both are cropped to the shorter height so they
 * line up, and written as WebP when cwebp is installed, otherwise PNG.
 * compare.json:
 *   { "title": "Crumb & Co", "line": "A vibecoded bakery dashboard",
 *     "steps":  [{ "label": "Declutter", "count": 6, "text": "Upgrade box and fake AI tips removed." }, ...],
 *     "images": [{ "label": "Icons", "count": 8 }, { "label": "Hero banner", "count": 1 }],
 *     "limora": "Two generations in the Morning Bake style: ..." }
 * Writes page.html (to publish as a Claude artifact, with the two images as its files) and index.html (a full
 * document to open locally or host anywhere).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { parseArgs, stop } from "./cli.mjs";
import { crop, loadImage, resize, savePNG } from "./png.mjs";

const { options } = parseArgs(process.argv.slice(2), new Set(["before", "after", "data", "out"]));
for (const k of ["before", "after", "data", "out"]) if (!options[k]) stop("usage: node compare-page.mjs --before before.png --after after.png --data compare.json --out <dir>");
const data = JSON.parse(readFileSync(options.data, "utf8"));
const out = path.resolve(options.out);
mkdirSync(out, { recursive: true });

// Same width, same height, so the slider lines up.
let before = loadImage(options.before), after = loadImage(options.after);
const W = Math.min(1440, before.width, after.width);
const fit = (img) => (img.width === W ? img : resize(img, W, Math.round((img.height * W) / img.width)));
before = fit(before); after = fit(after);
const H = Math.min(before.height, after.height);
before = crop(before, 0, 0, W, H); after = crop(after, 0, 0, W, H);

let webp = true;
try { execFileSync("cwebp", ["-version"], { stdio: "ignore" }); } catch { webp = false; }
const ext = webp ? "webp" : "png";
for (const [name, img] of [["before", before], ["after", after]]) {
  const png = path.join(webp ? tmpdir() : out, `${name}${webp ? `-${process.pid}` : ""}.png`);
  savePNG(png, img);
  if (webp) { execFileSync("cwebp", ["-quiet", "-q", "84", png, "-o", path.join(out, `${name}.webp`)]); rmSync(png, { force: true }); }
}

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const title = esc(data.title || "Before and after"), line = esc(data.line || "A vibecoded page");
const steps = (data.steps || []).map((s) => `<li><b>${esc(s.label)}</b><span class="n">${esc(s.count ?? "")}</span><span>${esc(s.text)}</span></li>`).join("\n        ");
const images = (data.images || []).map((i) => `<div class="row"><span>${esc(i.label)}</span><span>${esc(i.count)}</span></div>`).join("\n      ");

const body = `<title>${title} Unslop</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #f4f4f2; --panel: #ffffff; --ink: #18171b; --ink-2: #6a6770; --line: rgba(24, 23, 27, 0.1); --seg: #e7e6e3;
  --accent: #7a3cf0; --pill: linear-gradient(100deg, #9a4ff2 0%, #7a3cf0 55%, #6534ea 100%);
  --sans: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif; --mono: "Geist Mono", ui-monospace, Menlo, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #151417; --panel: #1d1c20; --ink: #efedf2; --ink-2: #a3a0a9; --line: rgba(239, 237, 242, 0.1); --seg: #29282d; --accent: #a77bf6; color-scheme: dark; } }
:root[data-theme="dark"] { --bg: #151417; --panel: #1d1c20; --ink: #efedf2; --ink-2: #a3a0a9; --line: rgba(239, 237, 242, 0.1); --seg: #29282d; --accent: #a77bf6; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--sans); font-size: 15px; line-height: 22px; -webkit-font-smoothing: antialiased; }
.wrap { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; padding-block: 32px 56px;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
header .t { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
h1 { margin: 0; font-size: 28px; line-height: 34px; font-weight: 600; letter-spacing: -0.02em; text-wrap: balance; }
header p { margin: 0; color: var(--ink-2); max-width: 62ch; } header p b { color: var(--ink); font-weight: 500; }
.seg { display: inline-flex; gap: 2px; padding: 3px; border-radius: 11px; background: var(--seg); }
.seg button { border: 0; background: none; color: var(--ink-2); font: 500 14px/1 var(--sans); height: 34px; padding: 0 14px; border-radius: 8px; cursor: pointer; }
.seg button[aria-pressed="true"] { background: var(--panel); color: var(--ink); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08); }
.seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.viewer { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); background: var(--panel); }
.viewer img { display: block; width: 100%; height: auto; max-width: 100%; user-select: none; -webkit-user-drag: none; }
.stack { position: relative; aspect-ratio: ${W} / ${H}; max-width: 100%; }
.stack img { position: absolute; inset: 0; width: 100%; height: 100%; }
.stack .after { clip-path: inset(0 0 0 var(--cut, 50%)); }
.divider { position: absolute; top: 0; bottom: 0; left: var(--cut, 50%); width: 3px; margin-left: -1.5px; background: #fff; box-shadow: 0 0 14px rgba(20, 10, 50, 0.35); pointer-events: none; }
.knob { position: absolute; top: 50%; left: var(--cut, 50%); width: 48px; height: 48px; margin: -24px 0 0 -24px; border-radius: 50%; display: grid; place-items: center; background: #fff; color: #7a3cf0; pointer-events: none; box-shadow: 0 6px 18px -4px rgba(20, 10, 50, 0.4), 0 0 0 4px rgba(138, 67, 234, 0.22); }
.range:focus-visible ~ .knob { outline: 2px solid var(--accent); outline-offset: 3px; }
.knob svg { width: 22px; height: 22px; }
.range { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: ew-resize; touch-action: pan-y; z-index: 2; }
.tag { position: absolute; top: 12px; height: 28px; padding: 0 12px; border-radius: 8px; display: flex; align-items: center; font-size: 13px; font-weight: 600; color: #fff; pointer-events: none; }
.tag.b { left: 12px; background: #18171b; } .tag.a { right: 12px; background: var(--pill); }
.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.duo figure { margin: 0; position: relative; border-radius: 14px; overflow: hidden; border: 1px solid var(--line); min-width: 0; }
.duo img { display: block; width: 100%; height: auto; }
.hint { margin: -12px 0 0; color: var(--ink-2); font-size: 13px; }
.notes { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 24px; align-items: start; }
.notes h2 { margin: 0 0 12px; font-size: 13px; line-height: 18px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-2); }
.steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; border-top: 1px solid var(--line); }
.steps li { display: grid; grid-template-columns: 112px 36px minmax(0, 1fr); gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.steps b { font-weight: 500; } .steps .n { font: 500 13px/22px var(--mono); color: var(--ink-2); text-align: right; font-variant-numeric: tabular-nums; } .steps span:last-child { color: var(--ink-2); }
.card { background: var(--panel); border: 1px solid var(--line); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.card p { margin: 0; color: var(--ink-2); }
.card .row { display: flex; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
.card .row span:last-child { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.badge { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px 0 4px; border-radius: 15px; color: #fff; font-size: 13px; font-weight: 500; background: var(--pill); }
.badge i { width: 22px; height: 22px; border-radius: 50%; background: #fff; display: grid; place-items: center; font-style: normal; color: #7a3cf0; font-weight: 700; font-size: 13px; }
@media (max-width: 760px) { .notes, .duo { grid-template-columns: 1fr; } .steps li { grid-template-columns: 96px 32px minmax(0, 1fr); } }
</style>

<div class="wrap">
  <header>
    <div class="t">
      <h1>${title}</h1>
      <p>${line}, unslopped with <b>limora-unslop</b>. Same content, new pictures drawn with Limora AI.</p>
    </div>
    <div class="seg" role="group" aria-label="View">
      <button type="button" id="v-compare" data-view="compare" aria-pressed="true">Compare</button>
      <button type="button" id="v-before" data-view="before" aria-pressed="false">Before</button>
      <button type="button" id="v-after" data-view="after" aria-pressed="false">After</button>
      <button type="button" id="v-duo" data-view="duo" aria-pressed="false">Side by side</button>
    </div>
  </header>
  <section id="compare" class="viewer">
    <div class="stack" id="stack">
      <img src="before.${ext}" alt="Before">
      <img class="after" src="after.${ext}" alt="After">
      <div class="divider"></div>
      <input class="range" id="cut" type="range" min="0" max="100" value="50" step="0.5" aria-label="Drag to compare before and after">
      <div class="knob"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 7-5 5 5 5M15 7l5 5-5 5"/></svg></div>
      <span class="tag b">Before</span><span class="tag a">After</span>
    </div>
  </section>
  <p class="hint" id="hint">Drag the divider, or use the arrow keys after clicking it.</p>
  <section id="before" class="viewer" hidden><img src="before.${ext}" alt="Before"></section>
  <section id="after" class="viewer" hidden><img src="after.${ext}" alt="After"></section>
  <section id="duo" class="duo" hidden>
    <figure><img src="before.${ext}" alt="Before"><span class="tag b">Before</span></figure>
    <figure><img src="after.${ext}" alt="After"><span class="tag a">After</span></figure>
  </section>
  <div class="notes">
    <section>
      <h2>What changed</h2>
      <ol class="steps">
        ${steps}
      </ol>
    </section>
    <aside class="card">
      <span class="badge"><i>L</i>Drawn with Limora AI</span>
      ${data.limora ? `<p>${esc(data.limora)}</p>` : ""}
      ${images}
    </aside>
  </div>
</div>
<script>
(() => {
  const stack = document.getElementById("stack"), range = document.getElementById("cut");
  const set = (v) => stack.style.setProperty("--cut", v + "%");
  range.addEventListener("input", () => set(range.value)); set(range.value);
  const views = ["compare", "before", "after", "duo"], buttons = [...document.querySelectorAll(".seg button")];
  const show = (view) => {
    views.forEach((v) => { document.getElementById(v).hidden = v !== view; });
    document.getElementById("hint").hidden = view !== "compare";
    buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.view)));
})();
</script>
`;
writeFileSync(path.join(out, "page.html"), body);
writeFileSync(path.join(out, "index.html"), `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important}</style>\n</head>\n<body>\n${body}</body>\n</html>\n`);
console.log(`${path.join(out, "page.html")}  (publish as an artifact with before.${ext} and after.${ext})`);
console.log(`${path.join(out, "index.html")}  (open locally or host anywhere)`);
console.log(`images: ${W}x${H}, ${ext}`);

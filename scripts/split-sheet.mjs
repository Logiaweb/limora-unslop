#!/usr/bin/env node
/**
 * Cuts a sheet of separate objects (an icon set) into one square PNG per object. Free, runs locally.
 *
 *   node split-sheet.mjs <sheet.png> <out-dir> [--names orders,bakes,...] [--count 6] [--size 512] [--pad 0.1] [--tolerance 40]
 *
 * Works on transparent sheets (finds objects by alpha) and on opaque ones (finds pixels that differ from the
 * sheet's border color). Objects come out in reading order: top row first, left to right.
 * Parts of one object that sit close together (a cup and its steam) stay together; raise --merge (default 2%
 * of the sheet's width) if an object gets cut in two, lower it if two objects come out as one.
 * Uses the same Playwright as the video step, so nothing else to install.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { openBrowser, parseArgs, stop } from "./browser.mjs";

const { options, positional } = parseArgs(process.argv.slice(2), new Set(["names", "count", "size", "pad", "tolerance", "merge"]));
const [sheet, outDir] = positional;
if (!sheet || !outDir) stop("usage: node split-sheet.mjs <sheet.png> <out-dir> [--names a,b,c] [--count 6] [--size 512] [--pad 0.1]");
const names = options.names ? String(options.names).split(",").map((s) => s.trim()).filter(Boolean) : null;
const want = Number(options.count || (names ? names.length : 0)) || null;

const ext = path.extname(sheet).slice(1).toLowerCase().replace("jpg", "jpeg");
const dataUrl = `data:image/${ext || "png"};base64,${readFileSync(sheet).toString("base64")}`;

const browser = await openBrowser();
const page = await browser.newPage();
const result = await page.evaluate(async ({ dataUrl, size, pad, tolerance, merge }) => {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const c = new OffscreenCanvas(W, H), x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const px = x.getImageData(0, 0, W, H).data;

  // Transparent sheet? Look at the border.
  let clear = 0, border = 0;
  const rs = [], gs = [], bs = [];
  const visit = (i) => { border++; if (px[i + 3] < 250) clear++; rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); };
  for (let i = 0; i < W; i += 2) { visit(i * 4); visit(((H - 1) * W + i) * 4); }
  for (let j = 0; j < H; j += 2) { visit(j * W * 4); visit((j * W + W - 1) * 4); }
  const alphaMode = clear / border > 0.5;
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  const bg = [med(rs), med(gs), med(bs)];
  const ink = (i) => alphaMode ? px[i + 3] > 24
    : Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > tolerance;

  // Mark cells of a coarse grid that hold ink, then grow them so nearby parts join.
  const cell = Math.max(2, Math.round(W / 512)), gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
  const hit = new Uint8Array(gw * gh);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (ink((j * W + i) * 4)) hit[((j / cell) | 0) * gw + ((i / cell) | 0)] = 1;
  const grow = Math.max(1, Math.round((W * merge) / cell));
  const near = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (hit[j * gw + i])
    for (let dj = -grow; dj <= grow; dj++) for (let di = -grow; di <= grow; di++) {
      const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < gw && b < gh) near[b * gw + a] = 1;
    }

  // Connected groups -> boxes, measured on the real (un-grown) ink.
  const label = new Int32Array(gw * gh).fill(-1), boxes = [];
  for (let s = 0; s < gw * gh; s++) {
    if (!near[s] || label[s] >= 0) continue;
    const box = { x0: Infinity, y0: Infinity, x1: -1, y1: -1, n: 0 }, stack = [s];
    label[s] = boxes.length;
    while (stack.length) {
      const k = stack.pop(), i = k % gw, j = (k / gw) | 0;
      if (hit[k]) { box.x0 = Math.min(box.x0, i); box.y0 = Math.min(box.y0, j); box.x1 = Math.max(box.x1, i); box.y1 = Math.max(box.y1, j); box.n++; }
      for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
        if (a < 0 || b < 0 || a >= gw || b >= gh) continue;
        const q = b * gw + a; if (near[q] && label[q] < 0) { label[q] = boxes.length; stack.push(q); }
      }
    }
    if (box.n) boxes.push(box);
  }
  const biggest = Math.max(...boxes.map((b) => b.n));
  let found = boxes.filter((b) => b.n > biggest * 0.04).map((b) => ({
    x: b.x0 * cell, y: b.y0 * cell, w: Math.min(W, (b.x1 + 1) * cell) - b.x0 * cell, h: Math.min(H, (b.y1 + 1) * cell) - b.y0 * cell,
  }));

  // Reading order: group into rows by vertical center, then left to right.
  const avgH = found.reduce((s, b) => s + b.h, 0) / (found.length || 1);
  found.sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2));
  const rows = [];
  for (const b of found) {
    const row = rows.find((r) => Math.abs(r.cy - (b.y + b.h / 2)) < avgH * 0.5);
    if (row) row.items.push(b); else rows.push({ cy: b.y + b.h / 2, items: [b] });
  }
  found = rows.flatMap((r) => r.items.sort((a, b) => a.x - b.x));

  // Square crops with padding, centered.
  const files = found.map((b) => {
    const side = Math.max(b.w, b.h) * (1 + 2 * pad);
    const out = new OffscreenCanvas(size, size), o = out.getContext("2d");
    if (!alphaMode) { o.fillStyle = `rgb(${bg.join(",")})`; o.fillRect(0, 0, size, size); }
    const k = size / side;
    o.drawImage(c, b.x, b.y, b.w, b.h, (size - b.w * k) / 2, (size - b.h * k) / 2, b.w * k, b.h * k);
    return out.convertToBlob({ type: "image/png" }).then((blob) => blob.arrayBuffer()).then((buf) => Array.from(new Uint8Array(buf)));
  });
  return { alphaMode, bg, boxes: found, files: await Promise.all(files) };
}, { dataUrl, size: Number(options.size || 512), pad: Number(options.pad ?? 0.1), tolerance: Number(options.tolerance || 40), merge: Number(options.merge ?? 0.02) });
await browser.close();

mkdirSync(outDir, { recursive: true });
const n = result.files.length;
console.log(`${n} objects found on a ${result.alphaMode ? "transparent" : `rgb(${result.bg.join(", ")})`} sheet`);
if (want && n !== want) console.log(`Warning: expected ${want}. Two objects may touch (lower --merge) or one is in pieces (raise --merge). Check the files.`);
result.files.forEach((bytes, i) => {
  const name = (names && names[i]) || `icon-${i + 1}`;
  const file = path.join(outDir, `${name}.png`);
  writeFileSync(file, Buffer.from(bytes));
  const b = result.boxes[i];
  console.log(`${file}  (${Math.round(b.w)}x${Math.round(b.h)} at ${Math.round(b.x)},${Math.round(b.y)})`);
});

#!/usr/bin/env node
/**
 * Cuts a sheet of separate objects (an icon set) into one square PNG per object. Free, local, plain Node:
 * nothing to install.
 *
 *   node split-sheet.mjs <sheet.png> <out-dir> [--names orders,bakes,...] [--count 6] [--size 512] [--pad 0.1]
 *
 * Finds objects by transparency, or by how far each pixel is from the sheet's border color (--tolerance, 40).
 * Objects come out in reading order: top row first, left to right.
 * Parts of one object that sit close together stay together. How close is --merge, a fraction of the sheet's
 * width between 0.001 and 0.1 (default 0.02). With --count (or --names), the script tries other merge values
 * by itself until it finds that many objects, so you rarely need --merge at all.
 */
import { mkdirSync } from "node:fs";
import * as path from "node:path";
import { parseArgs, stop } from "./cli.mjs";
import { blank, crop, loadImage, paste, resize, savePNG } from "./png.mjs";

const { options, positional } = parseArgs(process.argv.slice(2), new Set(["names", "count", "size", "pad", "tolerance", "merge"]));
const [sheetFile, outDir] = positional;
if (!sheetFile || !outDir) stop("usage: node split-sheet.mjs <sheet.png> <out-dir> [--names a,b,c] [--count 6] [--size 512] [--pad 0.1] [--merge 0.02]");
const names = options.names ? String(options.names).split(",").map((s) => s.trim()).filter(Boolean) : null;
const want = Number(options.count || (names ? names.length : 0)) || null;
const size = Number(options.size || 512), pad = Number(options.pad ?? 0.1), tolerance = Number(options.tolerance || 40);
const userMerge = options.merge !== undefined ? Number(options.merge) : null;
if (userMerge !== null && !(userMerge >= 0.001 && userMerge <= 0.1))
  stop(`--merge is a fraction of the sheet's width, between 0.001 and 0.1 (default 0.02). You passed ${options.merge}.`);

const img = loadImage(sheetFile);
const { width: W, height: H, data: px } = img;

// Transparent sheet? Look at the border.
let clear = 0, border = 0;
const rs = [], gs = [], bs = [];
const visit = (i) => { border++; if (px[i + 3] < 250) clear++; rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); };
for (let x = 0; x < W; x += 2) { visit(x * 4); visit(((H - 1) * W + x) * 4); }
for (let y = 0; y < H; y += 2) { visit(y * W * 4); visit((y * W + W - 1) * 4); }
const alphaMode = clear / border > 0.5;
const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const bg = [med(rs), med(gs), med(bs)];

// Coarse grid of cells that hold ink.
const cell = Math.max(2, Math.round(W / 512)), gw = Math.ceil(W / cell), gh = Math.ceil(H / cell);
const hit = new Uint8Array(gw * gh);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4;
  const ink = alphaMode ? px[i + 3] > 24 : Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2]) > tolerance;
  if (ink) hit[((y / cell) | 0) * gw + ((x / cell) | 0)] = 1;
}
// Summed-area table: "any ink within the merge distance" becomes one lookup per cell, whatever the distance.
const sat = new Int32Array((gw + 1) * (gh + 1));
for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++)
  sat[(j + 1) * (gw + 1) + i + 1] = hit[j * gw + i] + sat[j * (gw + 1) + i + 1] + sat[(j + 1) * (gw + 1) + i] - sat[j * (gw + 1) + i];
const inkIn = (x0, y0, x1, y1) => sat[y1 * (gw + 1) + x1] - sat[y0 * (gw + 1) + x1] - sat[y1 * (gw + 1) + x0] + sat[y0 * (gw + 1) + x0];

function findObjects(merge) {
  const grow = Math.max(1, Math.round((W * merge) / cell));
  const near = new Uint8Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++)
    near[j * gw + i] = inkIn(Math.max(0, i - grow), Math.max(0, j - grow), Math.min(gw, i + grow + 1), Math.min(gh, j + grow + 1)) > 0 ? 1 : 0;
  const label = new Int32Array(gw * gh).fill(-1), boxes = [];
  for (let s = 0; s < gw * gh; s++) {
    if (!near[s] || label[s] >= 0) continue;
    const box = { x0: Infinity, y0: Infinity, x1: -1, y1: -1, n: 0 }, stack = [s];
    label[s] = boxes.length;
    while (stack.length) {
      const k = stack.pop(), i = k % gw, j = (k / gw) | 0;
      if (hit[k]) { box.x0 = Math.min(box.x0, i); box.y0 = Math.min(box.y0, j); box.x1 = Math.max(box.x1, i); box.y1 = Math.max(box.y1, j); box.n++; }
      if (i + 1 < gw && near[k + 1] && label[k + 1] < 0) { label[k + 1] = label[s]; stack.push(k + 1); }
      if (i > 0 && near[k - 1] && label[k - 1] < 0) { label[k - 1] = label[s]; stack.push(k - 1); }
      if (j + 1 < gh && near[k + gw] && label[k + gw] < 0) { label[k + gw] = label[s]; stack.push(k + gw); }
      if (j > 0 && near[k - gw] && label[k - gw] < 0) { label[k - gw] = label[s]; stack.push(k - gw); }
    }
    if (box.n) boxes.push(box);
  }
  const biggest = Math.max(0, ...boxes.map((b) => b.n));
  return boxes.filter((b) => b.n > biggest * 0.04).map((b) => ({
    x: b.x0 * cell, y: b.y0 * cell, w: Math.min(W, (b.x1 + 1) * cell) - b.x0 * cell, h: Math.min(H, (b.y1 + 1) * cell) - b.y0 * cell,
  }));
}

// Pick the merge distance: the user's, else the default, else search for one that gives the wanted count.
let merge = userMerge ?? 0.02, found = findObjects(merge);
if (want && found.length !== want && userMerge === null) {
  for (const m of [0.015, 0.012, 0.01, 0.008, 0.006, 0.004, 0.003, 0.002, 0.025, 0.03, 0.04, 0.05, 0.07]) {
    const tryFound = findObjects(m);
    if (tryFound.length === want) { merge = m; found = tryFound; console.log(`--merge ${m} gives ${want} objects (the default 0.02 didn't)`); break; }
  }
}

// Reading order: group into rows by vertical center, then left to right.
const avgH = found.reduce((s, b) => s + b.h, 0) / (found.length || 1);
found.sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2));
const rows = [];
for (const b of found) {
  const row = rows.find((r) => Math.abs(r.cy - (b.y + b.h / 2)) < avgH * 0.5);
  if (row) row.items.push(b); else rows.push({ cy: b.y + b.h / 2, items: [b] });
}
found = rows.flatMap((r) => r.items.sort((a, b) => a.x - b.x));

mkdirSync(outDir, { recursive: true });
console.log(`${found.length} objects found on a ${alphaMode ? "transparent" : `rgb(${bg.join(", ")})`} sheet (merge ${merge})`);
if (want && found.length !== want)
  console.log(`Warning: expected ${want}. No merge value between 0.002 and 0.07 gave ${want}; objects may touch on the sheet. Check the files.`);
found.forEach((b, i) => {
  const side = Math.max(b.w, b.h) * (1 + 2 * pad), k = size / side;
  const piece = resize(crop(img, b.x, b.y, b.w, b.h), Math.max(1, Math.round(b.w * k)), Math.max(1, Math.round(b.h * k)));
  const tile = blank(size, size, alphaMode ? [0, 0, 0, 0] : [...bg, 255]);
  paste(tile, piece, Math.round((size - piece.width) / 2), Math.round((size - piece.height) / 2));
  const file = path.join(outDir, `${(names && names[i]) || `icon-${i + 1}`}.png`);
  savePNG(file, tile);
  console.log(`${file}  (${b.w}x${b.h} at ${b.x},${b.y})`);
});

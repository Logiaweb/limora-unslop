#!/usr/bin/env node
/**
 * Prints the real color of one side of an image, so the page background matches the banner exactly.
 * Image models drift from the hex in the prompt, so always use this value, never the one you asked for.
 *
 *   node sample-color.mjs <banner.png> [--side left|right|top|bottom] [--depth 0.15]
 *
 * It reads a strip along that side (15% deep by default, skipping the outer 2%), takes the median color,
 * and says how flat the strip is. Under 90% "within 6" means the side isn't flat: a seam may show.
 */
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { openBrowser, parseArgs, stop } from "./browser.mjs";

const { options, positional } = parseArgs(process.argv.slice(2), new Set(["side", "depth"]));
const [file] = positional;
if (!file) stop("usage: node sample-color.mjs <image> [--side left|right|top|bottom] [--depth 0.15]");
const side = String(options.side || "left"), depth = Number(options.depth || 0.15);
if (!["left", "right", "top", "bottom"].includes(side)) stop("--side must be left, right, top or bottom");

const ext = path.extname(file).slice(1).toLowerCase().replace("jpg", "jpeg");
const dataUrl = `data:image/${ext || "png"};base64,${readFileSync(file).toString("base64")}`;
const browser = await openBrowser();
const page = await browser.newPage();
const r = await page.evaluate(async ({ dataUrl, side, depth }) => {
  const img = new Image(); img.src = dataUrl; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, c = new OffscreenCanvas(W, H), x = c.getContext("2d");
  x.drawImage(img, 0, 0);
  const m = 0.02, d = depth;
  const box = { left: [m, m, d, 1 - 2 * m], right: [1 - m - d, m, d, 1 - 2 * m], top: [m, m, 1 - 2 * m, d], bottom: [m, 1 - m - d, 1 - 2 * m, d] }[side];
  const [bx, by, bw, bh] = [box[0] * W, box[1] * H, box[2] * W, box[3] * H].map(Math.round);
  const px = x.getImageData(bx, by, bw, bh).data, R = [], G = [], B = [];
  for (let i = 0; i < px.length; i += 4) { R.push(px[i]); G.push(px[i + 1]); B.push(px[i + 2]); }
  const med = (a) => [...a].sort((p, q) => p - q)[a.length >> 1];
  const c0 = [med(R), med(G), med(B)];
  let close = 0;
  for (let i = 0; i < R.length; i++) if (Math.max(Math.abs(R[i] - c0[0]), Math.abs(G[i] - c0[1]), Math.abs(B[i] - c0[2])) <= 6) close++;
  return { c0, flat: close / R.length };
}, { dataUrl, side, depth });
await browser.close();
const hex = "#" + r.c0.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
console.log(`${hex}  (${side} ${Math.round(depth * 100)}% strip, ${Math.round(r.flat * 100)}% of pixels within 6 of it)`);
if (r.flat < 0.9) console.log("The strip isn't flat. Use this hex, and expect a slight seam; a soft fade on the image edge can hide it.");

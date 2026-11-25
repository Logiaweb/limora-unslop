#!/usr/bin/env node
/**
 * Prints the real color of one side of an image, so the page background matches the hero. Plain Node.
 * Image models drift from the hex in the prompt, so always use this value, never the one you asked for.
 *
 *   node sample-color.mjs <hero.png> [--side left|right|top|bottom] [--depth 0.15]
 *
 * It reads a strip along that side (15% deep by default, skipping the outer 2%), takes the median color and
 * says how flat the strip is. Flat (90%+ within 6): set the background to the hex and the seam disappears.
 * Not flat (a photo, a sky gradient): no single hex can match it, so fade the image into the page instead.
 */
import { parseArgs, stop } from "./cli.mjs";
import { loadImage } from "./png.mjs";

const { options, positional } = parseArgs(process.argv.slice(2), new Set(["side", "depth"]));
const [file] = positional;
if (!file) stop("usage: node sample-color.mjs <image> [--side left|right|top|bottom] [--depth 0.15]");
const side = String(options.side || "left"), depth = Number(options.depth || 0.15);
if (!["left", "right", "top", "bottom"].includes(side)) stop("--side must be left, right, top or bottom");
if (!(depth > 0 && depth <= 0.5)) stop("--depth is a fraction of the image, between 0.01 and 0.5 (default 0.15)");

const { width: W, height: H, data } = loadImage(file);
const m = 0.02;
const [fx, fy, fw, fh] = { left: [m, m, depth, 1 - 2 * m], right: [1 - m - depth, m, depth, 1 - 2 * m], top: [m, m, 1 - 2 * m, depth], bottom: [m, 1 - m - depth, 1 - 2 * m, depth] }[side];
const x0 = Math.round(fx * W), y0 = Math.round(fy * H), x1 = x0 + Math.round(fw * W), y1 = y0 + Math.round(fh * H);
const R = [], G = [], B = [];
for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const o = (y * W + x) * 4; R.push(data[o]); G.push(data[o + 1]); B.push(data[o + 2]); }
const med = (a) => [...a].sort((p, q) => p - q)[a.length >> 1];
const c = [med(R), med(G), med(B)];
let close = 0;
for (let i = 0; i < R.length; i++) if (Math.max(Math.abs(R[i] - c[0]), Math.abs(G[i] - c[1]), Math.abs(B[i] - c[2])) <= 6) close++;
const flat = close / R.length, hex = "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
console.log(`${hex}  (${side} ${Math.round(depth * 100)}% strip, ${Math.round(flat * 100)}% of pixels within 6 of it)`);
if (flat < 0.9) {
  const to = { left: "right", right: "left", top: "bottom", bottom: "top" }[side];
  console.log(`Not flat (a photo or a gradient), so a seam will show. Set the background to ${hex} and fade the image's ${side} edge into it:`);
  console.log(`  mask-image: linear-gradient(to ${to}, transparent 0, #000 25%);   /* on the <img>, plus -webkit-mask-image */`);
}

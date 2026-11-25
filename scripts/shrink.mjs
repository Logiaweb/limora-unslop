#!/usr/bin/env node
/**
 * Shrinks Limora's full-size PNGs (4 to 7 MB each) to web sizes. Plain Node, nothing to install.
 *
 *   node shrink.mjs <image.png ...> --out-dir <dir> [--max 1600] [--quality 82]
 *
 * Each image is resized so its long edge is at most --max pixels (never enlarged), then written as WebP when
 * `cwebp` is on the machine (brew install webp), otherwise as an optimized PNG. Suggested --max: icons 512,
 * cards and step pictures 1200, a full-width hero 2400. The originals are left untouched.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { parseArgs, stop } from "./cli.mjs";
import { loadImage, resize, savePNG } from "./png.mjs";

const { options, positional } = parseArgs(process.argv.slice(2), new Set(["out-dir", "max", "quality"]));
if (!positional.length || !options["out-dir"]) stop("usage: node shrink.mjs <image.png ...> --out-dir <dir> [--max 1600] [--quality 82]");
const outDir = path.resolve(options["out-dir"]), max = Number(options.max || 1600), quality = Number(options.quality || 82);
mkdirSync(outDir, { recursive: true });
let webp = true;
try { execFileSync("cwebp", ["-version"], { stdio: "ignore" }); } catch { webp = false; }
if (!webp) console.log("cwebp not found, writing PNG (WebP is 3-5x smaller: brew install webp)");

const kb = (n) => `${Math.round(n / 1024)} KB`;
let before = 0, after = 0;
for (const file of positional) {
  const img = loadImage(file), k = Math.min(1, max / Math.max(img.width, img.height));
  const small = k < 1 ? resize(img, Math.round(img.width * k), Math.round(img.height * k)) : img;
  const name = path.basename(file, path.extname(file));
  let out;
  if (webp) {
    const tmp = path.join(tmpdir(), `lu-shrink-${process.pid}-${name}.png`);
    savePNG(tmp, small);
    out = path.join(outDir, `${name}.webp`);
    execFileSync("cwebp", ["-quiet", "-q", String(quality), "-alpha_q", "90", tmp, "-o", out]);
    rmSync(tmp, { force: true });
  } else {
    out = path.join(outDir, `${name}.png`);
    savePNG(out, small);
  }
  const a = statSync(file).size, b = statSync(out).size;
  before += a; after += b;
  console.log(`${out}  ${small.width}x${small.height}, ${kb(a)} -> ${kb(b)}`);
}
console.log(`total ${kb(before)} -> ${kb(after)}`);

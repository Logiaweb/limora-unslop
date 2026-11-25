#!/usr/bin/env node
/**
 * limora-unslop reel renderer.
 *
 *   node render.mjs <reel.html> <out.mp4>   [--size 1440x1080] [--fps 60] [--scale 2] [--mute]
 *   node render.mjs <reel.html> --stills auto --sheet     key moments as PNGs plus one contact sheet (temp folder)
 *   node render.mjs <reel.html> --stills 1,6.5,12 [--out-dir dir] [--sheet]
 *   node render.mjs <reel.html> --play                    opens a window and plays the reel
 *   node render.mjs <reel.html> <out.mp4> --remix <old.mp4>   redo only the sound on a finished video
 *
 * Stills render at --scale 1 unless you pass --scale; videos at 2 (sharper, slower).
 * Requirements: the Playwright package with a Chromium build, and ffmpeg on the PATH for videos.
 * PLAYWRIGHT_DIR=<folder with node_modules> reuses a Playwright that is already installed elsewhere.
 *
 * Frames are streamed straight into ffmpeg. Sound effects come from video/sounds (CC0, credited in the README);
 * the ones without a file there are synthesized by ffmpeg.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { openBrowser, parseArgs, stop } from "../scripts/browser.mjs";

const SKILL_VIDEO_DIR = path.dirname(fileURLToPath(import.meta.url));
const TAKES_VALUE = new Set(["size", "fps", "scale", "stills", "remix", "out-dir"]);
const TARGET = [15, 25]; // seconds; a social post should land in this range

function ffmpegReady() { return spawnSync("ffmpeg", ["-hide_banner", "-version"]).status === 0; }

function run(cmd, args, input) {
  const out = spawnSync(cmd, args, { input, stdio: [input ? "pipe" : "ignore", "ignore", "pipe"] });
  if (out.status !== 0) stop(`${cmd} failed:\n${out.stderr}`);
}

// Sound for each cue: a CC0 file from video/sounds when there is one, otherwise an ffmpeg-made tone.
// gain balances the files against each other.
const SOUNDS = {
  tick: { file: "switch.wav", gain: 0.45 },
  sweep: { file: "whoosh.wav", gain: 0.6 },
  click: { file: "click.wav", gain: 1.0 },
  reveal: { file: "page-turn.wav", gain: 0.6 },
  pop: { synth: "aevalsrc=0.6*sin(2*PI*(420+1900*t)*t)*exp(-t*24):d=0.2", gain: 0.5 },
  ding: { synth: "aevalsrc=0.3*(sin(2*PI*1318.5*t)+0.55*sin(2*PI*1975.5*t))*exp(-t*4.5):d=1.3", gain: 0.5 },
};

function addSound(videoIn, videoOut, cues, scratch) {
  const names = [...new Set(cues.map((c) => c.sound))];
  const source = {};
  for (const n of names) {
    const own = SOUNDS[n].file && path.join(SKILL_VIDEO_DIR, "sounds", SOUNDS[n].file);
    if (own && existsSync(own)) { source[n] = own; continue; }
    source[n] = path.join(scratch, `${n}.wav`);
    run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", SOUNDS[n].synth || "anullsrc=d=0.1", "-ar", "48000", "-ac", "2", source[n]]);
  }
  const inputs = cues.flatMap((c) => ["-i", source[c.sound]]);
  const chains = cues.map((c, i) => {
    const delay = Math.round(c.t * 1000);
    return `[${i + 1}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${(SOUNDS[c.sound].gain * c.vol).toFixed(3)},adelay=${delay}|${delay}[s${i}]`;
  });
  const mix = `${cues.map((_, i) => `[s${i}]`).join("")}amix=inputs=${cues.length}:normalize=0:dropout_transition=0,alimiter=limit=0.9,apad[aout]`;
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", videoIn, ...inputs, "-filter_complex", [...chains, mix].join(";"),
    "-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", videoOut]);
}

async function main() {
  const { options, positional } = parseArgs(process.argv.slice(2), TAKES_VALUE);
  const [reelFile, outFile] = positional;
  const mode = options.play ? "play" : options.stills ? "stills" : "video";
  if (!reelFile || (mode === "video" && !outFile)) stop("usage: node render.mjs <reel.html> <out.mp4> | --stills 1,5 | --play   (see the top of this file)");
  if (mode === "video" && !ffmpegReady()) stop("The video step needs ffmpeg. On a Mac: brew install ffmpeg");

  const fps = Number(options.fps || 60), scale = Number(options.scale || (mode === "stills" ? 1 : 2));
  const reelSource = readFileSync(path.resolve(reelFile), "utf8");
  if (/\btheme["']?\s*:/.test(reelSource)) console.log('Note: REEL.theme is no longer used (removed in 1.3.1). Every reel renders on the light grey stage; delete the "theme" line from the reel file.');
  const browser = await openBrowser(mode === "play");
  const tab = await browser.newPage({ viewport: { width: 2400, height: 2400 }, deviceScaleFactor: mode === "play" ? 1 : scale });

  const params = new URLSearchParams();
  if (options.size) params.set("size", options.size);
  const url = pathToFileURL(path.resolve(reelFile)).href + (params.size ? `?${params}` : "");
  await tab.goto(url, { waitUntil: "networkidle" });
  await tab.addStyleTag({ content: readFileSync(path.join(SKILL_VIDEO_DIR, "reel.css"), "utf8") });
  await tab.addScriptTag({ content: readFileSync(path.join(SKILL_VIDEO_DIR, "reel.js"), "utf8") });
  const reel = await tab.evaluate(() => window.reel.ready());
  const [width, height] = reel.size;
  await tab.setViewportSize({ width, height });
  console.log(`${width}x${height}, ${reel.duration.toFixed(1)} s, ${reel.cues.length} sounds`);
  if (reel.duration > TARGET[1]) console.log(`Note: ${reel.duration.toFixed(1)} s is long for a post (aim for ${TARGET[0]}-${TARGET[1]} s). Merge steps, set REEL.pace below 1, give steps a shorter hold, or drop the outro.`);

  const seekTo = (seconds) => tab.evaluate((ms) => window.reel.seek(ms), seconds * 1000);

  if (mode === "play") {
    await tab.evaluate(() => window.reel.play());
    console.log("Reel is playing. Shut the window to quit.");
    await tab.waitForEvent("close", { timeout: 0 }).catch(() => {});
    return browser.close();
  }

  if (mode === "stills") {
    const auto = String(options.stills) === "auto";
    const wanted = auto ? reel.marks : String(options.stills).split(",").map((t) => ({ t: Number(t), label: `${t} s` }));
    wanted.sort((a, b) => a.t - b.t);
    const dir = path.resolve(options["out-dir"] || mkdtempSync(path.join(tmpdir(), "limora-unslop-stills-")));
    mkdirSync(dir, { recursive: true });
    const shots = [];
    let f = 0;
    for (const m of wanted) {
      while (f <= Math.round(m.t * fps)) await seekTo(f++ / fps);
      const png = path.join(dir, `still-${m.t.toFixed(1)}s.png`);
      await tab.screenshot({ path: png });
      shots.push({ png, label: `${m.t.toFixed(1)} s · ${m.label}` });
      console.log(png);
    }
    await browser.close();
    if (options.sheet) console.log(await contactSheet(shots, path.join(dir, "sheet.png"), width / height));
    return;
  }

  const scratch = mkdtempSync(path.join(tmpdir(), "limora-unslop-"));
  if (options.remix) {
    await browser.close();
    addSound(path.resolve(options.remix), path.resolve(outFile), reel.cues, scratch);
    rmSync(scratch, { recursive: true, force: true });
    return console.log(`saved ${path.resolve(outFile)} (new sound, same picture)`);
  }
  const silent = path.join(scratch, "picture.mp4");
  const encoder = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-c:v", "png", "-framerate", String(fps), "-i", "-",
    "-vf", `scale=${width}:${height}:flags=lanczos`, "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", silent],
    { stdio: ["pipe", "ignore", "inherit"] });
  const encoded = new Promise((done, fail) => encoder.on("close", (code) => (code === 0 ? done() : fail(new Error("ffmpeg stopped while encoding")))));

  const last = Math.round(reel.duration * fps);
  for (let f = 0; f <= last; f++) {
    await seekTo(f / fps);
    const shot = await tab.screenshot({ type: "png" });
    if (!encoder.stdin.write(shot)) await new Promise((go) => encoder.stdin.once("drain", go));
    if (f % (fps * 5) === 0) console.log(`${Math.round((f / last) * 100)}%`);
  }
  encoder.stdin.end();
  await encoded;
  await browser.close();

  const target = path.resolve(outFile);
  if (options.mute || !reel.cues.length) run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", silent, "-c", "copy", target]);
  else addSound(silent, target, reel.cues, scratch);
  rmSync(scratch, { recursive: true, force: true });
  console.log(`saved ${target}`);
}

// Tiles the stills into one labeled image, so every frame can be checked in a single look.
async function contactSheet(shots, file, ratio) {
  const cols = Math.min(4, Math.ceil(Math.sqrt(shots.length))), tileW = 480, tileH = Math.round(tileW / ratio);
  const browser = await openBrowser();
  const tab = await browser.newPage({ viewport: { width: cols * (tileW + 12) + 12, height: 400 } });
  const tiles = shots.map((s) => `<figure><img src="data:image/png;base64,${readFileSync(s.png).toString("base64")}"><figcaption>${s.label}</figcaption></figure>`).join("");
  await tab.setContent(`<style>body{margin:0;padding:12px;background:#e9e9e6;font:13px system-ui;display:grid;grid-template-columns:repeat(${cols},${tileW}px);gap:12px}
    figure{margin:0}img{display:block;width:${tileW}px;height:${tileH}px;object-fit:cover;border-radius:6px;background:#fff}figcaption{padding:4px 2px;color:#444}</style>${tiles}`);
  await tab.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  await tab.screenshot({ path: file, fullPage: true });
  await browser.close();
  return file;
}

main().catch((err) => stop(err.stack || String(err)));

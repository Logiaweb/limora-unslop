// Minimal PNG reader, writer and resizer in plain Node (zlib only), so the scripts need no install.
// Images are { width, height, data } with data an RGBA Uint8Array.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import zlib from "node:zlib";

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

export function decodePNG(buf) {
  if (!buf.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG file");
  let pos = 8, width = 0, height = 0, depth = 8, type = 6, interlace = 0, palette = null, trns = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), kind = buf.toString("ascii", pos + 4, pos + 8), body = buf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;
    if (kind === "IHDR") { width = body.readUInt32BE(0); height = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (kind === "PLTE") palette = body;
    else if (kind === "tRNS") trns = body;
    else if (kind === "IDAT") idat.push(body);
    else if (kind === "IEND") break;
  }
  if (interlace) throw new Error("interlaced PNGs aren't supported; re-save the file without interlacing");
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  if (!channels) throw new Error(`unsupported PNG color type ${type}`);
  const stride = Math.ceil((width * channels * depth) / 8), bpp = Math.max(1, (channels * depth) >> 3);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const rows = new Uint8Array(stride * height);
  let prev = new Uint8Array(stride), i = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[i++], line = raw.subarray(i, i + stride), cur = rows.subarray(y * stride, (y + 1) * stride);
    i += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
    prev = cur;
  }
  const max = (1 << depth) - 1;
  const sample = (row, index) => {
    if (depth === 8) return row[index];
    if (depth === 16) return row[index * 2];
    const bit = index * depth, byte = row[bit >> 3], shift = 8 - depth - (bit & 7);
    return (byte >> shift) & max;
  };
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const row = rows.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4, s = x * channels;
      if (type === 6) { data[o] = sample(row, s); data[o + 1] = sample(row, s + 1); data[o + 2] = sample(row, s + 2); data[o + 3] = sample(row, s + 3); }
      else if (type === 2) { data[o] = sample(row, s); data[o + 1] = sample(row, s + 1); data[o + 2] = sample(row, s + 2); data[o + 3] = 255; }
      else if (type === 3) { const k = sample(row, s); data[o] = palette[k * 3]; data[o + 1] = palette[k * 3 + 1]; data[o + 2] = palette[k * 3 + 2]; data[o + 3] = trns && k < trns.length ? trns[k] : 255; }
      else {
        let g = sample(row, s); if (depth < 8) g = Math.round((g * 255) / max);
        data[o] = data[o + 1] = data[o + 2] = g;
        data[o + 3] = type === 4 ? sample(row, s + 1) : 255;
      }
    }
  }
  return { width, height, data };
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc32(buf) { let c = -1; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(kind, body) {
  const out = Buffer.alloc(12 + body.length);
  out.writeUInt32BE(body.length, 0); out.write(kind, 4, "ascii"); body.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
  return out;
}

export function encodePNG({ width, height, data }) {
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const o = y * (stride + 1), row = data.subarray(y * stride, (y + 1) * stride), up = y ? data.subarray((y - 1) * stride, y * stride) : null;
    raw[o] = 4; // Paeth filter compresses illustrations well
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? row[x - 4] : 0, b = up ? up[x] : 0, c = up && x >= 4 ? up[x - 4] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      raw[o + 1 + x] = (row[x] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(width, 0); head.writeUInt32BE(height, 4); head[8] = 8; head[9] = 6;
  return Buffer.concat([SIGNATURE, chunk("IHDR", head), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// Reads a PNG directly; other formats (JPEG, WebP) go through sips on macOS or ffmpeg when available.
export function loadImage(file) {
  const buf = readFileSync(file);
  if (buf.subarray(0, 8).equals(SIGNATURE)) return decodePNG(buf);
  const dir = mkdtempSync(path.join(tmpdir(), "lu-img-")), png = path.join(dir, "in.png");
  try {
    for (const [cmd, args] of [["sips", ["-s", "format", "png", file, "--out", png]], ["ffmpeg", ["-v", "error", "-y", "-i", file, png]]]) {
      try { execFileSync(cmd, args, { stdio: "ignore" }); return decodePNG(readFileSync(png)); } catch { /* try the next converter */ }
    }
    throw new Error(`${file} isn't a PNG and neither sips nor ffmpeg could convert it`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

export function savePNG(file, img) { writeFileSync(file, encodePNG(img)); }

export function blank(width, height, rgba = [0, 0, 0, 0]) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
  return { width, height, data };
}

export function crop(img, x, y, w, h) {
  const out = blank(w, h);
  for (let j = 0; j < h; j++) {
    const sy = y + j; if (sy < 0 || sy >= img.height) continue;
    for (let i = 0; i < w; i++) {
      const sx = x + i; if (sx < 0 || sx >= img.width) continue;
      out.data.set(img.data.subarray((sy * img.width + sx) * 4, (sy * img.width + sx) * 4 + 4), (j * w + i) * 4);
    }
  }
  return out;
}

// Area-average for shrinking, bilinear for enlarging. Works on premultiplied alpha so edges stay clean.
export function resize(img, w, h) {
  const out = blank(w, h), sx = img.width / w, sy = img.height / h, src = img.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    if (sx >= 1 && sy >= 1) {
      const x0 = Math.floor(i * sx), x1 = Math.max(x0 + 1, Math.floor((i + 1) * sx)), y0 = Math.floor(j * sy), y1 = Math.max(y0 + 1, Math.floor((j + 1) * sy));
      for (let y = y0; y < y1 && y < img.height; y++) for (let x = x0; x < x1 && x < img.width; x++) {
        const o = (y * img.width + x) * 4, al = src[o + 3];
        r += src[o] * al; g += src[o + 1] * al; b += src[o + 2] * al; a += al; n++;
      }
    } else {
      const fx = Math.max(0, (i + 0.5) * sx - 0.5), fy = Math.max(0, (j + 0.5) * sy - 0.5), x0 = Math.floor(fx), y0 = Math.floor(fy);
      const x1 = Math.min(img.width - 1, x0 + 1), y1 = Math.min(img.height - 1, y0 + 1), tx = fx - x0, ty = fy - y0;
      for (const [x, y, wt] of [[x0, y0, (1 - tx) * (1 - ty)], [x1, y0, tx * (1 - ty)], [x0, y1, (1 - tx) * ty], [x1, y1, tx * ty]]) {
        const o = (y * img.width + x) * 4, al = src[o + 3] * wt;
        r += src[o] * al; g += src[o + 1] * al; b += src[o + 2] * al; a += al; n += wt;
      }
    }
    const o = (j * w + i) * 4;
    if (a > 0) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
    out.data[o + 3] = a / n;
  }
  return out;
}

// Draws src onto dst at (x, y), blending by src alpha.
export function paste(dst, src, x, y) {
  for (let j = 0; j < src.height; j++) {
    const dy = y + j; if (dy < 0 || dy >= dst.height) continue;
    for (let i = 0; i < src.width; i++) {
      const dx = x + i; if (dx < 0 || dx >= dst.width) continue;
      const s = (j * src.width + i) * 4, d = (dy * dst.width + dx) * 4, a = src.data[s + 3] / 255, da = dst.data[d + 3] / 255;
      const oa = a + da * (1 - a);
      for (let c = 0; c < 3; c++) dst.data[d + c] = oa ? (src.data[s + c] * a + dst.data[d + c] * da * (1 - a)) / oa : 0;
      dst.data[d + 3] = oa * 255;
    }
  }
}

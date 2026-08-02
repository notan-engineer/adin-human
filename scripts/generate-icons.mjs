// Generate favicons / app icons from the brand emblem.
//
// Source: public/brand/emblem.png (512x392, transparent bull-head-and-cleavers
// mark). The emblem is designed for dark surfaces, so every icon is flattened
// onto the brand charcoal (#0b0b0d) - otherwise it disappears into light
// browser chrome and light-mode OS launchers.
//
// The full emblem (crossed cleavers spanning the full width) turns to mush
// below ~64px, so every icon uses a square CROP of the bull head only. That
// keeps one consistent mark at 32px and at 512px.
//
// Output lands in /public and IS committed, so the build never needs sharp.
//
// Run: npm run generate:icons
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "public/brand/emblem.png";
const OUT_DIR = "public";

/** Brand charcoal - the background every icon is flattened onto. */
const BG = { r: 0x0b, g: 0x0b, b: 0x0d, alpha: 1 };

/**
 * Square crop around the bull head, as fractions of the source image. The
 * cleavers run off both edges below this box; the head + hat + horns sit inside
 * it. Tuned against public/brand/emblem.png (512x392).
 */
const HEAD_CROP = { left: 0.14, top: 0.0, width: 0.72, height: 0.9 };

/** Fraction of the canvas the mark occupies (the rest is breathing room). */
const INSET = 0.86;

const TARGETS = [
  { file: "favicon-32x32.png", size: 32 },
  { file: "favicon-48x48.png", size: 48 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];

if (!fs.existsSync(SRC)) {
  console.error(`MISSING source emblem: ${SRC}`);
  process.exit(1);
}

const meta = await sharp(SRC).metadata();
const W = meta.width ?? 512;
const H = meta.height ?? 392;

// Resolve the fractional crop to integer pixels, clamped to the image bounds.
const cropW = Math.round(HEAD_CROP.width * W);
const cropH = Math.round(HEAD_CROP.height * H);
const side = Math.min(cropW, cropH, W, H);
const left = Math.max(0, Math.min(W - side, Math.round(HEAD_CROP.left * W)));
const top = Math.max(0, Math.min(H - side, Math.round(HEAD_CROP.top * H)));

/** The square head crop, still transparent, as a reusable PNG buffer. */
const head = await sharp(SRC)
  .extract({ left, top, width: side, height: side })
  .png()
  .toBuffer();

/** Render the mark at `size`, inset on a solid charcoal square. */
async function renderIcon(size) {
  const inner = Math.round(size * INSET);
  const mark = await sharp(head)
    .resize(inner, inner, { fit: "contain", background: { ...BG, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9, effort: 8 })
    .toBuffer();
}

/**
 * Wrap a PNG in a single-image ICO container. Every browser since IE11 reads
 * PNG-compressed ICO entries, and sharp cannot write .ico itself.
 */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 means 256)
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // payload size
  entry.writeUInt32LE(header.length + entry.length, 12); // payload offset

  return Buffer.concat([header, entry, png]);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const target of TARGETS) {
  const buf = await renderIcon(target.size);
  const out = path.join(OUT_DIR, target.file);
  fs.writeFileSync(out, buf);
  console.log(`✓ ${out}  ${target.size}x${target.size}`);
}

// /favicon.ico is still requested by crawlers and older browsers that ignore
// the <link rel="icon"> tags, so ship a real one at the root.
const ico = pngToIco(await renderIcon(32), 32);
fs.writeFileSync(path.join(OUT_DIR, "favicon.ico"), ico);
console.log(`✓ ${path.join(OUT_DIR, "favicon.ico")}  32x32 (PNG-in-ICO)`);

console.log(`\nDone → ${TARGETS.length + 1} icons from ${SRC}`);

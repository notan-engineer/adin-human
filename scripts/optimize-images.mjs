// Build web-optimized derivatives (AVIF + WebP + a fallback) from the heavy raw
// brand renders in design-resources/ (gitignored). Output lands in /public and is
// committed, so the Docker/next build never needs sharp or the raw masters.
//
// Run: npm run optimize:images
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_ROOT = "design-resources/The heuman chef";

/** src is relative to SRC_ROOT; out is a path under the repo (no extension). */
const MANIFEST = [
  // Smoker scene
  { src: "תמונות/grunge-dark-interior-with-smoky-atmosphere.jpg", out: "public/smoker/interior", width: 1600 },
  { src: "לוגו/symbol2.png", out: "public/brand/emblem", width: 512 },
  // Product pouch renders (portrait, transparent)
  { src: "הדמיות/שום.png", out: "public/products/garlic/pouch", width: 900 },
  { src: "הדמיות/ברביקיו.png", out: "public/products/bbq/pouch", width: 900 },
  { src: "הדמיות/דבש.png", out: "public/products/honey/pouch", width: 900 },
  { src: "הדמיות/מייפל.png", out: "public/products/maple/pouch", width: 900 },
  { src: "הדמיות/זעתר.png", out: "public/products/zaatar/pouch", width: 900 },
  { src: "הדמיות/קיסמים2.png", out: "public/products/skewers/pouch", width: 1200 },
  // Group shot (marketing)
  { src: "הדמיות/הדמיה של כולן.png", out: "public/products/group", width: 1600 },
];

const dims = {};
let done = 0;

for (const item of MANIFEST) {
  const input = path.join(SRC_ROOT, item.src);
  if (!fs.existsSync(input)) {
    console.warn("MISSING (skipped):", input);
    continue;
  }
  fs.mkdirSync(path.dirname(item.out), { recursive: true });

  const meta = await sharp(input).metadata();
  const width = Math.min(item.width, meta.width ?? item.width);
  const pipe = sharp(input).resize({ width, withoutEnlargement: true });

  await pipe.clone().avif({ quality: 60 }).toFile(`${item.out}.avif`);
  await pipe.clone().webp({ quality: 82 }).toFile(`${item.out}.webp`);

  const hasAlpha = Boolean(meta.hasAlpha);
  const fallback = hasAlpha ? "png" : "jpg";
  if (hasAlpha) {
    await pipe.clone().png({ compressionLevel: 9, effort: 7 }).toFile(`${item.out}.png`);
  } else {
    await pipe.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(`${item.out}.jpg`);
  }

  const h = Math.round((width / (meta.width ?? width)) * (meta.height ?? width));
  const key = item.out.replace(/^public/, "");
  dims[key] = { w: width, h, fallback };
  done += 1;
  console.log(`✓ ${item.out}  ${width}x${h}  (${fallback} fallback)`);
}

fs.writeFileSync("public/_image-dimensions.json", JSON.stringify(dims, null, 2));
console.log(`\nDone → ${done} images. Dimensions → public/_image-dimensions.json`);

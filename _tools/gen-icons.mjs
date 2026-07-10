// One-off asset pipeline: derives PWA icons from the supplied emblem.
// Preserves the logo's aspect ratio and colours (contain fit, brand-black pad).
// Re-run after swapping the source emblem: `node _tools/gen-icons.mjs`
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "assets");
const SRC = join(assets, "quiet-few-emblem.png"); // supplied emblem (1536² JPEG bytes)
const BLACK = "#050504"; // brand deep black

// Square icon: emblem contained on brand black (logo untouched, never cropped).
async function square(size, file, scale = 1) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: BLACK })
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 3, background: BLACK },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(join(assets, file));
  console.log("wrote", file, `${size}px`);
}

await square(192, "icon-192.png", 1);
await square(512, "icon-512.png", 1);
// Maskable: 80% safe zone so the OS circle/squircle crop only eats the black pad.
await square(512, "icon-maskable-512.png", 0.8);
await square(180, "apple-touch-icon.png", 1);
await square(32, "favicon-32.png", 1);
await square(16, "favicon-16.png", 1);
console.log("done");

// Genera los iconos del PWA a partir de un SVG, usando sharp.
// Ejecuta:  npm run icons
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");

// Chip de poker verde con una pica (♠) blanca en el centro.
function svg({ padding = 0 } = {}) {
  const s = 512;
  const r = (s / 2) * (1 - padding); // radio del chip respecto al centro
  const c = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <radialGradient id="felt" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#1f9d57"/>
      <stop offset="100%" stop-color="#0c6b39"/>
    </radialGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="#0a0f0c"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="url(#felt)"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="0.9" stroke-width="${r * 0.10}" stroke-dasharray="${r * 0.42} ${r * 0.42}"/>
  <circle cx="${c}" cy="${c}" r="${r * 0.72}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="${r * 0.04}"/>
  <g transform="translate(${c}, ${c})" fill="#ffffff">
    <path transform="translate(0,-18) scale(0.95)" d="M0,-150 C70,-70 150,-40 150,30 C150,80 110,118 64,118 C40,118 18,108 6,90 C14,128 30,150 54,168 L-54,168 C-30,150 -14,128 -6,90 C-18,108 -40,118 -64,118 C-110,118 -150,80 -150,30 C-150,-40 -70,-70 0,-150 Z"/>
  </g>
</svg>`;
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const tasks = [
    { name: "icon-192.png", size: 192, padding: 0 },
    { name: "icon-512.png", size: 512, padding: 0 },
    { name: "icon-512-maskable.png", size: 512, padding: 0.14 },
    { name: "apple-touch-icon.png", size: 180, padding: 0.06 },
    { name: "favicon-32.png", size: 32, padding: 0 },
  ];
  for (const t of tasks) {
    await sharp(Buffer.from(svg({ padding: t.padding })))
      .resize(t.size, t.size)
      .png()
      .toFile(join(outDir, t.name));
    console.log("✓", t.name);
  }
  console.log("Iconos generados en public/icons/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

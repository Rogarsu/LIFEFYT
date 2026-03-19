/**
 * Generates PWA icons (192, 512, apple-touch-icon 180)
 * from a clean SVG template using sharp.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

function iconSVG(size) {
  const r = Math.round(size * 0.22)   // corner radius
  const p = Math.round(size * 0.16)   // inner padding

  // LF letters as normalized rects, scaled to `size`
  const s = size
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#ff4433"/>
      <stop offset="100%" stop-color="#c81207"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="#0d1117"/>

  <!-- Red gradient circle glow -->
  <circle cx="${s * 0.5}" cy="${s * 0.46}" r="${s * 0.38}" fill="url(#grad)" opacity="0.18"/>

  <!-- L letter: vertical bar + bottom bar -->
  <rect x="${s*0.13}" y="${s*0.20}" width="${s*0.11}" height="${s*0.57}" rx="${s*0.02}" fill="white"/>
  <rect x="${s*0.13}" y="${s*0.66}" width="${s*0.30}" height="${s*0.11}" rx="${s*0.02}" fill="white"/>

  <!-- F letter: vertical bar + top bar + middle bar -->
  <rect x="${s*0.52}" y="${s*0.20}" width="${s*0.11}" height="${s*0.57}" rx="${s*0.02}" fill="white"/>
  <rect x="${s*0.52}" y="${s*0.20}" width="${s*0.35}" height="${s*0.11}" rx="${s*0.02}" fill="white"/>
  <rect x="${s*0.52}" y="${s*0.43}" width="${s*0.28}" height="${s*0.10}" rx="${s*0.02}" fill="white"/>

  <!-- Red accent dot bottom-right -->
  <circle cx="${s*0.82}" cy="${s*0.82}" r="${s*0.06}" fill="#ff3120" opacity="0.8"/>
</svg>`
}

const sizes = [
  { name: 'icon-192.png',        size: 192 },
  { name: 'icon-512.png',        size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  const svg = iconSVG(size)
  const outPath = join(publicDir, name)
  await sharp(Buffer.from(svg)).png().toFile(outPath)
  console.log(`✓ ${name} (${size}×${size})`)
}
console.log('Done.')

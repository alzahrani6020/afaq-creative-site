// One-off: generates public/assets/og-image.jpg (1200x630) from the brand logo.
// Run: node scripts/generate-og-image.mjs  (requires `npm i --no-save sharp`)
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const logoPath = path.join(dir, '../public/assets/afaq-logo-v4.png');
const outPath = path.join(dir, '../public/assets/og-image.jpg');

const W = 1200;
const H = 630;
const BG = '#0A0E1A';
const GOLD = '#c5a259';

const logoSize = 460;
const logo = await sharp(logoPath).resize(logoSize, logoSize, { fit: 'contain' }).png().toBuffer();

const frame = Buffer.from(
  `<svg width="${W}" height="${H}">
     <rect width="${W}" height="${H}" fill="${BG}"/>
     <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${GOLD}" stroke-width="3" rx="24" opacity="0.6"/>
   </svg>`
);

await sharp(frame)
  .composite([{ input: logo, left: Math.round((W - logoSize) / 2), top: Math.round((H - logoSize) / 2) }])
  .jpeg({ quality: 88 })
  .toFile(outPath);

console.log('wrote', outPath);

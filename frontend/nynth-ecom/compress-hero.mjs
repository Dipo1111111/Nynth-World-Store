// Run: node compress-hero.mjs
// Compresses the local fallback hero banner from 4096px → 2000px, quality 70
// Result: header-compressed.jpg (replace header.JPEG with it)
import sharp from 'sharp';
import { statSync, copyFileSync, unlinkSync } from 'fs';

const input = 'src/assets/header.JPEG';
const output = 'src/assets/header-compressed.jpg';

console.log('Compressing hero banner...');
await sharp(input)
  .resize({ width: 2000, withoutEnlargement: true })
  .jpeg({ quality: 70, progressive: true })
  .toFile(output);

const orig = statSync(input).size;
const comp = statSync(output).size;
console.log(`Original: ${(orig/1024).toFixed(0)}KB → Compressed: ${(comp/1024).toFixed(0)}KB (${(comp/orig*100).toFixed(1)}%)`);

// Replace original
copyFileSync(output, input);
unlinkSync(output);
console.log('Done — header.JPEG replaced with compressed version.');

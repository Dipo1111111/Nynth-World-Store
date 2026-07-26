import sharp from 'sharp';
import { statSync } from 'fs';

const input = 'src/assets/header.JPEG';
const output = 'src/assets/header-compressed.jpg';

await sharp(input)
  .resize({ width: 2000, withoutEnlargement: true })
  .jpeg({ quality: 70, progressive: true })
  .toFile(output);

const orig = statSync(input).size;
const comp = statSync(output).size;
console.log(`Original: ${(orig/1024).toFixed(0)}KB -> Compressed: ${(comp/1024).toFixed(0)}KB (${(comp/orig*100).toFixed(1)}%)`);

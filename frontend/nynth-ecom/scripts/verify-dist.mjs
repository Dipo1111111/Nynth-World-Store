// Post-build integrity check: every asset referenced by the emitted HTML
// (and every file in dist/assets) must actually exist on disk.
// Catches build/tooling contracts breaking — a chunk that vite forgot to
// emit can never 404 on the CDN because it is already gone here.
//
// Usage: node scripts/verify-dist.mjs [distDir]
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] || path.join(here, "..", "dist"));

const htmlFiles = readdirSync(root).filter(f => f.endsWith(".html"));
if (htmlFiles.length === 0) {
    console.error(`verify-dist FAILED: no HTML entry found in ${root}`);
    process.exit(1);
}

const assetRe = /(?:src|href)="([^"]+\.(?:js|css|woff2?|ttf|png|jpe?g|webp|svg|ico|json|map))"/g;
const failures = [];

for (const htmlName of htmlFiles) {
    const html = readFileSync(path.join(root, htmlName), "utf8");
    for (const match of html.matchAll(assetRe)) {
        const rel = match[1].replace(/^\//, "");
        const full = path.join(root, rel);
        if (!existsSync(full) || !statSync(full).isFile()) {
            failures.push(`${htmlName} -> ${match[1]} (MISSING)`);
        }
    }
}

const assetsDir = path.join(root, "assets");
if (existsSync(assetsDir)) {
    for (const name of readdirSync(assetsDir)) {
        const full = path.join(assetsDir, name);
        if (!statSync(full).isFile()) failures.push(`assets/${name} is not a file`);
    }
}

if (failures.length > 0) {
    console.error("verify-dist FAILED:\n" + failures.join("\n"));
    process.exit(1);
}
console.log(`verify-dist OK — ${htmlFiles.length} HTML entry, all referenced assets present in ${root}`);
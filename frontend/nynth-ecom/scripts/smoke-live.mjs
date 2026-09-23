// Post-deploy smoke test: every built chunk must be served by the live host
// as real JavaScript/CSS — NOT as the SPA fallback (HTTP 200 + text/html).
//
// This is exactly the failure class that takes down lazy-loaded admin pages
// after a redeploy: a stale index.html references a purged chunk, Vercel's
// catch-all rewrite serves index.html for it, and the browser rejects it as
// a module script ("Failed to load module script").
//
// Usage:
//   node scripts/smoke-live.mjs [baseUrl] [distDir]
//   SMOKE_BASE=https://<deploy-url> node scripts/smoke-live.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const base = (process.env.SMOKE_BASE || process.argv[2] || "https://www.nynthworld.com").replace(/\/+$/, "");
const dist = path.resolve(process.argv[3] || path.join(here, "..", "dist"));

const chunkPaths = new Set();

const manifestFile = path.join(dist, ".vite", "manifest.json");
if (existsSync(manifestFile)) {
    const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    for (const entry of Object.values(manifest)) {
        (entry.assets || []).forEach(a => chunkPaths.add(a));
        if (entry.file) chunkPaths.add(entry.file);
    }
}

const htmlFile = path.join(dist, "index.html");
if (existsSync(htmlFile)) {
    const html = readFileSync(htmlFile, "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)) {
        chunkPaths.add(match[1].replace(/^\//, ""));
    }
}

const assetsDir = path.join(dist, "assets");
if (existsSync(assetsDir)) {
    readdirSync(assetsDir).forEach(f => chunkPaths.add(`assets/${f}`));
}

const checks = [...chunkPaths].filter(p => /\.(?:js|css)$/.test(p)).sort();
let failures = 0;

for (const rel of checks) {
    const url = `${base}/${rel}`;
    let res;
    try {
        res = await fetch(url, { method: "GET", redirect: "follow" });
    } catch (err) {
        failures++;
        console.log(`FAIL  (network) ${url} — ${err.message}`);
        continue;
    }
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const okType = rel.endsWith(".js") ? ct.includes("javascript") : ct.includes("text/css");
    if (res.status !== 200 || !okType) {
        failures++;
        console.log(`FAIL  HTTP ${res.status}  ${ct || "no content-type"}  ${url}`);
    }
}

for (const route of ["/", "/shop"]) {
    try {
        const res = await fetch(`${base}${route}`, { redirect: "follow" });
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (res.status !== 200 || !ct.includes("text/html")) {
            failures++;
            console.log(`FAIL  shell ${route}: HTTP ${res.status}  ${ct}`);
        }
    } catch (err) {
        failures++;
        console.log(`FAIL  shell ${route}: ${err.message}`);
    }
}

if (failures > 0) {
    console.error(`smoke-live FAILED — ${failures} broken asset(s) on ${base}`);
    process.exit(1);
}
console.log(`smoke-live OK — ${checks.length} chunks + app shell served as JS/CSS/HTML on ${base}`);
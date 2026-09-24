import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, "..", "..");

const ROUTES = [
    ["AdminDashboard", "./AdminDashboard"],
    ["Orders", "./Orders"],
    ["Products", "./Products"],
    ["DiscountCodes", "./DiscountCodes"],
    ["Settings", "./Settings"],
    ["Subscribers", "./Subscribers"],
    ["Lookbooks", "./Lookbooks"],
    ["AbandonedCheckouts", "./AbandonedCheckouts"],
    ["CheckIn", "./CheckIn"],
    ["Events", "./Events"],
];

describe("admin lazy routes stay importable", () => {
    it.each(ROUTES)("%s resolves to a valid page component", async (_name, modPath) => {
        const mod = await import(modPath);
        expect(typeof mod.default, "page should default-export its component").toBe("function");
    });

    it("every lazy route in App.jsx points at a file that exists", () => {
        const appSrc = readFileSync(path.join(srcRoot, "App.jsx"), "utf8");
        const imports = [...appSrc.matchAll(/lazy\(\(\) => import\("(\.\/pages\/admin\/[^"]+)"\)\)/g)].map(m => m[1]);
        expect(imports.length, "expected at least the admin lazy routes").toBeGreaterThanOrEqual(8);
        for (const rel of imports) {
            const file = path.join(srcRoot, rel + ".jsx");
            const exists = readFileSync(file, "utf8"); // throws if missing
            expect(exists.length).toBeGreaterThan(0);
        }
    });
});
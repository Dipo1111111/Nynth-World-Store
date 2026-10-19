// THE ADMIN SETTINGS PAGE SPEAKS ONE VISUAL LANGUAGE.
//
// An audit of the settings page found the same problem everywhere: the boxes
// came in four different shapes, and half the page was painted with
// hardcoded white, which on the paper admin is white on white. The switches
// were three different switches and two of them could not be seen at all.
//
// These tests guard the rules that came out of that audit, so the drift
// cannot come back quietly.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const settings = read("src/pages/admin/Settings.jsx");
const toggle = read("src/components/admin/Toggle.jsx");

const adminFiles = [
  "src/pages/admin/Settings.jsx",
  "src/components/admin/ShippingRatesEditor.jsx",
  "src/components/admin/Toggle.jsx",
];

describe("one radius language", () => {
  it("uses 12px for cards, 8px for controls, 4px for chips, full for pills", () => {
    // A 4px radius on a control reads as a different box next to an 8px one.
    const controlRounding = [
      /className="[^"]*\brounded-md\b/,        // 6px, used nowhere in the admin
      /className="[^"]*\brounded-sm\b/,        // 2px
      /className="[^"]*\brounded-2xl\b/,       // 16px
      /className="[^"]*\brounded-3xl\b/,       // 24px
    ];
    for (const file of adminFiles) {
      const text = read(file);
      for (const pattern of controlRounding) {
        expect(text.match(pattern) ?? [], `${file} matched ${pattern}`).toEqual([]);
      }
    }
  });

  it("keeps the 4px radius for text chips only", () => {
    // A chip is a small label. Anything bigger that is not a card, a control
    // or a pill has to be 8px so the page reads as one set of boxes.
    for (const file of adminFiles) {
      const text = read(file);
      const chips = text.match(/className="[^"]*\brounded\s[^"]*"/g) ?? [];
      for (const chip of chips) {
        expect(chip, `${file}: ${chip}`).toMatch(/px-\d/);
        expect(chip, `${file}: ${chip}`).toMatch(/py-[\d.]/);
      }
    }
  });

  it("has no sharp option buttons next to rounded inputs", () => {
    // The old bug: the band position and banner colour buttons had a border
    // and no radius, so they read as sharp rectangles.
    expect(settings).not.toMatch(/px-4 py-3 border transition-all/);
    expect(settings).not.toMatch(/px-5 py-3 border transition-all/);
    expect(settings).toContain("px-4 py-3 border rounded-lg");
  });

  it("keeps the cards and the controls one step apart", () => {
    expect(settings).toContain("p-6 rounded-xl");
    expect(settings).toContain("rounded-lg");
  });
});

describe("every surface follows the theme", () => {
  it("has no hardcoded white or black fills left", () => {
    for (const file of adminFiles) {
      const text = read(file);
      for (const pattern of [
        /bg-white\/\[/,
        /hover:bg-white\/\[/,
        /border-white\/\[/,
        /bg-\[#1f1f22\]/,
      ]) {
        expect(text.match(pattern) ?? [], `${file} matched ${pattern}`).toEqual([]);
      }
    }
  });

  it("takes the status colours from the tint tokens", () => {
    expect(settings).not.toMatch(/text-amber-2\d\d/);
    expect(settings).not.toMatch(/text-rose-3\d\d/);
    expect(settings).not.toMatch(/text-emerald-3\d\d/);
    expect(settings).toContain("var(--tint-amber-fg)");
    expect(settings).toContain("var(--tint-rose-fg)");
  });
});

describe("one switch", () => {
  it("is a shared component, not ten copies", () => {
    expect(settings).not.toMatch(/sr-only peer/);
    expect(settings).not.toMatch(/w-12 h-6 rounded-lg/);
    const switches = settings.match(/<Toggle/g) ?? [];
    expect(switches.length).toBe(10);
  });

  it("is a pill with a knob, coloured from the tokens", () => {
    expect(toggle).toContain("rounded-full");
    expect(toggle).toContain("role=\"switch\"");
    expect(toggle).toContain("var(--admin-accent)");
    expect(toggle).toContain("var(--admin-ink)");
    // No hardcoded light or dark, so it reads the same on both themes.
    expect(toggle).not.toMatch(/bg-white|bg-black/);
  });
});

describe("every control is reachable and named", () => {
  it("links each field label to its control", () => {
    const labels = settings.match(/<label htmlFor="/g) ?? [];
    expect(labels.length).toBeGreaterThanOrEqual(40);
  });

  it("puts a focus ring on every button", () => {
    const buttons = settings.match(/<button/g) ?? [];
    const rings = settings.match(/focus-ring/g) ?? [];
    expect(rings.length).toBeGreaterThanOrEqual(buttons.length);
  });

  it("gives the option groups radio semantics", () => {
    expect(settings).toContain('role="radiogroup"');
    expect(settings).toContain('role="radio"');
    expect(settings).toContain("aria-checked=");
  });

  it("wires the tab bar to its panel", () => {
    expect(settings).toContain('role="tablist"');
    expect(settings).toContain('aria-controls="settings-tabpanel"');
    expect(settings).toContain('id="settings-tabpanel"');
  });
});

// THE SETTINGS PAGE HAS A TYPE RAMP AND A SPACING RHYTHM.
//
// Two findings from the layout and type audit:
//
// One, every description on the page was a whole sentence set in 9 or 10px
// capitals. The source text was always sentence case, the uppercase class
// was doing the damage, so the fix was the class and not the copy. The caps
// stay where the brand wants them, on labels, buttons, tabs and chips.
//
// Two, the spacing had one value doing every job. The gap between two
// cards, the gap between two groups inside a card, and the gap between a
// label and its control were all the same, so nothing grouped and the page
// read as a flat list of equal weight boxes.
//
// The ramp:
//   40px page title, 18px section title, 14px group heading, 13px field
//   label, 12px description, 11px hint, 10px micro label.
//
// The rhythm:
//   32px card to card, 20px group to group, 12px heading to its controls,
//   8px label to its control, 4px control to the hint under it.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const settings = read("src/pages/admin/Settings.jsx");
const shipping = read("src/components/admin/ShippingRatesEditor.jsx");

const paragraphs = (src) => src.match(/<p className="[^"]*"/g) ?? [];

describe("prose is prose, not a label", () => {
  it("no paragraph on the page is set in capitals", () => {
    for (const [name, src] of [["Settings", settings], ["ShippingRatesEditor", shipping]]) {
      const shouted = paragraphs(src).filter((p) => p.includes("uppercase"));
      // One status line is allowed to shout, it is a flag not a sentence.
      expect(shouted.filter((p) => !p.includes("tint-rose-fg")), name).toEqual([]);
    }
  });

  it("the description role is 12px and regular", () => {
    expect(settings).toContain("text-xs text-[var(--admin-ink)]/55 mb-6 leading-relaxed");
    expect(settings).toContain("text-xs text-[var(--admin-ink)]/55 mb-4 leading-relaxed");
  });

  it("the hint role is 11px and regular", () => {
    expect(settings).toContain("text-[11px] text-[var(--admin-ink)]/55 mt-1 leading-relaxed");
    expect(settings).toContain("text-[11px] text-[var(--admin-ink)]/55 leading-relaxed");
  });

  it("the field label is 13px, one step below the group heading", () => {
    expect(settings).toContain("text-[13px] font-medium text-[var(--admin-ink)]/85");
    // And the group heading that leads it is 14.
    expect(settings).toContain("text-sm font-bold uppercase tracking-widest text-[var(--admin-ink)]");
  });

  it("the group heading is still the brand caps", () => {
    // The caps are the voice, on labels. They are not on sentences.
    expect(settings).toContain("text-sm font-bold uppercase tracking-widest");
  });
});

describe("the spacing has a rhythm", () => {
  it("separates cards generously", () => {
    expect(settings).toContain('role="tabpanel"');
    expect(settings).toMatch(/role="tabpanel"[\s\S]{0,200}className="space-y-8"/);
  });

  it("separates groups inside a card less than cards", () => {
    expect(settings).toContain("space-y-5");
    expect(settings).not.toMatch(/space-y-6/);
  });

  it("gives a group heading room before its controls", () => {
    expect(settings).toContain("space-y-3");
  });

  it("keeps a label tight to its own control", () => {
    expect(settings).toContain("space-y-2");
  });

  it("puts the section title closer to its content than the card edge", () => {
    // 24px of card padding above, 20px below the rule.
    expect(settings).toContain("mb-5 pb-2 border-b border-[var(--admin-ink)]/10");
  });
});

describe("the page reads in order", () => {
  it("puts the intro line under the page title, not floating between cards", () => {
    const form = settings.indexOf("<form onSubmit={handleSubmit}");
    const intro = settings.indexOf("Storefront configuration. Changes stay staged until you save.");
    const appearance = settings.indexOf('title="Appearance"');
    expect(intro).toBeGreaterThan(form);
    expect(intro).toBeLessThan(appearance);
  });

  it("keeps the sticky save bar off the admin sidebar", () => {
    expect(settings).toContain("fixed bottom-0 left-0 right-0 z-50");
    expect(settings).toContain("md:left-64");
  });

  it("fits every tab on a laptop with no hidden one", () => {
    // Ten tabs did not fit and the last was cut off. Two labels shortened
    // and the padding tightened, so nothing is hidden.
    for (const label of ["Store", "Shop page", "Product page", "Landing", "Revenue", "Lock", "Shipping", "News", "Content", "Cleanup"]) {
      expect(settings).toContain(`label: "${label}"`);
    }
    expect(settings).toContain("rounded-lg px-2 py-2 text-[10px]");
  });
});

// THE ADMIN HAS ONE VISUAL LANGUAGE, AND IT CANNOT GO BACK.
//
// The admin was a mess because two mistakes were made at once. The utility
// classes in index.css were written with hardcoded ink values, so they only
// ever looked right on the dark theme. And most pages ignored those
// utilities and hand rolled their own class strings, with four to 27
// different button shapes per page.
//
// The fix is a token layer, a small set of shared primitives, and this test.
//
// It is a ratchet, not a switch. The pages that have been through the system
// are held to it. The ones that have not are on a list, and that list is
// only allowed to get shorter. A new hardcoded value cannot be introduced
// anywhere, and a page cannot quietly leave the list.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");

// The rules are about the code, not about the prose describing the rules, so
// the comments come out before anything is checked.
const stripComments = (text) =>
  text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/.*$/gm, "");

const adminDir = resolve(process.cwd(), "src/pages/admin");
const componentDir = resolve(process.cwd(), "src/components/admin");

// The pages that have been through the system.
const MIGRATED = [
  "src/pages/admin/AbandonedCheckouts.jsx",
  "src/pages/admin/AdminDashboard.jsx",
  "src/pages/admin/CheckIn.jsx",
  "src/pages/admin/DiscountCodes.jsx",
  "src/pages/admin/Events.jsx",
  "src/pages/admin/Lookbooks.jsx",
  "src/pages/admin/Orders.jsx",
  "src/pages/admin/Products.jsx",
  "src/pages/admin/Settings.jsx",
  "src/pages/admin/StaffAccess.jsx",
  "src/pages/admin/Subscribers.jsx",
  "src/pages/admin/TicketPlatform.jsx",
  "src/components/admin/ShippingRatesEditor.jsx",
  "src/components/admin/AdminLayout.jsx",
  "src/components/admin/AdminPWAPrompt.jsx",
  "src/components/admin/RevenueValue.jsx",
  "src/components/admin/StatusDropdown.jsx",
  "src/components/admin/Toggle.jsx",
  "src/components/admin/AdminButton.jsx",
  "src/components/admin/AdminBadge.jsx",
  "src/components/admin/AdminCard.jsx",
  "src/components/admin/AdminInput.jsx",
  "src/components/admin/AdminModal.jsx",
  "src/components/admin/PageHeader.jsx",
  "src/components/admin/StatCard.jsx",
];

// The pages still to go. This list is the work queue. It is empty now, and
// the point of the ratchet is that it cannot grow again.
const PENDING = [];

// A hardcoded white or black is the mistake. On the paper theme a white
// panel is white on white and the panel silently does not exist. A raw
// Tailwind palette value is the same mistake with a different name, because
// text-slate-300 is a dark theme value.
//
// A white label on a solid fill is not the mistake. A scrim over a photo and
// a solid emerald button both need it, and both are theme independent.
const BANNED = [
  /bg-white\/\[/,
  /hover:bg-white\/\[/,
  /border-white\/\[/,
  /text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/,
  /bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\//,
  /border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/,
];

// The accent button is bone on ink and black on paper, so a hardcoded black
// hover would be right in one theme and wrong in the other.
const DARK_HOVER_ON_ACCENT = /bg-\[var\(--admin-accent\)\][^"]*hover:bg-black/;


// The radius scale. 12 for a card, 8 for a control, 4 for a chip, full for
// a switch or a dot. Nothing sharp, nothing at 2, 6, 16 or 24.
const BAD_RADIUS = [
  /rounded-md\b/,
  /rounded-sm\b/,
  /rounded-2xl\b/,
  /rounded-3xl\b/,
];

describe("the migrated admin holds the system", () => {
  it.each(MIGRATED)("%s has no hardcoded colour", (file) => {
    const text = stripComments(read(file));
    const offenders = BANNED.filter((p) => p.test(text)).map((p) => String(p));
    expect(offenders, file).toEqual([]);
    expect(DARK_HOVER_ON_ACCENT.test(text), `${file} hovers the accent button to black`).toBe(false);
  });

  it.each(MIGRATED)("%s sticks to the radius scale", (file) => {
    const text = stripComments(read(file));
    const offenders = BAD_RADIUS.filter((p) => p.test(text)).map((p) => String(p));
    expect(offenders, file).toEqual([]);
  });
});

describe("the ratchet only goes one way", () => {
  const onDisk = [
    ...readdirSync(adminDir)
      .filter((f) => f.endsWith(".jsx") && !f.endsWith(".test.jsx"))
      .map((f) => `src/pages/admin/${f}`),
    ...readdirSync(componentDir)
      .filter((f) => f.endsWith(".jsx") && !f.endsWith(".test.jsx"))
      .map((f) => `src/components/admin/${f}`),
  ];

  it("lists every admin file that is not migrated yet", () => {
    // A file that is neither migrated nor pending would escape the ratchet.
    // This is the gap that let the sidebar and the status dropdown keep
    // their hardcoded white for three rounds.
    const known = new Set([...MIGRATED, ...PENDING]);
    const untracked = onDisk.filter((f) => !known.has(f));
    expect(untracked).toEqual([]);
  });

  it("has no file on both lists", () => {
    const overlap = PENDING.filter((f) => MIGRATED.includes(f));
    expect(overlap).toEqual([]);
  });

  it("has no stale entry on the pending list", () => {
    const stale = PENDING.filter((f) => !onDisk.includes(f));
    expect(stale).toEqual([]);
  });
});

describe("the shared primitives exist and are the way in", () => {
  it("has one button, one card, one badge, one input, one modal, one switch", () => {
    for (const name of [
      "AdminButton.jsx",
      "AdminCard.jsx",
      "AdminBadge.jsx",
      "AdminInput.jsx",
      "AdminModal.jsx",
      "PageHeader.jsx",
      "StatCard.jsx",
      "Toggle.jsx",
    ]) {
      expect(readdirSync(componentDir)).toContain(name);
    }
  });

  it("takes its colours from the admin tokens, never a literal", () => {
    for (const name of readdirSync(componentDir)) {
      if (!name.endsWith(".jsx")) continue;
      const text = stripComments(read(`src/components/admin/${name}`));
      expect(text.match(/#[0-9a-f]{3,8}\b/gi) ?? [], name).toEqual([]);
      expect(text.match(/oklch\(/g) ?? [], name).toEqual([]);
    }
  });

  it("gives the button the four intents and the states to go with them", () => {
    const button = read("src/components/admin/AdminButton.jsx");
    for (const variant of ["primary", "secondary", "ghost", "danger"]) {
      expect(button).toContain(`${variant}:`);
    }
    for (const state of ["hover:", "active:", "focus-ring", "disabled:"]) {
      expect(button).toContain(state);
    }
  });
});

describe("the utility layer follows the theme", () => {
  const css = read("src/index.css");

  it("has no hardcoded ink in the admin utilities", () => {
    // The utility block, from the segmented control to the table rules.
    const block = css.slice(css.indexOf(".segmented-control {"), css.indexOf(".admin-app ::selection"));
    const hardcoded = block.match(/oklch\(0\.[0-9]|oklch\(1 0 0/g) ?? [];
    expect(hardcoded).toEqual([]);
  });

  it("has a chrome surface and interactive fills as tokens", () => {
    expect(css).toContain("--admin-surface-2:");
    expect(css).toContain("--admin-hover:");
    expect(css).toContain("--admin-active:");
  });
});

describe("the pages reuse, they do not reinvent", () => {
  const pageFiles = readdirSync(adminDir).filter((f) => f.endsWith(".jsx") && !f.endsWith(".test.jsx"));

  it("no page hand-rolls its own primary button", () => {
    // The accent fill is what a primary action looks like. If a page paints
    // one itself, it has invented a second button style, which is exactly
    // what the shared AdminButton exists to stop.
    for (const file of pageFiles) {
      const text = stripComments(read(`src/pages/admin/${file}`));
      const offenders = [];
      for (const match of text.matchAll(/<button[\s\S]*?>/g)) {
        if (/bg-\[var\(--admin-accent\)\]/.test(match[0])) {
          offenders.push(match[0].slice(0, 90));
        }
      }
      expect(offenders, file).toEqual([]);
    }
  });

  it("no page has a raw colour literal", () => {
    for (const file of pageFiles) {
      const text = stripComments(read(`src/pages/admin/${file}`));
      const hex = text.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
      const oklch = text.match(/oklch\(/g) ?? [];
      expect(hex, `${file} hex`).toEqual([]);
      expect(oklch, `${file} oklch`).toEqual([]);
    }
  });

  it("every page that has an action uses the shared button", () => {
    for (const file of pageFiles) {
      const text = stripComments(read(`src/pages/admin/${file}`));
      const hasButton = /<button/.test(text);
      const usesAdminButton = /<AdminButton/.test(text);
      if (hasButton && !usesAdminButton) {
        // A page may legitimately have a segmented control or a status dot.
        // It may not hand-roll a filled action button, so the check looks at
        // the button markup rather than the whole file.
        const offenders = [];
        for (const match of text.matchAll(/<button[\s\S]*?>/g)) {
          if (/bg-\[var\(--admin-accent\)\]|bg-\[var\(--tint-\w+-fg\)\]/.test(match[0])) {
            offenders.push(match[0].slice(0, 90));
          }
        }
        expect(offenders, `${file} has a button but no AdminButton`).toEqual([]);
      }
    }
  });
});

describe("one surface material, one title, one type ramp", () => {
  const css = read("src/index.css");
  const pages = readdirSync(adminDir)
    .filter((f) => f.endsWith(".jsx") && !f.endsWith(".test.jsx"))
    .map((f) => `src/pages/admin/${f}`);
  const components = readdirSync(componentDir)
    .filter((f) => f.endsWith(".jsx") && !f.endsWith(".test.jsx"))
    .map((f) => `src/components/admin/${f}`);
  const all = [...pages, ...components];

  it("defines the panel material once, in the token layer", () => {
    for (const token of [
      ".admin-panel {",
      ".admin-panel-raised",
      ".admin-panel-inset",
      ".admin-panel-dashed",
      "--admin-glass-tint:",
      "--admin-glass-line:",
    ]) {
      expect(css, token).toContain(token);
    }
  });

  it("the card is the material, not its own fill", () => {
    const card = stripComments(read("src/components/admin/AdminCard.jsx"));
    expect(card).toContain("admin-panel");
    expect(card).not.toMatch(/bg-\[var\(--admin-surface\)\]/);
  });

  it("no page paints its own solid panel", () => {
    // A modal is a focus surface and stays solid, and the Products modal is
    // the same thing inline. Everything else that is a 12px panel is glass.
    const exempt = new Set([
      "src/components/admin/AdminModal.jsx",
      "src/pages/admin/Products.jsx",
    ]);
    for (const file of all) {
      if (exempt.has(file)) continue;
      const text = stripComments(read(file));
      const classes = [...text.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)].map(
        (m) => m[1] ?? m[2] ?? ""
      );
      const solidPanels = classes.filter(
        (c) => /rounded-xl/.test(c) && /bg-\[var\(--admin-surface\)\](?!\/)/.test(c)
      );
      expect(solidPanels, file).toEqual([]);
    }
  });

  it("keeps the type ramp at 10px and up", () => {
    // 8px and 9px labels were the tell that a page had not been through the
    // system. The ramp's floor is the 10px micro label.
    for (const file of all) {
      const text = stripComments(read(file));
      expect(text.match(/text-\[(8|9)px\]/g) ?? [], file).toEqual([]);
    }
  });

  it("has one page title, and it belongs to the layout", () => {
    const header = stripComments(read("src/components/admin/PageHeader.jsx"));
    expect(header).not.toMatch(/\btitle\b/);
    for (const file of pages) {
      const text = stripComments(read(file));
      const blocks = [...text.matchAll(/<PageHeader\b[\s\S]*?\/>/g)].map((m) => m[0]);
      const withTitle = blocks.filter((b) => /\btitle=/.test(b));
      expect(withTitle, file).toEqual([]);
    }
  });
});

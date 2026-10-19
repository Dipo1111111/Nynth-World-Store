// ADMIN SETTINGS IS ONE TAB AT A TIME, THE SCROLLBAR IS OURS, AND LIGHT MODE
// FIELDS ARE READABLE.
//
// Three fixes, guarded so they cannot silently come back:
//
// 1. The settings page used to be one endless scroll. Every section was
//    stacked under every other one and the nav was a row of anchors that
//    scrolled you to a section. That is a huge vertical height and it breaks
//    the way a page should behave. Now each tab mounts only its own
//    sections, so the page is as tall as the section you are editing.
//
// 2. The browser scrollbar was the default one everywhere except the dark
//    admin. Now the whole site has one thin scrollbar whose colour follows
//    the theme.
//
// 3. In admin light mode the input text and the placeholder were hardcoded
//    bone, which is white on a white field. So the fields looked empty even
//    when they had text in them. They now follow the theme tokens.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const settings = read("src/pages/admin/Settings.jsx");
const css = read("src/index.css");
const globals = read("src/styles/globals.css");
const layout = read("src/components/admin/AdminLayout.jsx");

const TABS = [
  "store",
  "shop",
  "product",
  "landing",
  "revenue",
  "lock",
  "shipping",
  "announce",
  "content",
  "cleanup",
];

describe("the settings page is one tab at a time", () => {
  it("mounts only the sections of the open tab", () => {
    // Every settings card sits behind a tab condition, so the other tabs are
    // not in the document at all.
    const gated = settings.match(/\{activeTab === "/g) ?? [];
    expect(gated.length).toBeGreaterThanOrEqual(21);
  });

  it("has a tab for every area the founder can reach", () => {
    for (const tab of TABS) {
      expect(settings).toContain(`{ id: "${tab}", label:`);
      expect(settings).toContain(`activeTab === "${tab}"`);
    }
  });

  it("switches tabs with buttons instead of scrolling to anchors", () => {
    // The old nav scrolled the long page to a section. Now it swaps panels.
    expect(settings).not.toContain('href="#set-');
    expect(settings).toContain('role="tablist"');
    expect(settings).toContain('role="tab"');
    expect(settings).toContain("aria-selected={active}");
    expect(settings).toContain("onClick={() => selectTab(tab)}");
  });

  it("keeps the section ids so a tab can still be linked to directly", () => {
    for (const id of ["set-store", "set-shop", "set-product", "set-landing", "set-revenue", "set-lock", "set-shipping", "set-announce", "set-content", "set-cleanup"]) {
      expect(settings).toContain(`id="${id}"`);
    }
    expect(settings).toContain("window.location.hash");
  });

  it("still puts the theme switch at the very top, before any tab", () => {
    const appearance = settings.indexOf('title="Appearance"');
    expect(appearance).toBeGreaterThan(-1);
    expect(appearance).toBeLessThan(settings.indexOf("activeTab === \"store\""));
  });
});

describe("the scrollbar is ours, site wide", () => {
  it("styles the webkit scrollbar for every element", () => {
    expect(css).toContain("*::-webkit-scrollbar {");
    expect(css).toContain("*::-webkit-scrollbar-thumb {");
    expect(css).toContain("*::-webkit-scrollbar-track {");
  });

  it("styles the firefox scrollbar too", () => {
    expect(css).toContain("scrollbar-color:");
    expect(css).toContain("scrollbar-width: thin");
  });

  it("gives the storefront a dark thumb on paper", () => {
    const brandIdx = css.indexOf("--brand-red:");
    const rootIdx = css.lastIndexOf(":root {", brandIdx);
    const root = css.slice(rootIdx, css.indexOf(".admin-app {"));
    expect(root).toContain("--scrollbar-thumb:");
    expect(root).toContain("--scrollbar-track:");
  });

  it("gives the admin a bone thumb on ink and an ink thumb on paper", () => {
    const dark = css.slice(css.indexOf(".admin-app {"), css.indexOf(".admin-app[data-theme='light']"));
    expect(dark).toContain("--scrollbar-thumb: oklch(0.93 0.005 90 / 0.22)");
    const light = css.slice(css.indexOf(".admin-app[data-theme='light']"));
    expect(light).toContain("--scrollbar-thumb: oklch(0.145 0 0 / 0.26)");
  });

  it("carries the admin theme onto the document, where the window bar lives", () => {
    // The page scrollbar belongs to the document, not to .admin-app. Without
    // this the window bar would stay in the storefront colours while the
    // whole back office is in ink.
    expect(layout).toContain('setAttribute("data-admin-theme", theme)');
    expect(layout).toContain('removeAttribute("data-admin-theme")');
    expect(css).toContain("html[data-admin-theme='dark']");
    expect(css).toContain("html[data-admin-theme='light']");
  });

  it("leaves the deliberate hidden scrollbars alone", () => {
    // The horizontal rails that hide their bar on purpose still hide it.
    expect(globals).toContain(".no-scrollbar {");
    expect(globals).toContain("scrollbar-width: none");
  });
});

describe("light mode fields are readable", () => {
  it("takes the field colour from the theme token, not a hardcoded bone", () => {
    const inputs = css.slice(css.indexOf(".admin-app input,"));
    expect(inputs).toContain("color: var(--admin-ink)");
    expect(inputs).toContain("caret-color: var(--admin-ink)");
    expect(inputs).toContain("color-scheme: var(--admin-color-scheme)");
  });

  it("takes the placeholder from the theme token too", () => {
    const inputs = css.slice(css.indexOf(".admin-app input,"));
    expect(inputs).toContain("color: var(--admin-placeholder)");
    expect(inputs).not.toContain("oklch(0.93 0.005 90 / 0.35)");
  });

  it("uses a dark placeholder on paper and a bone one on ink", () => {
    const dark = css.slice(css.indexOf(".admin-app {"), css.indexOf(".admin-app[data-theme='light']"));
    expect(dark).toContain("--admin-placeholder: oklch(0.93 0.005 90 / 0.35)");
    const light = css.slice(css.indexOf(".admin-app[data-theme='light']"));
    expect(light).toContain("--admin-placeholder: oklch(0.145 0 0 / 0.45)");
  });

  it("renders native widgets light on paper, dark on ink", () => {
    const dark = css.slice(css.indexOf(".admin-app {"), css.indexOf(".admin-app[data-theme='light']"));
    expect(dark).toContain("--admin-color-scheme: dark");
    const light = css.slice(css.indexOf(".admin-app[data-theme='light']"));
    expect(light).toContain("--admin-color-scheme: light");
  });
});

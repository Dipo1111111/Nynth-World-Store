// ONE CUSTOM SCROLLBAR FOR THE WHOLE SITE.
//
// The first attempt at this put scrollbar-width and scrollbar-color on
// every element. Chrome and Safari ignore the webkit pseudo elements the
// moment scrollbar-width is set on the same element, so the custom bar
// never rendered in the browsers that were looking at it. The standard
// properties now live in a Firefox only block.
//
// The second defect was the gutter beside the page scrollbar. That area is
// painted by the canvas background, which comes from the html element, not
// the body, so the ink admin grew a white stripe down its right edge.
//
// These tests guard both.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const css = read("src/index.css");
const layout = read("src/components/admin/AdminLayout.jsx");

const scrollbarBlock = css.slice(css.indexOf("CUSTOM SCROLLBAR"));

describe("the custom scrollbar is everywhere", () => {
  it("styles the root scroller and every inner one", () => {
    expect(scrollbarBlock).toContain("html::-webkit-scrollbar {");
    expect(scrollbarBlock).toContain("html *::-webkit-scrollbar {");
    expect(scrollbarBlock).toContain("html::-webkit-scrollbar-thumb,");
    expect(scrollbarBlock).toContain("html *::-webkit-scrollbar-thumb {");
  });

  it("keeps scrollbar-width away from the webkit rules", () => {
    // This is the bug. Chrome drops the webkit pseudo elements when
    // scrollbar-width is set, so the custom bar stops existing. Every
    // mention of scrollbar-width has to live inside the Firefox only block.
    const count = (haystack, needle) => haystack.split(needle).length - 1;
    const supportsAt = css.indexOf("@supports not selector(::-webkit-scrollbar)");
    expect(count(css, "scrollbar-width:")).toBe(count(css.slice(supportsAt), "scrollbar-width:"));
    expect(count(css, "scrollbar-color:")).toBe(count(css.slice(supportsAt), "scrollbar-color:"));
  });

  it("still gives Firefox a thin themed bar", () => {
    expect(scrollbarBlock).toContain("@supports not selector(::-webkit-scrollbar)");
    const firefox = scrollbarBlock.slice(scrollbarBlock.indexOf("@supports not selector"));
    expect(firefox).toContain("scrollbar-width: thin");
    expect(firefox).toContain("scrollbar-color:");
  });

  it("takes the thumb colour from a token so it follows the theme", () => {
    expect(scrollbarBlock).toContain("var(--scrollbar-thumb)");
    expect(css).toContain("--scrollbar-thumb:");
    // The dark admin gets a bone thumb, the paper one an ink thumb.
    const dark = css.slice(css.indexOf("html[data-admin-theme='dark']"));
    expect(dark).toContain("--scrollbar-thumb: oklch(0.93 0.005 90 / 0.28)");
    const light = css.slice(css.indexOf("html[data-admin-theme='light']"));
    expect(light).toContain("--scrollbar-thumb: oklch(0.145 0 0 / 0.28)");
  });
});

describe("the gutter beside the page scrollbar belongs to the theme", () => {
  it("paints the html element, because the body stops at the content edge", () => {
    const dark = css.slice(css.indexOf("html[data-admin-theme='dark']"));
    expect(dark).toContain("background-color: oklch(0.155 0.002 85)");
    const light = css.slice(css.indexOf("html[data-admin-theme='light']"));
    expect(light).toContain("background-color: oklch(0.975 0.002 95)");
  });

  it("stamps the admin theme on the document so the rule can fire", () => {
    expect(layout).toContain('setAttribute("data-admin-theme", theme)');
    expect(layout).toContain('removeAttribute("data-admin-theme")');
  });
});

describe("vertical scroll areas keep their scrollbar", () => {
  it("the admin sidebar nav scrolls visibly", () => {
    expect(layout).toContain("overflow-y-auto");
    expect(layout).not.toContain("overflow-y-auto scrollbar-hide");
  });

  it("the checkout summary scrolls visibly", () => {
    const checkout = read("src/pages/Checkout.jsx");
    expect(checkout).toContain("max-h-[500px] overflow-y-auto");
    expect(checkout).not.toContain("overflow-y-auto pr-4 no-scrollbar");
  });
});

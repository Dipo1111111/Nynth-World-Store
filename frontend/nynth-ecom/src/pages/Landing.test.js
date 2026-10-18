// THE LANDING PAGE IS NEVER DARK.
//
// Founder's rule, 17 Oct 2026, verbatim: "NEVER EVER, UNLESS EXPLICITLY
// MENTIONED, CHANGE THE LANDING PAGE TO DARK MODE. THE PAGE IS MOSTLY WHITE.
// NEVER USE THAT."
//
// An earlier version of this page was a full-bleed dark split panel with a black
// overlay, which is exactly what he rejected. This test exists so that mistake
// cannot come back quietly. If it fails, the rule was broken and Dipo has to be
// told, not worked around.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const landing = readFileSync(resolve(process.cwd(), "src/pages/Landing.jsx"), "utf8");

describe("landing page stays mostly white", () => {
  it("states the rule in the source, in his words", () => {
    expect(landing).toContain("NEVER EVER");
    expect(landing).toContain("MOSTLY WHITE");
  });

  it("renders on white, with no dark page background", () => {
    expect(landing).toContain('bg-white');
    // No near-black page or section surface. The admin ink is #0a0a0a/#0c0c0c
    // and the old rejected design used exactly those.
    for (const dark of ["bg-[#0a0a0a]", "bg-[#0c0c0c]", "bg-[#0b0b0c]", "bg-neutral-900", "bg-zinc-900", "bg-gray-900"]) {
      expect(landing).not.toContain(dark);
    }
    // The only permitted black usage is a low-alpha tint on a card tile, written
    // as bg-black/[0.02], which reads as near-white. A solid bg-black is banned.
    const solidBlack = landing.match(/bg-black(?!\/\[0?\.)/g) ?? [];
    expect(solidBlack).toEqual([]);
  });

  it("has no dark image overlay or gradient scrim", () => {
    // The rejected version darkened photos with from-black/75 to sit text on
    // them. Labels now sit under the image on white, so no scrim is needed.
    expect(landing).not.toContain("from-black");
    expect(landing).not.toContain("via-black");
    expect(landing).not.toContain("bg-gradient-to-t");
    expect(landing).not.toContain("text-white");
  });

  it("offers no theme switch on the landing page", () => {
    // A dark-mode toggle here would be the first step to a dark landing page.
    expect(landing).not.toContain("darkMode");
    expect(landing).not.toContain("dark-mode");
    expect(landing).not.toMatch(/\bMoon\b|\bSun\b/);
  });

  it("keeps both boxes and the brand red labels from his vision", () => {
    expect(landing).toContain("NYNTH WORLD STORE");
    expect(landing).toContain("TICKET STORE");
    expect(landing).toContain("Founded by Newman Yange");
    expect(landing).toContain("By Winners, For Winners");
    expect(landing).toContain("Est. 2022");
  });

  it("ships default images from real products, so it is never artless", () => {
    expect(landing).toContain("DEFAULT_STORE_IMAGE");
    expect(landing).toContain("DEFAULT_TICKET_IMAGE");
    expect(landing).toMatch(/https:\/\/res\.cloudinary\.com/);
  });

  it("still lets the founder override both images from the panel", () => {
    expect(landing).toContain("landing.storeImage");
    expect(landing).toContain("landing.ticketImage");
  });

  it("still routes to the shop and to tickets", () => {
    expect(landing).toContain('to="/shop"');
    expect(landing).toContain('to="/tickets"');
  });
});

describe("brand red token is defined once, for the storefront", () => {
  const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");
  it("exists on :root so both the labels and the founder line use it", () => {
    expect(css).toContain("--brand-red:");
  });
});

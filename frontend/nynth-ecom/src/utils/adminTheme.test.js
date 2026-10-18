// Admin light/dark theme. Newman asked for this 17 Oct 2026: "Please at the
// very top of this admin panel setting let there be toggle light or dark mode
// off. I'm more of a light mode person, I usually have struggles with reading
// this dark mode."
//
// The mechanism is a token layer. .admin-app holds the admin surface tokens,
// .admin-app[data-theme='light'] moves them to paper, and the pages reference
// only the tokens. So these tests guard three things: the tokens exist in both
// themes, the admin no longer hardcodes the ink hexes that would ignore the
// switch, and the switch is actually reachable at the top of Settings.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const css = read("src/index.css");

const adminFiles = [
  ...readdirSync(resolve(process.cwd(), "src/pages/admin")).map((f) => `src/pages/admin/${f}`),
  ...readdirSync(resolve(process.cwd(), "src/components/admin")).map((f) => `src/components/admin/${f}`),
].filter((f) => f.endsWith(".jsx") || f.endsWith(".js"));

describe("admin token layer", () => {
  it("defines every admin surface token in the dark theme", () => {
    const dark = css.slice(css.indexOf(".admin-app {"), css.indexOf(".admin-app[data-theme='light']"));
    for (const token of [
      "--admin-page",
      "--admin-surface",
      "--admin-ink",
      "--admin-on-ink",
      "--admin-accent",
      "--admin-accent-hover",
    ]) {
      expect(dark).toContain(token + ":");
    }
  });

  it("defines the same tokens in the light theme", () => {
    const light = css.slice(css.indexOf(".admin-app[data-theme='light']"));
    for (const token of [
      "--admin-page",
      "--admin-surface",
      "--admin-ink",
      "--admin-on-ink",
      "--admin-accent",
      "--admin-accent-hover",
    ]) {
      expect(light).toContain(token + ":");
    }
  });

  it("makes light actually light and dark actually dark", () => {
    const light = css.slice(css.indexOf(".admin-app[data-theme='light']"));
    expect(light).toContain("--admin-ink: #0c0c0c");
    expect(light).toContain("--admin-surface: #ffffff");
    const dark = css.slice(css.indexOf(".admin-app {"), css.indexOf(".admin-app[data-theme='light']"));
    expect(dark).toContain("--admin-ink: #edeae2");
    expect(dark).toContain("--admin-surface: #0a0a0a");
  });

  it("un-inverts the wordmark on paper, since the rail becomes light", () => {
    const light = css.slice(css.indexOf(".admin-app[data-theme='light']"));
    expect(light).toContain("admin-logo-invert");
    expect(light).toContain("filter: none");
  });
});

describe("no admin page hardcodes the ink palette", () => {
  // A page with literal #0a0a0a / #EDEAE2 ignores the switch entirely and
  // stays dark in light mode. That was the whole problem before this refactor.
  const banned = ["#0a0a0a", "#0b0b0c", "#0d0d0f", "#EDEAE2", "#EDEAE2", "#0c0c0c", "#DBD8CE"];

  it("finds no banned hex anywhere in the admin tree", () => {
    const offenders = [];
    for (const f of adminFiles) {
      const text = read(f);
      for (const hex of banned) {
        if (text.includes(hex)) offenders.push(`${f} -> ${hex}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("finds at least one token reference, so the check is not vacuous", () => {
    const total = adminFiles.reduce((n, f) => n + (read(f).match(/--admin-/g) ?? []).length, 0);
    expect(total).toBeGreaterThan(500);
  });
});

describe("the theme switch is reachable", () => {
  it("sits at the very top of Settings, as asked", () => {
    const settings = read("src/pages/admin/Settings.jsx");
    const appearance = settings.indexOf('title="Appearance"');
    expect(appearance).toBeGreaterThan(-1);
    // Before any other settings section.
    expect(appearance).toBeLessThan(settings.indexOf('id="set-store"'));
    expect(settings).toContain("toggleTheme");
    expect(settings).toContain('aria-pressed={theme === "light"}');
  });

  it("is also on every admin screen, since comfort is not a per-page choice", () => {
    const layout = read("src/components/admin/AdminLayout.jsx");
    expect(layout).toContain("data-theme={theme}");
    expect(layout).toContain("useAdminTheme");
    expect(layout).toContain("toggle");
  });

  it("defaults to light, because that is the stated preference", () => {
    const hook = read("src/hooks/useAdminTheme.js");
    expect(hook).toContain('const DEFAULT_THEME = "light"');
    expect(hook).toContain("nynth_admin_theme");
  });
});

describe("the storefront is untouched by the admin theme switch", () => {
  // The admin theme must not leak onto the shop or the landing page. The
  // landing page in particular has its own hard rule: never dark.
  it("scopes the attribute to .admin-app only", () => {
    expect(css).toContain(".admin-app[data-theme='light']");
    const bare = css.match(/^\[data-theme='light'\]/m);
    expect(bare).toBeNull();
  });

  it("does not put the admin theme attribute on the public layout", () => {
    const app = read("src/App.jsx");
    expect(app).not.toContain("admin-theme");
  });
});

describe("the two switches cannot disagree", () => {
  // Regression guard. The floating AdminLayout button and the Appearance
  // toggle in Settings are separate components, each with its own hook
  // instance. The first version kept independent state, so whichever component
  // re-rendered last would overwrite the other's choice. One module-level
  // owner plus a subscriber list is what keeps them in step.
  const hook = read("src/hooks/useAdminTheme.js");

  it("keeps a single module-level current value", () => {
    expect(hook).toMatch(/let current\s*=/);
  });

  it("subscribes every instance to changes", () => {
    expect(hook).toContain("listeners.add");
    expect(hook).toContain("return subscribe(");
  });

  it("paints the admin root, not the document, so the storefront is unaffected", () => {
    expect(hook).toContain('document.querySelector(".admin-app")');
    expect(hook).not.toContain("documentElement");
  });

  it("persists the choice", () => {
    expect(hook).toContain("localStorage.setItem");
  });
});

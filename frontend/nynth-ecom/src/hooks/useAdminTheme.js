import { useCallback, useEffect, useState } from "react";

// Admin light/dark theme. Newman asked for this 17 Oct 2026: "Please at the very
// top of this admin panel setting let there be toggle light or dark mode off.
// I'm more of a light mode person, I usually have struggles with reading this
// dark mode."
//
// Light is therefore the default, and the choice is remembered per browser.
//
// There are two switches on screen at once: the floating button in AdminLayout
// and the Appearance toggle at the top of Settings. They are separate
// components, so each has its own copy of this state. Without a bus they would
// drift and whichever re-rendered last would win, silently reverting the other.
// So one place owns the truth (the module below) and every instance subscribes.
const KEY = "nynth_admin_theme";
const THEMES = ["light", "dark"];
const DEFAULT_THEME = "light";

const isTheme = (v) => THEMES.includes(v);

const read = () => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Private browsing or blocked storage: fall through to the default.
  }
  return DEFAULT_THEME;
};

const persist = (theme) => {
  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // Nothing to do. The toggle still works for this session.
  }
};

const listeners = new Set();
let current = typeof window === "undefined" ? DEFAULT_THEME : read();

// The token layer lives on .admin-app, so that is the element that gets the
// attribute. Nothing outside the admin is touched.
const paint = (theme) => {
  if (typeof document === "undefined") return;
  const root = document.querySelector(".admin-app");
  if (root) root.setAttribute("data-theme", theme);
};

const commit = (next) => {
  current = next;
  persist(next);
  paint(next);
  listeners.forEach((fn) => fn(next));
};

const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useAdminTheme() {
  // Seeded synchronously from storage, so the first admin paint is already in
  // the right theme and there is no flash of the other one.
  const [theme, setThemeState] = useState(current);

  useEffect(() => {
    paint(current);
    return subscribe(setThemeState);
  }, []);

  const setTheme = useCallback((next) => {
    if (!isTheme(next) || next === current) return;
    commit(next);
  }, []);

  const toggle = useCallback(() => {
    commit(current === "light" ? "dark" : "light");
  }, []);

  return { theme, setTheme, toggle, isLight: theme === "light" };
}

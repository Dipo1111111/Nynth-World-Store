// Motion helpers for the admin — lean GSAP wrappers only.
// GSAP is already bundled for the storefront, so nothing new is shipped.

import gsap from "gsap";
import { useEffect, useRef } from "react";

// Animate a number from 0 to `value` every time value changes.
export function useCountUp(value, { duration = 0.9, decimals = 0 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current == null) return;
    const obj = { v: 0 };
    const tween = gsap.to(obj, {
      v: Number(value) || 0,
      duration,
      ease: "power2.out",
      onUpdate: () => {
        if (ref.current) {
          ref.current.textContent = obj.v.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
        }
      },
    });
    return () => tween.kill();
  }, [value, duration, decimals]);

  return ref;
}

// After mount, reveal `selector` children within `scope` with a stagger.
// Skips reduced-motion users. Re-runs when `enabled` flips true (e.g. once
// data has loaded). Clears its own inline styles so hover transforms win.
export function useStaggerReveal(selector, { stagger = 0.06, y = 16, enabled = true } = {}) {
  const scopeRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const scope = scopeRef.current;
    const targets = scope ? scope.querySelectorAll(selector) : [];
    if (!targets.length) return;

    const prefersReduced = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    gsap.fromTo(
      targets,
      { autoAlpha: 0, y },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        stagger,
        clearProps: "transform,opacity,visibility",
      }
    );
  }, [selector, stagger, y, enabled]);

  return scopeRef;
}
// The one admin switch.
//
// The settings page had three different switches: two button based ones, a
// peer checkbox one, and one more that used a different size again. They did
// not match each other, and the peer ones were painted with a hardcoded
// white, so in light mode they were white on white and simply could not be
// seen.
//
// One shape now: a 44 by 24 pill with a 20 pixel knob that slides. The track
// and the knob take their colour from the admin tokens, so the switch reads
// the same on ink and on paper.
import React from "react";

export default function Toggle({ checked, onChange, label, disabled = false, describedBy }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-ring disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? "border-transparent bg-[var(--admin-accent)]"
          : "border-[var(--admin-ink)]/20 bg-[var(--admin-ink)]/[0.12]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all duration-200 ease-out ${
          checked
            ? "translate-x-5 bg-[var(--admin-on-ink)]"
            : "bg-[var(--admin-ink)]/45"
        }`}
      />
    </button>
  );
}

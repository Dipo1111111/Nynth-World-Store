// The one admin badge.
//
// A badge is a status, and a status has to be readable in both themes. The
// admin was using raw Tailwind palette values for them, which meant
// text-slate-300 on a slate tint, light grey on light grey, invisible on
// the paper admin.
//
// The tint tokens already exist for exactly this and they already flip with
// the theme, so they are the only palette a badge is allowed to use.
import React from "react";

const TINTS = ["emerald", "amber", "rose", "sky", "violet", "slate"];

const VARIANTS = {
  // The strongest badge. Used when the state is the point of the row.
  ink: "bg-[var(--admin-accent)] text-[var(--admin-on-ink)] border border-[var(--admin-ink)]/25",
  // A quiet badge for a neutral state.
  neutral:
    "bg-[var(--admin-ink)]/[0.06] text-[var(--admin-ink)]/75 border border-[var(--admin-ink)]/12",
  ...Object.fromEntries(
    TINTS.map((tint) => [
      tint,
      `bg-[var(--tint-${tint}-bg)] text-[var(--tint-${tint}-fg)] border border-[var(--tint-${tint}-line)]`,
    ])
  ),
};

export default function AdminBadge({ variant = "neutral", className = "", children, ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
        VARIANTS[variant] ?? VARIANTS.neutral
      } ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}

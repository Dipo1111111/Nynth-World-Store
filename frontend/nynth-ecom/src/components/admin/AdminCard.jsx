// The one admin card.
//
// Three levels and nothing else. Every page was inventing its own, with
// rounded-2xl, rounded-3xl, plain divs, white fills and no border at all.
//
//   default  a panel, a hairline and the card shadow
//   inset    a group inside a panel, a tint of the ink and no shadow
//   plain    a group with no surface of its own
import React from "react";

const LEVELS = {
  default:
    "bg-[var(--admin-surface)] border border-[var(--admin-ink)]/10 shadow-card",
  inset: "bg-[var(--admin-ink)]/[0.04] border border-[var(--admin-ink)]/10",
  // An empty state. The dashed edge says there is something to put here.
  dashed:
    "bg-[var(--admin-surface)] border border-dashed border-[var(--admin-ink)]/22 shadow-card",
  plain: "bg-transparent border border-transparent",
};

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function AdminCard({
  level = "default",
  padding = "none",
  hover = false,
  className = "",
  children,
  ...rest
}) {
  return (
    <div
      className={`rounded-xl ${LEVELS[level] ?? LEVELS.default} ${PADDING[padding] ?? ""} ${
        hover
          ? "transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-card-hover"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

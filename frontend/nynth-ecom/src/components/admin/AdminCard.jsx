// The one admin card.
//
// Three levels and nothing else. Every page was inventing its own, with
// rounded-2xl, rounded-3xl, plain divs, white fills and no border at all.
//
// The surface itself lives in index.css as `.admin-panel`, so a hand-rolled
// panel and this component are the same material. If a page needs a surface
// it uses one of these levels, never its own fill.
//
//   default  an ordinary card, shell or group
//   raised   the lead block on a page, one per page at most
//   inset    a group inside a card, a stat tile
//   dashed   the empty state
//   plain    a group with no surface of its own
import React from "react";

const LEVELS = {
  default: "admin-panel",
  raised: "admin-panel admin-panel-raised",
  inset: "admin-panel admin-panel-inset",
  dashed: "admin-panel admin-panel-dashed",
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
        hover ? "admin-panel-hover" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

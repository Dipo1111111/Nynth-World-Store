// The one admin stat card.
//
// A label, a number, and an icon chip that says what the number is about.
// The chip takes a tint, because a hardcoded palette value in the chip is
// what made the icon unreadable on the paper admin.
//
// The number is the one place the admin is allowed to be loud, so it gets
// the display treatment: big, tight and tabular.
import React from "react";
import AdminCard from "./AdminCard";

const TINTS = ["emerald", "amber", "rose", "sky", "violet", "slate"];

export default function StatCard({
  label,
  value,
  icon: Icon,
  tint = "slate",
  className = "",
  children,
}) {
  const chip =
    TINTS.includes(tint)
      ? `bg-[var(--tint-${tint}-bg)] text-[var(--tint-${tint}-fg)]`
      : "bg-[var(--admin-ink)]/[0.06] text-[var(--admin-ink)]/70";

  return (
    <AdminCard hover className={className}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/55">
            {label}
          </span>
          {Icon && (
            <span
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${chip}`}
              aria-hidden="true"
            >
              <Icon size={17} strokeWidth={2} />
            </span>
          )}
        </div>
        <div className="text-[28px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-[var(--admin-ink)]">
          {value}
        </div>
        {children}
      </div>
    </AdminCard>
  );
}

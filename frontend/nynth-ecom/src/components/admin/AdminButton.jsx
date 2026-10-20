// The one admin button.
//
// The admin had 4 to 27 different button class strings per page, each one
// hand rolled: a different radius, a different padding, a different hover,
// a different focus ring, and a hardcoded white or black underneath. The
// four variants here are the four intents that actually exist in the back
// office, and every state they need is decided once.
//
//   primary    the one action on a screen, the accent fill
//   secondary  a real action that is not the main one, an outline
//   ghost      a quiet action, a link that behaves like a button
//   danger     the destructive action
import React from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-[var(--admin-accent)] text-[var(--admin-on-ink)] border border-transparent hover:opacity-90",
  secondary:
    "bg-[var(--admin-surface)] text-[var(--admin-ink)] border border-[var(--admin-ink)]/18 hover:border-[var(--admin-ink)]/32 hover:bg-[var(--admin-hover)]",
  ghost:
    "bg-transparent text-[var(--admin-ink)]/70 border border-transparent hover:text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]",
  danger:
    "bg-[var(--tint-rose-bg)] text-[var(--tint-rose-fg)] border border-[var(--tint-rose-line)] hover:bg-[var(--tint-rose-fg)] hover:text-[var(--admin-surface)]",
};

const SIZES = {
  sm: "h-9 px-3 text-[10px] tracking-[0.14em]",
  md: "h-10 px-4 text-[10px] tracking-[0.16em]",
  block: "w-full h-11 px-4 text-[10px] tracking-[0.18em]",
};

export default function AdminButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  iconRight: IconRight,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-bold uppercase transition-all duration-150 focus-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed ${
        VARIANTS[variant] ?? VARIANTS.primary
      } ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon size={14} className="shrink-0" aria-hidden="true" />
      )}
      {children}
      {IconRight && !loading && <IconRight size={14} className="shrink-0" aria-hidden="true" />}
    </button>
  );
}

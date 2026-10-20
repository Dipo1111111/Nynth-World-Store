// The one admin modal.
//
// Every page wrote its own: a black scrim, a panel with its own radius, a
// title block and a close button. The radii alone were 2xl, 3xl and none at
// all, and the close button was four different things.
//
// The scrim stays black in both themes, because a scrim is a scrim. The
// panel is a panel, so it follows the theme.
import React, { useEffect } from "react";
import { X } from "lucide-react";

const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export default function AdminModal({
  onClose,
  title,
  eyebrow,
  size = "md",
  closeOnScrim = true,
  children,
  footer,
}) {
  // Escape closes it, which is the expectation for a dialog.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300"
      onClick={(e) => {
        if (closeOnScrim && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className={`bg-[var(--admin-surface)] rounded-xl w-full ${SIZES[size] ?? SIZES.md} shadow-raised animate-in zoom-in-95 duration-300 border border-[var(--admin-ink)]/10 my-auto max-h-[90vh] overflow-y-auto`}
      >
        {(title || eyebrow) && (
          <div className="flex justify-between items-start gap-4 p-6 border-b border-[var(--admin-ink)]/10">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/55 mb-1">
                  {eyebrow}
                </p>
              )}
              {title && <h2 className="text-xl font-bold text-[var(--admin-ink)]">{title}</h2>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="focus-ring p-2 -mr-2 -mt-1 hover:bg-[var(--admin-hover)] rounded-lg text-[var(--admin-ink)]/42 hover:text-[var(--admin-ink)] transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 pt-0">{footer}</div>}
      </div>
    </div>
  );
}

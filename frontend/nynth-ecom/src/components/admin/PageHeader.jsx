// The one admin page header.
//
// Five pages were writing the same three lines: an eyebrow, a title and a
// line of description, each one a different size and a different shade of
// grey. The eyebrow was the one thing on the page that was set in 10px
// capitals, which is the voice for a label and not for a page.
//
// The actions slot holds the page's own buttons, so the header and the
// actions sit on one line on a wide screen and stack on a narrow one.
import React from "react";

export default function PageHeader({ eyebrow, title, description, actions, className = "" }) {
  return (
    <div className={`mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/55 mb-1">
            {eyebrow}
          </p>
        )}
        {title && <h2 className="text-2xl font-bold text-[var(--admin-ink)]">{title}</h2>}
        {description && (
          <p className="text-sm text-[var(--admin-ink)]/55 mt-1 leading-relaxed max-w-[68ch]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

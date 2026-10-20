// The one admin page intro.
//
// The page title belongs to AdminLayout, which renders it once at the top of
// every admin page. This component carries the rest of the intro: an optional
// eyebrow, the one description line, and the page actions. It used to render
// its own title too, which is how Lookbooks ended up with two headings of two
// different sizes on one screen.
//
// The actions slot holds the page's own buttons, so the intro and the actions
// sit on one line on a wide screen and stack on a narrow one.
import React from "react";

export default function PageHeader({ eyebrow, description, actions, className = "" }) {
  return (
    <div className={`mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/55 mb-1">
            {eyebrow}
          </p>
        )}
        {description && (
          <p className="text-xs text-[var(--admin-ink)]/55 mt-1 leading-relaxed max-w-[68ch]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}

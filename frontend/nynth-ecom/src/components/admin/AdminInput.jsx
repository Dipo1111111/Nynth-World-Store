// The one admin input.
//
// The same job everywhere: a field you type into, a field you search, a
// field you pick from, a field you write a paragraph in. The colour comes
// from the admin tokens, so the placeholder is dark on the paper admin and
// bone on the ink admin, which is the fix for the white on white placeholder
// the paper theme used to have.
import React from "react";

const BASE =
  "w-full rounded-lg border border-[var(--admin-ink)]/14 bg-[var(--admin-surface)] px-3 py-2 text-sm text-[var(--admin-ink)] placeholder:text-[var(--admin-placeholder)] transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed";

export function AdminInput({ className = "", icon: Icon, ...rest }) {
  if (Icon) {
    return (
      <div className="relative">
        <Icon
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-ink)]/42"
          aria-hidden="true"
        />
        <input className={`${BASE} pl-9 ${className}`} {...rest} />
      </div>
    );
  }
  return <input className={`${BASE} ${className}`} {...rest} />;
}

export function AdminTextarea({ className = "", rows = 4, ...rest }) {
  return <textarea rows={rows} className={`${BASE} resize-y leading-relaxed ${className}`} {...rest} />;
}

export function AdminSelect({ className = "", children, ...rest }) {
  return (
    <select
      className={`${BASE} cursor-pointer appearance-none pr-8 ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export default AdminInput;

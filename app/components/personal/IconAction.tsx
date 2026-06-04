"use client";

import type { ReactNode } from "react";

/** Minimal icon button: shows only the glyph; the label slides in on hover/focus.
 *  State is conveyed by the icon (outline → filled) so no text is needed at rest. */
export function IconAction({
  icon,
  label,
  active = false,
  ariaLabel,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  ariaLabel: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      className="group tap inline-flex items-center justify-center transition-colors hover:text-[var(--dusty-terracotta)]"
    >
      <span
        aria-hidden
        className="text-xl leading-none transition-colors"
        style={{ color: active ? "var(--dusty-terracotta)" : "currentColor" }}
      >
        {icon}
      </span>
      <span className="type-caps max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[12rem] group-hover:opacity-100 group-focus:ml-2 group-focus:max-w-[12rem] group-focus:opacity-100">
        {label}
      </span>
    </button>
  );
}

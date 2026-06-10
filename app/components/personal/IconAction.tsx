"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Minimal icon button: shows only the glyph; the label slides in on hover/focus.
 *  State is conveyed by the icon (outline → filled) so no text is needed at rest.
 *  On touch devices (no hover), the first tap peeks the label for ~1.5s; a second
 *  tap while it's visible triggers the action. */
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
  const [canHover, setCanHover] = useState(true);
  const [peeking, setPeeking] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover)");
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  useEffect(
    () => () => {
      if (peekTimer.current) clearTimeout(peekTimer.current);
    },
    [],
  );

  const handleClick = (e: React.MouseEvent) => {
    // On touch (no hover), first tap reveals the label; second tap acts.
    if (!canHover && !peeking) {
      e.preventDefault();
      setPeeking(true);
      if (peekTimer.current) clearTimeout(peekTimer.current);
      peekTimer.current = setTimeout(() => setPeeking(false), 1500);
      return;
    }
    if (peekTimer.current) clearTimeout(peekTimer.current);
    setPeeking(false);
    onClick(e);
  };

  const labelClass = peeking
    ? "type-caps overflow-hidden whitespace-nowrap transition-all duration-300 ml-2 max-w-[12rem] opacity-100"
    : "type-caps max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[12rem] group-hover:opacity-100 group-focus:ml-2 group-focus:max-w-[12rem] group-focus:opacity-100";

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={handleClick}
      className="group tap inline-flex items-center justify-center transition-colors hover:text-[var(--dusty-terracotta)]"
    >
      <span
        aria-hidden
        className="text-xl leading-none transition-colors"
        style={{ color: active ? "var(--dusty-terracotta)" : "currentColor" }}
      >
        {icon}
      </span>
      <span className={labelClass}>{label}</span>
    </button>
  );
}

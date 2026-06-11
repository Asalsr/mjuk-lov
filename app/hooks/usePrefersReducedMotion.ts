'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the user has asked the OS to reduce motion
 * (`prefers-reduced-motion: reduce`).
 *
 * Use this to skip JS-driven motion that CSS alone can't neutralize —
 * mousemove/scroll parallax, the magnetic-button pull, the custom cursor,
 * and the loading intro. CSS-based transitions/animations are already
 * flattened globally by the matching @media rule in globals.css.
 *
 * SSR-safe: returns false on the server and first client render, then
 * updates after mount.
 */
export const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
};

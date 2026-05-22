'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the primary input device is touch (no fine pointer).
 * Use this to gate hover-only effects (custom cursor, magnetic buttons,
 * mousemove parallax) so they don't render on touch devices.
 *
 * SSR-safe: returns false on the server and on first client render, then
 * updates after mount if the device is actually touch.
 */
export const useIsTouch = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isTouch;
};

'use client';

import { useEffect, useState } from 'react';
import { useIsTouch } from '../hooks/useIsTouch';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const isTouch = useIsTouch();
  const reduced = usePrefersReducedMotion();
  // Disable for touch devices AND for reduced-motion users — a cursor that
  // follows the pointer is motion, and hiding the system cursor (cursor:none)
  // would defeat OS cursor magnification / large-cursor accessibility settings.
  const disabled = isTouch || reduced;

  useEffect(() => {
    if (disabled) return;

    const updateCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a')
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    document.documentElement.style.cursor = 'none';
    window.addEventListener('mousemove', updateCursor);
    window.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.documentElement.style.cursor = '';
      window.removeEventListener('mousemove', updateCursor);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [disabled]);

  if (disabled) return null;

  return (
    <>
      <div
        className="fixed pointer-events-none z-[9999] transition-transform duration-100 ease-out"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : 1})`,
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--dusty-terracotta)',
          opacity: isHovering ? 0.3 : 0.6
        }}
      />
      <div
        className="fixed pointer-events-none z-[9998] transition-all duration-300 ease-out"
        style={{
          left: position.x,
          top: position.y,
          transform: `translate(-50%, -50%) scale(${isHovering ? 2 : 1})`,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '1px solid var(--dusty-terracotta)',
          opacity: isHovering ? 0.5 : 0.2
        }}
      />
    </>
  );
};

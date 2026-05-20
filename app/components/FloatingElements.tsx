'use client';

import { useEffect, useState } from 'react';
import { FlourSack, Truffles, Butter } from './Icons';

/**
 * Floating decorative illustrations in the background, parallax on scroll.
 *
 * Note: the old monoline icons sat at 5% opacity. Watercolor illustrations
 * become muddy at that opacity, so I've raised it to ~12% — still soft and
 * background, but the artwork remains readable. Tune the opacity values
 * below to taste. Setting them to 0 hides this element entirely.
 */
export const FloatingElements = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden hidden lg:block">
      <div
        className="absolute"
        style={{
          top: '30%',
          right: '4%',
          opacity: 0.12,
          transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * 0.05}deg)`,
        }}
      >
        <FlourSack className="w-48 h-48" />
      </div>

      <div
        className="absolute"
        style={{
          top: '60%',
          left: '5%',
          opacity: 0.12,
          transform: `translateY(${scrollY * -0.1}px) rotate(${-scrollY * 0.03}deg)`,
        }}
      >
        <Truffles className="w-36 h-36" />
      </div>

      <div
        className="absolute"
        style={{
          top: '82%',
          right: '8%',
          opacity: 0.12,
          transform: `translateY(${scrollY * 0.08}px) rotate(${scrollY * 0.02}deg)`,
        }}
      >
        <Butter className="w-32 h-32" />
      </div>
    </div>
  );
};

'use client';

import { useEffect, useState } from 'react';

export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const updateProgress = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        setProgress(scrollPercent);
      });
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none"
      style={{ backgroundColor: 'var(--soft-peach)' }}
    >
      {/* GPU-friendly: animate transform (scaleX), not width, to avoid
          per-scroll layout recalculation. */}
      <div
        className="h-full w-full origin-left transition-transform duration-150"
        style={{
          transform: `scaleX(${progress / 100})`,
          backgroundColor: 'var(--dusty-terracotta)',
          boxShadow: '0 0 10px var(--dusty-terracotta)'
        }}
      />
    </div>
  );
};

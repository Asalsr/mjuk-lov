'use client';

import { useEffect, useState } from 'react';

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    const toggleVisibility = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIsVisible(window.scrollY > 500));
    };

    toggleVisibility();
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-50 hover:scale-110 hover:rotate-180 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
      style={{
        bottom: 'calc(2rem + var(--bottom-bar-clearance) + env(safe-area-inset-bottom))',
        right: 'calc(2rem + env(safe-area-inset-right))',
        backgroundColor: 'var(--dusty-terracotta)',
        color: 'var(--vanilla-cream)',
        boxShadow: '0 4px 20px rgba(168, 93, 78, 0.3)'
      }}
      aria-label="Back to top"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
};

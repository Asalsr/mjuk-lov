'use client';

import { useEffect, useState } from 'react';
import { DotsCluster, Flame, Pour } from './Icons';

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
        className="absolute opacity-5"
        style={{
          top: '30%',
          right: '5%',
          transform: `translateY(${scrollY * 0.15}px) rotate(${scrollY * 0.05}deg)`,
          color: 'var(--dusty-terracotta)'
        }}
      >
        <DotsCluster className="w-20 h-20" />
      </div>

      <div
        className="absolute opacity-5"
        style={{
          top: '60%',
          left: '8%',
          transform: `translateY(${scrollY * -0.1}px) rotate(${-scrollY * 0.03}deg)`,
          color: 'var(--dusty-terracotta)'
        }}
      >
        <Flame className="w-16 h-16" />
      </div>

      <div
        className="absolute opacity-5"
        style={{
          top: '80%',
          right: '12%',
          transform: `translateY(${scrollY * 0.08}px) rotate(${scrollY * 0.02}deg)`,
          color: 'var(--dusty-terracotta)'
        }}
      >
        <Pour className="w-18 h-18" />
      </div>
    </div>
  );
};

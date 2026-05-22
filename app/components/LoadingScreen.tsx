'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface LoadingScreenProps {
  onComplete: () => void;
}

const VISIBLE_DURATION_MS = 2000;
const EXIT_TRANSITION_MS = 350;

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setIsExiting(true), VISIBLE_DURATION_MS);
    const completeTimer = setTimeout(onComplete, VISIBLE_DURATION_MS + EXIT_TRANSITION_MS);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center overflow-hidden transition-opacity duration-[350ms] ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/videos/loading-bg.mp4" type="video/mp4" />
      </video>

      <div
        className="relative z-10"
        style={{ marginTop: '2.5vh', animation: 'pulse 2s ease-in-out infinite' }}
      >
        <Logo className="h-48 sm:h-72 md:h-96 lg:h-[524px]" />
      </div>
    </div>
  );
};

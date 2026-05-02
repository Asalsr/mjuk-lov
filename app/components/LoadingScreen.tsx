'use client';

import { useEffect, useState } from 'react';
import { WaxSeal } from './WaxSeal';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsExiting(true), 300);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center transition-all duration-1000 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--vanilla-cream)' }}
    >
      <div className="mb-8 transform" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
        <WaxSeal size={120} interactive />
      </div>

      <div
        className="lowercase italic mb-4"
        style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          letterSpacing: '0.04em'
        }}
      >
        mjuk lov
      </div>

      <div className="w-64 h-1 bg-[var(--soft-peach)] rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--dusty-terracotta)'
          }}
        />
      </div>
    </div>
  );
};

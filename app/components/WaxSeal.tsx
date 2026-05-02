'use client';

import { useState } from 'react';

export const WaxSeal = ({ size = 64, className = "", interactive = false }: { size?: number; className?: string; interactive?: boolean }) => {
  const [rotation, setRotation] = useState(0);

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full transition-all duration-500 ${
        interactive ? 'cursor-pointer hover:scale-110' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--dusty-terracotta)',
        color: 'var(--vanilla-cream)',
        transform: interactive ? `rotate(${rotation}deg)` : undefined,
        boxShadow: '0 4px 20px rgba(168, 93, 78, 0.3)'
      }}
      onMouseEnter={() => interactive && setRotation(15)}
      onMouseLeave={() => interactive && setRotation(0)}
    >
      <span
        className="italic select-none"
        style={{
          fontSize: size * 0.4,
          letterSpacing: '0.02em'
        }}
      >
        ml
      </span>
    </div>
  );
};

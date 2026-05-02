'use client';

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export const PipingCurl = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <path d="M12 36 Q12 24, 24 24 Q36 24, 36 12" strokeLinecap="round" />
    <path d="M24 24 Q30 20, 34 16" strokeLinecap="round" />
  </svg>
);

export const CardamomPod = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <ellipse cx="24" cy="24" rx="6" ry="12" strokeLinecap="round" />
    <line x1="24" y1="12" x2="24" y2="36" strokeLinecap="round" />
    <line x1="20" y1="20" x2="28" y2="20" strokeLinecap="round" />
    <line x1="20" y1="28" x2="28" y2="28" strokeLinecap="round" />
  </svg>
);

export const Candle = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <rect x="18" y="20" width="12" height="20" rx="1" strokeLinecap="round" />
    <path d="M24 16 Q26 14, 26 12 Q26 10, 24 10 Q22 10, 22 12 Q22 14, 24 16" strokeLinecap="round" />
    <line x1="24" y1="16" x2="24" y2="20" strokeLinecap="round" />
  </svg>
);

export const Leaf = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <path d="M12 36 Q12 20, 24 12 Q36 20, 36 36" strokeLinecap="round" />
    <path d="M24 12 L24 36" strokeLinecap="round" />
    <path d="M24 20 Q30 22, 32 28" strokeLinecap="round" />
    <path d="M24 28 Q18 30, 16 34" strokeLinecap="round" />
  </svg>
);

export const HeartOutline = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <path
      d="M24 40 C14 32, 8 26, 8 18 C8 12, 12 8, 16 8 C20 8, 22 10, 24 14 C26 10, 28 8, 32 8 C36 8, 40 12, 40 18 C40 26, 34 32, 24 40 Z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Flame = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <path d="M24 8 Q28 16, 28 24 Q28 32, 24 36 Q20 32, 20 24 Q20 16, 24 8 Z" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 20 Q26 24, 26 28 Q26 32, 24 34 Q22 32, 22 28 Q22 24, 24 20" strokeLinecap="round" />
  </svg>
);

export const Pour = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <path d="M28 12 L32 12 Q34 12, 34 14 L32 20" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="20" y="12" width="8" height="4" rx="1" strokeLinecap="round" />
    <path d="M26 20 Q30 24, 30 28 L30 32" strokeLinecap="round" />
    <circle cx="30" cy="34" r="2" />
  </svg>
);

export const DotsCluster = ({ className = 'w-12 h-12', ...rest }: IconProps) => (
  <svg viewBox="0 0 48 48" fill="none" className={className} stroke="currentColor" strokeWidth="1.5" {...rest}>
    <circle cx="24" cy="24" r="2" fill="currentColor" />
    <circle cx="18" cy="20" r="1.5" fill="currentColor" />
    <circle cx="30" cy="20" r="1.5" fill="currentColor" />
    <circle cx="18" cy="28" r="1.5" fill="currentColor" />
    <circle cx="30" cy="28" r="1.5" fill="currentColor" />
    <circle cx="24" cy="16" r="1" fill="currentColor" />
    <circle cx="24" cy="32" r="1" fill="currentColor" />
  </svg>
);

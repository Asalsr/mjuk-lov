'use client';

import { useRef, useState, MouseEvent, ReactNode } from 'react';
import { useIsTouch } from '../hooks/useIsTouch';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const MagneticButton = ({ children, className = '', style, onClick, type = 'button' }: MagneticButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isTouch = useIsTouch();

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (isTouch || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-300 ${className}`}
      style={{
        ...style,
        transform: isTouch ? undefined : `translate(${position.x}px, ${position.y}px)`
      }}
    >
      {children}
    </button>
  );
};

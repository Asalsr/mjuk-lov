'use client';

interface SectionDividerProps {
  fromColor: string;
  toColor: string;
}

export const SectionDivider = ({ fromColor, toColor }: SectionDividerProps) => {
  return (
    <div className="relative h-24 overflow-hidden" style={{ backgroundColor: fromColor }}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-full"
      >
        <path
          d="M0,0 Q300,60 600,50 T1200,20 L1200,120 L0,120 Z"
          fill={toColor}
          className="transition-all duration-1000"
        />
      </svg>
    </div>
  );
};

export const WaveDivider = ({ fromColor, toColor }: SectionDividerProps) => {
  return (
    <div className="relative h-20 overflow-hidden" style={{ backgroundColor: fromColor }}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="absolute bottom-0 w-full h-full"
      >
        <path
          d="M0,40 C150,80 350,0 600,40 C850,80 1050,0 1200,40 L1200,120 L0,120 Z"
          fill={toColor}
        />
      </svg>
    </div>
  );
};

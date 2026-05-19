'use client';

interface LogoProps {
  /** Visual height of the logo in pixels. Width scales automatically. */
  height?: number;
  className?: string;
  /** If true, makes the logo clickable, scrolling to top of page */
  asButton?: boolean;
}

/**
 * The Mjuk Lov logo — typographic monogram with "A SOFT PROMISE" tagline.
 * Replaces the old text-based wordmark.
 *
 * The logo file lives at /public/brand/logo.svg
 * The logo is dusty wine (#7a3a40) on transparent background.
 */
export const Logo = ({ height = 48, className = '', asButton = false }: LogoProps) => {
  const img = (
    <img
      src="/brand/logo.svg"
      alt="Mjuk Lov — a soft promise"
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      className={className}
    />
  );

  if (asButton) {
    return (
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="inline-flex items-center cursor-pointer transition-opacity hover:opacity-80"
        aria-label="Mjuk Lov — back to top"
      >
        {img}
      </button>
    );
  }

  return img;
};

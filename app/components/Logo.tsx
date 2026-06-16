'use client';

interface LogoProps {
  /** Visual height of the logo in pixels. Width scales automatically.
   *  Ignored if `className` includes a Tailwind height utility (h-*). */
  height?: number;
  /** Pass Tailwind height utilities (e.g. "h-12 md:h-20") for responsive sizing.
   *  When a height utility is present, the `height` prop is ignored. */
  className?: string;
  /** If true, makes the logo clickable, scrolling to top of page */
  asButton?: boolean;
}

const HAS_TAILWIND_HEIGHT = /(^|\s)(h-|sm:h-|md:h-|lg:h-|xl:h-|2xl:h-)/;

/**
 * The Mjuk Lov logo — typographic monogram with "A SOFT PROMISE" tagline.
 * Replaces the old text-based wordmark.
 *
 * The logo file lives at /public/brand/logo.svg
 * The logo is dusty wine (#7a3a40) on transparent background.
 *
 * Prefer className-based sizing (`<Logo className="h-12 md:h-20" />`)
 * for responsive layouts. The `height` prop is kept for backwards
 * compatibility and as a fallback when no height utility is provided.
 */
export const Logo = ({ height = 48, className = '', asButton = false }: LogoProps) => {
  const usingClassHeight = HAS_TAILWIND_HEIGHT.test(className);
  const img = (
    <img
      src="/brand/logo.svg"
      alt="Mjuk Lov: a soft promise"
      style={usingClassHeight
        ? { width: 'auto', display: 'block' }
        : { height: `${height}px`, width: 'auto', display: 'block' }}
      className={`${className} w-auto`}
    />
  );

  if (asButton) {
    return (
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="inline-flex items-center cursor-pointer transition-opacity hover:opacity-80"
        aria-label="Mjuk Lov. Back to top"
      >
        {img}
      </button>
    );
  }

  return img;
};

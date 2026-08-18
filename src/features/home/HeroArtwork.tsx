/**
 * Hero illustration: scales of justice over stacked books.
 *
 * Drawn in SVG against the brand tokens rather than shipped as a raster, so it
 * stays sharp and follows the theme. Purely decorative — hidden from assistive
 * tech.
 */
export function HeroArtwork({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 300"
      role="presentation"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="hero-book-a" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-600)" />
        </linearGradient>
        <linearGradient id="hero-book-b" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-600)" />
          <stop offset="100%" stopColor="var(--color-brand-800)" />
        </linearGradient>
        <linearGradient id="hero-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-300)" />
          <stop offset="100%" stopColor="var(--color-brand-600)" />
        </linearGradient>
      </defs>

      {/* Ambient shapes echoing the design's soft circles. */}
      <circle cx="248" cy="58" r="52" className="fill-brand-200/40" />
      <circle cx="70" cy="236" r="34" className="fill-brand-200/30" />

      {/* Columns, suggesting a courthouse, kept faint. */}
      <g className="fill-brand-200/50">
        <rect x="86" y="74" width="14" height="118" rx="7" />
        <rect x="112" y="62" width="14" height="130" rx="7" />
        <rect x="76" y="56" width="60" height="10" rx="5" />
      </g>

      {/* Books. */}
      <g>
        <rect x="66" y="236" width="196" height="30" rx="8" fill="url(#hero-book-b)" />
        <rect x="74" y="240" width="180" height="6" rx="3" className="fill-white/25" />
        <rect x="82" y="206" width="170" height="28" rx="8" fill="url(#hero-book-a)" />
        <rect x="90" y="210" width="154" height="6" rx="3" className="fill-white/30" />
      </g>

      {/* Scales. */}
      <g fill="url(#hero-metal)">
        <rect x="158" y="96" width="9" height="112" rx="4.5" />
        <rect x="130" y="196" width="65" height="11" rx="5.5" />
        <rect x="96" y="104" width="132" height="9" rx="4.5" />
        <circle cx="162.5" cy="92" r="12" />
      </g>
      <g
        stroke="var(--color-brand-500)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M102 113v22" />
        <path d="M223 113v22" />
      </g>
      <g fill="url(#hero-metal)" className="opacity-90">
        <path d="M78 136h48l-24 30z" />
        <path d="M199 136h48l-24 30z" />
      </g>
    </svg>
  )
}

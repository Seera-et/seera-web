import { cn } from '@/lib/utils/cn'

/**
 * The Seera mark: a violet hexagon holding a balance-scales glyph. One SVG so it
 * stays crisp at nav size and at hero size, and matches public/favicon.svg.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      role="presentation"
      aria-hidden="true"
      className={cn('size-9', className)}
    >
      <defs>
        <linearGradient id="seera-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-brand-400)" />
          <stop offset="100%" stopColor="var(--color-brand-700)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#seera-mark)"
        d="M16 1.85c1.1 0 2.2.28 3.17.84l7.66 4.42A6.33 6.33 0 0 1 30 12.6v6.8a6.33 6.33 0 0 1-3.17 5.49l-7.66 4.42a6.33 6.33 0 0 1-6.34 0l-7.66-4.42A6.33 6.33 0 0 1 2 19.4v-6.8a6.33 6.33 0 0 1 3.17-5.49l7.66-4.42A6.33 6.33 0 0 1 16 1.85Z"
      />
      <g
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M16 9.5v12" />
        <path d="M9.8 12.4h12.4" />
        <path d="M12.2 22.5h7.6" />
        <path d="M9.8 12.4 7.2 17.6h5.2z" fill="white" fillOpacity="0.25" />
        <path d="M22.2 12.4 19.6 17.6h5.2z" fill="white" fillOpacity="0.25" />
      </g>
    </svg>
  )
}

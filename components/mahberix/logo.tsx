import { brand } from "@/lib/brand"

/**
 * Mahberix brand mark — three people gathered around one table (a "mahber").
 * Flat emerald variant (brand/circle/mahberix-8-flat); uses the brighter
 * emerald-500 because the app shell is always dark.
 */
export function Logo({ className = "", showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 64 64" className="h-8 w-8 shrink-0 text-[#10b981]" role="img" aria-label={`${brand.name} logo`}>
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
          <path d="M24.29 23.81A12 12 0 0 1 39.71 23.81" />
          <path d="M43.82 30.92A12 12 0 0 1 36.10 44.28" />
          <path d="M27.90 44.28A12 12 0 0 1 20.18 30.92" />
        </g>
        <g fill="currentColor">
          <circle cx="32" cy="14.5" r="5.5" />
          <circle cx="48.02" cy="42.25" r="5.5" />
          <circle cx="15.98" cy="42.25" r="5.5" />
        </g>
      </svg>
      {showWordmark && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">{brand.name}</span>
      )}
    </span>
  )
}

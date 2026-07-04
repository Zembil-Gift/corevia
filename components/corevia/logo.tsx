import { brand } from "@/lib/brand"

/**
 * AfroDebab brand mark — a rounded triangular "A" leaf with a crescent cut-out,
 * filled with the brand's forest-green → lime gradient. The crescent is a true
 * transparent hole (even-odd fill) so the mark reads on any background.
 */
export function Logo({ className = "", showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 48 48" className="h-8 w-8 shrink-0" role="img" aria-label={`${brand.name} logo`}>
        <defs>
          <linearGradient id="afrodebab-mark" x1="24" y1="6" x2="30" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2d5a47" />
            <stop offset="0.55" stopColor="#3f9e63" />
            <stop offset="1" stopColor="#a7d84f" />
          </linearGradient>
        </defs>
        <path
          fill="url(#afrodebab-mark)"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 6c1.6 0 2.7.9 3.5 2.4L41 36.5c1.6 3 0 5.9-3.4 6.3-8.1 1-19.1 1-27.2 0C7 42.4 5.4 39.5 7 36.5L20.5 8.4C21.3 6.9 22.4 6 24 6Zm.5 10c4.5 3 4.5 13 0 16 2.5-5 2.5-11 0-16Z"
        />
      </svg>
      {showWordmark && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">{brand.name}</span>
      )}
    </span>
  )
}

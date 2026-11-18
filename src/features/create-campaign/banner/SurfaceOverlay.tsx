import { BANNER_SURFACES, cropRect, safeZone, toNumber, type Point, type Rect } from './bannerSpec'

const pct = (r: Rect) => ({
  left: `${r.x * 100}%`,
  top: `${r.y * 100}%`,
  width: `${r.w * 100}%`,
  height: `${r.h * 100}%`,
})

const SURFACE_STYLE: Record<string, string> = {
  web: 'border-sky-400/70',
  'app-detail': 'border-violet-400/80',
  'app-card': 'border-emerald-400/80',
}

export const SURFACE_SWATCH: Record<string, string> = {
  web: 'bg-sky-400',
  'app-detail': 'bg-violet-400',
  'app-card': 'bg-emerald-400',
}

/**
 * Draws, on top of a banner, the crop of every surface plus the shared safe zone.
 * Everything outside the safe zone is dimmed — that's the part at risk of being cut.
 */
export function SurfaceOverlay({
  imageRatio,
  focal,
  showLabels = true,
}: {
  imageRatio: number
  focal: Point
  showLabels?: boolean
}) {
  const safe = safeZone(imageRatio, focal)

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Dim everything outside the safe zone (box-shadow cut-out). */}
      <div
        className="absolute rounded-[2px] outline-2 outline-white outline-dashed shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]"
        style={pct(safe)}
      >
        {showLabels && (
          <span className="absolute left-1.5 top-1.5 rounded bg-white px-1.5 py-0.5 text-[10px] font-medium leading-none text-black">
            Area aman
          </span>
        )}
      </div>
      {BANNER_SURFACES.map((s) => (
        <div
          key={s.id}
          className={`absolute border-[1.5px] ${SURFACE_STYLE[s.id]}`}
          style={pct(cropRect(imageRatio, toNumber(s.ratio), focal))}
        />
      ))}
    </div>
  )
}

export function SurfaceLegend({ className = '' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-teks ${className}`}>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[2px] border border-dashed border-white" />
        Area aman (tampil di semua layar)
      </li>
      {BANNER_SURFACES.map((s) => (
        <li key={s.id} className="flex items-center gap-1.5">
          <span className={`size-2.5 rounded-[2px] ${SURFACE_SWATCH[s.id]}`} />
          {s.label} ({s.ratio.w}:{s.ratio.h})
        </li>
      ))}
    </ul>
  )
}

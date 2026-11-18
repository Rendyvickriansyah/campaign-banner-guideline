import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { objectPosition, type Point } from './bannerSpec'
import { SurfaceOverlay } from './SurfaceOverlay'

const clamp = (n: number) => Math.min(1, Math.max(0, n))
const STEP = 0.02

/**
 * Shows the uploaded banner uncropped with every surface's crop on top.
 * Drag (or arrow keys) to move the focal point; crops follow, exactly like `object-position`.
 */
export function FocalPointEditor({
  src,
  width,
  height,
  focal,
  onChange,
}: {
  src: string
  width: number
  height: number
  focal: Point
  onChange: (p: Point) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromPointer = (e: PointerEvent) => {
    const r = boxRef.current?.getBoundingClientRect()
    if (!r) return
    onChange({ x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const d = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key]
    if (!d) return
    e.preventDefault()
    onChange({ x: clamp(focal.x + d[0]), y: clamp(focal.y + d[1]) })
  }

  return (
    <div className="flex justify-center rounded-lg bg-black">
      <div
        ref={boxRef}
        className="relative max-h-[260px] max-w-full cursor-crosshair touch-none select-none overflow-hidden rounded-lg"
        style={{ aspectRatio: `${width} / ${height}`, height: width / height < 1.4 ? 260 : undefined, width: width / height < 1.4 ? undefined : '100%' }}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          setFromPointer(e)
        }}
        onPointerMove={(e) => dragging.current && setFromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img src={src} alt="" draggable={false} className="block size-full object-cover" style={{ objectPosition: objectPosition(focal) }} />
        <SurfaceOverlay imageRatio={width / height} focal={focal} />
        <button
          type="button"
          role="slider"
          aria-label="Titik fokus banner"
          aria-valuetext={`Horizontal ${Math.round(focal.x * 100)}%, vertikal ${Math.round(focal.y * 100)}%`}
          aria-valuenow={Math.round(focal.x * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          onKeyDown={onKeyDown}
          className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/80 shadow-[0_0_0_4px_rgb(0_0_0/0.35)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
          style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
        >
          <span className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        </button>
      </div>
    </div>
  )
}

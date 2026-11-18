import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { AlertIcon, EyeIcon, EyeOffIcon, UploadIcon } from '../../../components/icons'
import {
  BANNER_SPEC,
  BANNER_SURFACES,
  CANVAS_RATIO,
  CENTER,
  checkFile,
  checkResolution,
  cropRect,
  cropSize,
  exportCrop,
  formatBytes,
  objectPosition,
  readImage,
  toNumber,
  type Point,
  type SourceImage,
} from './bannerSpec'

export type ThumbnailResult = {
  /** 16:9 file to upload. Render it with object-fit: cover; object-position: center everywhere. */
  file: File
  url: string
  width: number
  height: number
  /** Kept so the admin can re-open the editor on the original image. */
  source: SourceImage
  focal: Point
}

const clamp = (n: number) => Math.min(1, Math.max(0, n))

const btn =
  'relative flex h-[42px] items-center justify-center gap-2 rounded-lg border border-white/10 px-5 text-base font-medium leading-[1.4] text-white shadow-card-inset [text-shadow:0_1px_2px_rgb(0_0_0/0.1)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40'

function SurfaceFrames({ opacity, hidden, empty }: { opacity: number; hidden: Set<string>; empty: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ opacity }}>
      {BANNER_SURFACES.filter((s) => !hidden.has(s.id)).map((s) => {
        const width = Math.min(1, toNumber(s.ratio) / CANVAS_RATIO) * 100
        const isCanvas = width === 100
        return (
          <div
            key={s.id}
            className={`absolute inset-y-0 border border-dashed ${isCanvas ? 'rounded-xl' : ''} ${isCanvas && empty ? 'bg-[#151515]' : ''}`}
            style={{ left: `${(100 - width) / 2}%`, width: `${width}%`, borderColor: s.color }}
          >
            <span
              className={`absolute top-px hidden px-2 py-[5px] sm:block text-[9px] font-medium uppercase leading-[1.3] tracking-[0.09px] whitespace-nowrap ${
                s.labelSide === 'left' ? 'left-px rounded-br-lg' : 'right-px rounded-bl-lg'
              } ${isCanvas ? 'rounded-tl-[11px]' : ''}`}
              style={{ background: s.labelBg, color: s.labelText }}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Mount only while open — state is initialised from props on every open. */
export function EditThumbnailModal({
  initial,
  initialFile,
  onClose,
  onDone,
}: {
  /** Previous result, to continue editing. */
  initial: ThumbnailResult | null
  /** File dropped on the Step 1 field before the modal opened. */
  initialFile: File | null
  onClose: () => void
  onDone: (r: ThumbnailResult) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; focal: Point } | null>(null)

  const [src, setSrc] = useState<SourceImage | null>(initial?.source ?? null)
  const [focal, setFocal] = useState<Point>(initial?.focal ?? CENTER)
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  const [opacity, setOpacity] = useState(80)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialFile) void load(initialFile)
    dialogRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && cancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  /** Drop a blob URL this modal created, unless it is the committed source. */
  const release = (s: SourceImage | null) => s && s.url !== initial?.source.url && URL.revokeObjectURL(s.url)

  async function load(file: File) {
    setError(null)
    const fail = checkFile(file).find((c) => c.status === 'fail')
    if (fail) return setError(fail.message)
    try {
      const next = await readImage(file)
      setSrc((prev) => {
        release(prev)
        return next
      })
      setFocal(CENTER)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function cancel() {
    release(src)
    onClose()
  }

  async function done() {
    if (!src) return
    setSaving(true)
    try {
      const out = await exportCrop(src, focal)
      if (initial && initial.source.url !== src.url) URL.revokeObjectURL(initial.source.url)
      onDone({ ...out, source: src, focal })
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  // Pan: the visible 16:9 window over a non-16:9 image.
  const visible = src ? cropRect(src.width / src.height, CANVAS_RATIO, focal) : null
  const canPan = !!visible && (visible.w < 0.999 || visible.h < 0.999)

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!canPan) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, focal }
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current
    const box = canvasRef.current?.getBoundingClientRect()
    if (!d || !box || !visible) return
    const dx = (e.clientX - d.x) / box.width
    const dy = (e.clientY - d.y) / box.height
    setFocal({
      x: visible.w < 1 ? clamp(d.focal.x - (dx * visible.w) / (1 - visible.w)) : 0.5,
      y: visible.h < 1 ? clamp(d.focal.y - (dy * visible.h) / (1 - visible.h)) : 0.5,
    })
  }
  function onCanvasKey(e: KeyboardEvent) {
    if (!src) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        inputRef.current?.click()
      }
      return
    }
    const d = { ArrowLeft: [-0.03, 0], ArrowRight: [0.03, 0], ArrowUp: [0, -0.03], ArrowDown: [0, 0.03] }[e.key]
    if (!d || !canPan) return
    e.preventDefault()
    setFocal((f) => ({ x: clamp(f.x + d[0]), y: clamp(f.y + d[1]) }))
  }
  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) void load(f)
  }

  const resolution = src ? checkResolution(cropSize(src, focal).width, cropSize(src, focal).height) : null
  const blocking = resolution?.status === 'fail'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={cancel}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-thumb-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[876px] flex-col overflow-hidden rounded-xl border border-white/10 bg-surface-1 outline-none"
      >
        <header className="flex shrink-0 items-center border-b border-white/10 p-6 sm:p-8">
          <h2 id="edit-thumb-title" className="text-xl font-medium leading-[1.4]">
            Edit Thumbnail
          </h2>
        </header>

        <div className="flex flex-col overflow-y-auto">
          {/* Canvas */}
          <div className="p-4 sm:p-8">
            <div className="rounded-[20px] border border-white/10 p-2 shadow-[0_1px_2px_rgb(15_23_42/0.02)]">
              <div
                ref={canvasRef}
                role={src ? 'img' : 'button'}
                tabIndex={0}
                aria-label={
                  src
                    ? `Pratinjau thumbnail${canPan ? '. Geser gambar atau pakai tombol panah untuk mengatur posisi.' : ''}`
                    : 'Pilih file thumbnail'
                }
                onClick={() => !src && inputRef.current?.click()}
                onKeyDown={onCanvasKey}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => (drag.current = null)}
                onPointerCancel={() => (drag.current = null)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`relative aspect-video w-full touch-none select-none overflow-hidden rounded-xl border bg-surface-0 shadow-[inset_0_2px_5px_rgb(0_0_0/0.15)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary ${
                  dragOver ? 'border-primary' : 'border-white/10'
                } ${src ? (canPan ? 'cursor-grab active:cursor-grabbing' : '') : 'cursor-pointer'}`}
              >
                {src && (
                  <img
                    src={src.url}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 size-full object-cover"
                    style={{ objectPosition: objectPosition(focal) }}
                  />
                )}

                <SurfaceFrames opacity={opacity / 100} hidden={hidden} empty={!src} />

                {!src && (
                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 text-center">
                    <UploadIcon className="text-[#e3e3e3]" />
                    <p className="text-sm text-[#e3e3e3] sm:text-base">
                      <span className="underline">Choose a file</span> or drag and drop it here
                    </p>
                    <p className="text-xs text-muted">
                      {BANNER_SPEC.recommended.width}×{BANNER_SPEC.recommended.height}px · {BANNER_SPEC.acceptedLabel} · maks.{' '}
                      {formatBytes(BANNER_SPEC.maxBytes)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {(error || (resolution && resolution.status !== 'pass') || canPan) && (
              <div className="mt-3 flex flex-col gap-1.5 text-xs leading-[1.4]" aria-live="polite">
                {error && (
                  <p role="alert" className="flex items-start gap-1.5 text-danger">
                    <AlertIcon size={14} className="mt-px shrink-0" /> {error}
                  </p>
                )}
                {resolution && resolution.status !== 'pass' && (
                  <p className={`flex items-start gap-1.5 ${resolution.status === 'fail' ? 'text-danger' : 'text-warning'}`}>
                    <AlertIcon size={14} className="mt-px shrink-0" /> {resolution.message}
                  </p>
                )}
                {canPan && (
                  <p className="text-teks">Gambar bukan 16:9. Geser gambar untuk memilih bagian yang ditampilkan.</p>
                )}
              </div>
            )}
          </div>

          {/* Legend + opacity */}
          <div className="flex flex-col gap-[30px] px-4 sm:px-8">
            <ul className="grid grid-cols-2 gap-x-5 gap-y-3 md:flex md:items-center md:justify-between">
              {BANNER_SURFACES.map((s) => {
                const isHidden = hidden.has(s.id)
                return (
                  <li key={s.id} className="flex items-center gap-5">
                    <span className={`flex items-center gap-3 ${isHidden ? 'opacity-40' : ''}`}>
                      <span className="size-3 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                      <span className="text-sm font-medium leading-[1.4] whitespace-nowrap sm:text-base">{s.label}</span>
                    </span>
                    <button
                      type="button"
                      aria-pressed={!isHidden}
                      aria-label={`${isHidden ? 'Tampilkan' : 'Sembunyikan'} overlay ${s.label}`}
                      onClick={() =>
                        setHidden((h) => {
                          const n = new Set(h)
                          if (n.has(s.id)) n.delete(s.id)
                          else n.add(s.id)
                          return n
                        })
                      }
                      className="-m-2 grid size-9 place-items-center rounded-md text-teks hover:bg-white/5 hover:text-white"
                    >
                      {isHidden ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                    </button>
                  </li>
                )
              })}
            </ul>

            <hr className="border-white/10" />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-base font-medium">
                <label htmlFor="overlay-opacity">Overlay Opacity</label>
                <output htmlFor="overlay-opacity">{opacity}%</output>
              </div>
              <input
                id="overlay-opacity"
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="range w-full"
                style={{ ['--fill' as string]: `${opacity}%` }}
              />
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center gap-4 p-4 sm:p-8">
          <button type="button" onClick={() => inputRef.current?.click()} className={`${btn} bg-[#141414]`}>
            <UploadIcon size={16} />
            Ganti Gambar
          </button>
          <div className="ml-auto flex gap-4">
            <button type="button" onClick={cancel} className={`${btn} w-[120px] bg-[#141414]`}>
              Kembali
            </button>
            <button
              type="button"
              onClick={done}
              disabled={!src || blocking || saving}
              className={`${btn} w-[120px] bg-brand hover:bg-[#ff5a12]`}
            >
              {saving ? 'Memproses…' : 'Selesai'}
            </button>
          </div>
        </footer>

        <input
          ref={inputRef}
          type="file"
          accept={BANNER_SPEC.acceptedTypes.join(',')}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void load(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

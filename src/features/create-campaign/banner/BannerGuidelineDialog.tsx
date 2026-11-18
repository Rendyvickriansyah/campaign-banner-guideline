import { useEffect, useRef } from 'react'
import { AlertIcon, CheckIcon, XIcon } from '../../../components/icons'
import { BANNER_SPEC, CENTER, formatBytes, safeZone, toNumber } from './bannerSpec'
import { SurfaceLegend, SurfaceOverlay } from './SurfaceOverlay'

const RATIO = toNumber(BANNER_SPEC.ratio)

const SPECS = [
  { label: 'Rasio', value: `${BANNER_SPEC.ratio.w}:${BANNER_SPEC.ratio.h}` },
  { label: 'Resolusi', value: `${BANNER_SPEC.recommended.width}×${BANNER_SPEC.recommended.height}px`, hint: `min. ${BANNER_SPEC.min.width}×${BANNER_SPEC.min.height}px` },
  { label: 'Format', value: BANNER_SPEC.acceptedLabel },
  { label: 'Ukuran', value: `Maks. ${formatBytes(BANNER_SPEC.maxBytes)}` },
]

/** Placeholder artwork used for the illustrations (no real image needed). */
function SampleArt({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(120%_90%_at_70%_10%,#7a3410_0%,#2a1206_45%,#0b0b0b_100%)]">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.04)_0_2px,transparent_2px_22px)]" />
      {children}
    </div>
  )
}

export function BannerGuidelineDialog({
  open,
  onClose,
  onContinue,
  continueLabel = 'Pilih Gambar',
}: {
  open: boolean
  onClose: () => void
  onContinue: () => void
  continueLabel?: string
}) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const safe = safeZone(RATIO, CENTER)

  useEffect(() => {
    if (!open) return
    primaryRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="banner-guide-title"
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-white/10 bg-surface-1 shadow-card-inset"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-stroke px-6 pb-4 pt-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Panduan banner</p>
            <h2 id="banner-guide-title" className="mt-1 text-xl font-medium leading-[1.4]">
              Supaya banner tidak terpotong di aplikasi
            </h2>
            <p className="mt-1 text-sm leading-[1.4] text-teks">
              Banner tampil di web dan mobile app dengan ukuran berbeda. Taruh teks, logo, dan wajah di dalam area aman.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="-mr-2 grid size-10 shrink-0 place-items-center rounded-lg text-teks hover:bg-white/5 hover:text-white"
          >
            <XIcon size={20} />
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
          {/* 1. Safe zone diagram */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">1. Kenali area aman</h3>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-stroke">
              <SampleArt />
              <SurfaceOverlay imageRatio={RATIO} focal={CENTER} showLabels={false} />
              <div
                className="absolute flex items-center justify-center text-center text-xs font-medium text-white"
                style={{ left: `${safe.x * 100}%`, top: `${safe.y * 100}%`, width: `${safe.w * 100}%`, height: `${safe.h * 100}%` }}
              >
                <span className="rounded bg-black/60 px-2 py-1">
                  Area aman · {Math.round(safe.w * 100)}% × {Math.round(safe.h * 100)}% dari tengah
                </span>
              </div>
            </div>
            <SurfaceLegend />
          </section>

          {/* 2. Specs */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">2. Ukuran file</h3>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SPECS.map((s) => (
                <div key={s.label} className="rounded-lg border border-stroke bg-field px-3 py-2.5">
                  <dt className="text-xs text-muted">{s.label}</dt>
                  <dd className="mt-0.5 text-sm font-medium">{s.value}</dd>
                  {s.hint && <dd className="text-[11px] text-muted">{s.hint}</dd>}
                </div>
              ))}
            </dl>
          </section>

          {/* 3. Do / Don't */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">3. Contoh</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <figure className="flex flex-col gap-2">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-success/50">
                  <SampleArt>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center">
                      <span className="text-lg font-bold tracking-tight">Klip.</span>
                      <span className="text-[11px] text-white/80">Rp1.000.000 / 1M views</span>
                    </div>
                  </SampleArt>
                </div>
                <figcaption className="flex items-start gap-1.5 text-xs leading-[1.4] text-teks">
                  <CheckIcon size={14} className="mt-px shrink-0 text-success" />
                  Teks & logo di tengah, background boleh penuh sampai tepi.
                </figcaption>
              </figure>
              <figure className="flex flex-col gap-2">
                <div className="relative aspect-video overflow-hidden rounded-lg border border-danger/50">
                  <SampleArt>
                    <span className="absolute left-2 top-2 text-lg font-bold tracking-tight">Klip.</span>
                    <span className="absolute bottom-2 right-2 text-[11px] text-white/80">Rp1.000.000 / 1M views</span>
                    {/* Parts cut on the 4:3 app header */}
                    <div className="absolute inset-y-0 left-0 w-[12.5%] bg-danger/35" />
                    <div className="absolute inset-y-0 right-0 w-[12.5%] bg-danger/35" />
                  </SampleArt>
                </div>
                <figcaption className="flex items-start gap-1.5 text-xs leading-[1.4] text-teks">
                  <AlertIcon size={14} className="mt-px shrink-0 text-danger" />
                  Teks di pojok/tepi akan terpotong di header app (area merah).
                </figcaption>
              </figure>
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-stroke px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] rounded-xl px-4 text-sm font-medium text-teks hover:bg-white/5 hover:text-white"
          >
            Nanti saja
          </button>
          <button
            ref={primaryRef}
            type="button"
            onClick={onContinue}
            className="h-[42px] rounded-xl bg-brand px-5 text-base font-medium text-white shadow-card-inset outline-offset-2 hover:bg-[#ff5a12] focus-visible:outline-2 focus-visible:outline-primary"
          >
            {continueLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}

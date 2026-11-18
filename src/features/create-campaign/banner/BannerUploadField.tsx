import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { AlertIcon, CheckIcon, InfoIcon, RefreshIcon, TrashIcon, UploadIcon, XIcon } from '../../../components/icons'
import { BannerGuidelineDialog } from './BannerGuidelineDialog'
import { FocalPointEditor } from './FocalPointEditor'
import { SurfaceLegend } from './SurfaceOverlay'
import { SurfacePreview } from './SurfacePreview'
import {
  BANNER_SPEC,
  CENTER,
  checkDimensions,
  checkFile,
  formatBytes,
  readImage,
  type BannerCheck,
  type Point,
} from './bannerSpec'

export type BannerValue = {
  file: File
  previewUrl: string
  width: number
  height: number
  /** Persist this with the campaign; web + app render with object-position from it. */
  focalPoint: Point
  checks: BannerCheck[]
  /** Admin confirmed text/logo sits inside the safe zone. */
  safeZoneConfirmed: boolean
}

export const isBannerReady = (v: BannerValue | null) =>
  !!v && v.safeZoneConfirmed && v.checks.every((c) => c.status !== 'fail')

const STATUS_STYLE = {
  pass: { Icon: CheckIcon, cls: 'text-success' },
  warn: { Icon: AlertIcon, cls: 'text-warning' },
  fail: { Icon: XIcon, cls: 'text-danger' },
} as const

function ChecksList({ checks }: { checks: BannerCheck[] }) {
  return (
    <ul className="grid gap-1.5" aria-label="Hasil pengecekan banner">
      {checks.map((c) => {
        const { Icon, cls } = STATUS_STYLE[c.status]
        return (
          <li key={c.id} className="flex items-start gap-2 text-xs leading-[1.4]">
            <Icon size={14} className={`mt-px shrink-0 ${cls}`} />
            <span className="w-20 shrink-0 text-muted">{c.label}</span>
            <span className={c.status === 'pass' ? 'text-teks' : cls}>{c.message}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function BannerUploadField({
  value,
  onChange,
  campaignTitle,
  label = 'Thumbnail',
}: {
  value: BannerValue | null
  onChange: (v: BannerValue | null) => void
  campaignTitle: string
  label?: string
}) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  /** Shown before the first upload of every new campaign (this component mounts per create flow). */
  const [guideSeen, setGuideSeen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Release the blob URL when the image is replaced or the form unmounts.
  const url = value?.previewUrl
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  async function accept(file: File) {
    setError(null)
    const fileChecks = checkFile(file)
    if (fileChecks.some((c) => c.status === 'fail')) {
      setError(fileChecks.filter((c) => c.status === 'fail').map((c) => c.message).join(' · '))
      return
    }
    try {
      const img = await readImage(file)
      onChange({
        file,
        previewUrl: img.url,
        width: img.width,
        height: img.height,
        focalPoint: CENTER,
        checks: [...fileChecks, ...checkDimensions(img.width, img.height)],
        safeZoneConfirmed: false,
      })
    } catch (e) {
      setError((e as Error).message)
    }
  }

  function openPicker() {
    if (!guideSeen) return setGuideOpen(true)
    inputRef.current?.click()
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    if (!guideSeen) {
      setPendingFile(file)
      setGuideOpen(true)
      return
    }
    void accept(file)
  }

  function onGuideContinue() {
    setGuideSeen(true)
    setGuideOpen(false)
    if (pendingFile) {
      void accept(pendingFile)
      setPendingFile(null)
    } else if (!value) {
      inputRef.current?.click()
    }
  }

  const update = (patch: Partial<BannerValue>) => value && onChange({ ...value, ...patch })
  const hasFail = value?.checks.some((c) => c.status === 'fail')

  return (
    <div className="flex w-full flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm leading-[1.16] text-teks">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
        >
          <InfoIcon size={14} />
          Lihat panduan banner
        </button>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={BANNER_SPEC.acceptedTypes.join(',')}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void accept(f)
          e.target.value = ''
        }}
      />

      {!value ? (
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openPicker())}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          aria-describedby={`${inputId}-hint`}
          className={`flex h-[184px] w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-5 text-center transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary ${
            dragOver ? 'border-primary bg-primary/5' : error ? 'border-danger/60 bg-surface-0' : 'border-white/10 bg-surface-0 hover:border-white/25'
          }`}
        >
          <UploadIcon className="text-text-1" />
          <p className="text-sm font-medium text-text-1">
            <span className="underline">Choose a file</span> or drag and drop it here
          </p>
          <p id={`${inputId}-hint`} className="text-xs text-muted">
            Rasio 16:9 · {BANNER_SPEC.recommended.width}×{BANNER_SPEC.recommended.height}px · {BANNER_SPEC.acceptedLabel} · maks.{' '}
            {formatBytes(BANNER_SPEC.maxBytes)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-surface-0 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{value.file.name}</p>
              <p className="text-xs text-muted">
                {value.width}×{value.height}px · {formatBytes(value.file.size)}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs text-teks hover:text-white"
              >
                <RefreshIcon size={14} /> Ganti
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                aria-label="Hapus banner"
                className="grid size-9 place-items-center rounded-lg border border-white/10 text-teks hover:text-danger"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>

          <ChecksList checks={value.checks} />

          {!hasFail && (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Atur titik fokus</p>
                  <button
                    type="button"
                    onClick={() => update({ focalPoint: CENTER, safeZoneConfirmed: false })}
                    className="text-xs text-muted hover:text-teks"
                  >
                    Reset ke tengah
                  </button>
                </div>
                <p className="text-xs leading-[1.4] text-teks">
                  Geser titik oranye ke bagian terpenting gambar. Pastikan teks & logo berada di dalam kotak putus-putus.
                </p>
                <FocalPointEditor
                  src={value.previewUrl}
                  width={value.width}
                  height={value.height}
                  focal={value.focalPoint}
                  onChange={(focalPoint) => update({ focalPoint, safeZoneConfirmed: false })}
                />
                <SurfaceLegend />
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Preview di setiap layar</p>
                <SurfacePreview src={value.previewUrl} focal={value.focalPoint} title={campaignTitle} />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-stroke bg-field p-3">
                <input
                  type="checkbox"
                  checked={value.safeZoneConfirmed}
                  onChange={(e) => update({ safeZoneConfirmed: e.target.checked })}
                  className="mt-0.5 size-4 shrink-0 accent-brand"
                />
                <span className="text-xs leading-[1.4] text-teks">
                  Saya sudah cek preview: teks, logo, dan info penting tidak terpotong di web maupun mobile app.
                </span>
              </label>
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-xs text-danger">
          <AlertIcon size={14} className="mt-px shrink-0" />
          {error}
        </p>
      )}

      <BannerGuidelineDialog
        open={guideOpen}
        onClose={() => {
          setGuideOpen(false)
          setPendingFile(null)
        }}
        onContinue={onGuideContinue}
        continueLabel={pendingFile ? 'Lanjut upload' : value ? 'Mengerti' : 'Pilih Gambar'}
      />
    </div>
  )
}

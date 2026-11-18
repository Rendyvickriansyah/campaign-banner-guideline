import { useEffect, useId, useState, type DragEvent } from 'react'
import { PencilIcon, TrashIcon, UploadIcon } from '../../../components/icons'
import { EditThumbnailModal, type ThumbnailResult } from './EditThumbnailModal'
import { BANNER_SPEC, formatBytes } from './bannerSpec'

export type BannerValue = ThumbnailResult

/** Step 1 › Thumbnail. Clicking or dropping opens the Edit Thumbnail modal. */
export function BannerUploadField({
  value,
  onChange,
  label = 'Thumbnail',
}: {
  value: BannerValue | null
  onChange: (v: BannerValue | null) => void
  label?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Release the exported preview when it is replaced or removed.
  const url = value?.url
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  const openEditor = (file: File | null = null) => {
    setDroppedFile(file)
    setOpen(true)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) openEditor(f)
  }

  const remove = () => {
    if (value) URL.revokeObjectURL(value.source.url)
    onChange(null)
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      <span id={id} className="text-sm leading-[1.16] text-teks">
        {label}
      </span>

      {!value ? (
        <button
          type="button"
          aria-labelledby={id}
          aria-describedby={`${id}-hint`}
          onClick={() => openEditor()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex h-[184px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed p-5 text-center transition-colors outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary ${
            dragOver ? 'border-primary bg-primary/5' : 'border-white/10 bg-surface-0 hover:border-white/25'
          }`}
        >
          <UploadIcon className="text-text-1" />
          <span className="text-sm font-medium text-text-1">
            <span className="underline">Choose a file</span> or drag and drop it here
          </span>
          <span id={`${id}-hint`} className="text-xs text-muted">
            Rasio 16:9 · {BANNER_SPEC.recommended.width}×{BANNER_SPEC.recommended.height}px · {BANNER_SPEC.acceptedLabel} · maks.{' '}
            {formatBytes(BANNER_SPEC.maxBytes)}
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-surface-0 p-2">
          <button
            type="button"
            onClick={() => openEditor()}
            aria-label="Edit thumbnail"
            className="group relative overflow-hidden rounded-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img src={value.url} alt="Thumbnail campaign" className="block aspect-video w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="flex items-center gap-2">
                <PencilIcon size={16} /> Edit Thumbnail
              </span>
            </span>
          </button>
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <p className="min-w-0 truncate text-xs text-muted">
              {value.file.name} · {value.width}×{value.height}px · {formatBytes(value.file.size)}
            </p>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => openEditor()}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs text-teks hover:text-white"
              >
                <PencilIcon size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={remove}
                aria-label="Hapus thumbnail"
                className="grid size-9 place-items-center rounded-lg border border-white/10 text-teks hover:text-danger"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <EditThumbnailModal
          initial={value}
          initialFile={droppedFile}
          onClose={() => setOpen(false)}
          onDone={(r) => {
            onChange(r)
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}

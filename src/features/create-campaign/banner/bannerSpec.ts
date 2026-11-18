/**
 * Single source of truth for campaign banner rules.
 *
 * Contract: the admin edits the banner on a 16:9 canvas and "Selesai" exports a 16:9 file.
 * Every surface (web + mobile app) renders that file with
 * `object-fit: cover; object-position: center`, so each surface shows exactly the
 * centered frame drawn in the Edit Thumbnail modal.
 */

export type Ratio = { w: number; h: number }
export type Point = { x: number; y: number } // 0..1
export type Rect = { x: number; y: number; w: number; h: number } // fractions of the image

export type BannerSurface = {
  id: string
  label: string
  ratio: Ratio
  /** Frame border + legend swatch. */
  color: string
  labelBg: string
  labelText: string
  labelSide: 'left' | 'right'
}

export const BANNER_SPEC = {
  ratio: { w: 16, h: 9 } satisfies Ratio,
  recommended: { width: 1920, height: 1080 },
  min: { width: 1280, height: 720 },
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedLabel: 'JPG, PNG, WEBP',
} as const

/**
 * Surfaces from the Figma "Edit Thumbnail" frame (794×448 canvas):
 * Mobile Card 652px, Campaign Detail 419px, Mobile Carousel 315px wide, all full height.
 * Update a ratio here if the app changes — the modal overlays follow automatically.
 */
export const BANNER_SURFACES: BannerSurface[] = [
  { id: 'web-banner', label: 'Web Banner', ratio: { w: 16, h: 9 }, color: '#22c55e', labelBg: '#038433', labelText: '#ffffff', labelSide: 'left' },
  { id: 'mobile-card', label: 'Mobile Card', ratio: { w: 652, h: 448 }, color: '#ef4444', labelBg: '#650000', labelText: '#ffffff', labelSide: 'left' },
  { id: 'campaign-detail', label: 'Campaign Detail', ratio: { w: 419, h: 448 }, color: '#f59e0b', labelBg: '#f59e0b', labelText: '#521d00', labelSide: 'left' },
  { id: 'mobile-carousel', label: 'Mobile Carousel', ratio: { w: 315, h: 448 }, color: '#3b82f6', labelBg: '#0061ff', labelText: '#ffffff', labelSide: 'right' },
]

export const CANVAS_RATIO = BANNER_SPEC.ratio.w / BANNER_SPEC.ratio.h
export const CENTER: Point = { x: 0.5, y: 0.5 }

export const toNumber = (r: Ratio) => r.w / r.h
export const objectPosition = (p: Point) => `${(p.x * 100).toFixed(2)}% ${(p.y * 100).toFixed(2)}%`

/** Visible part of an image (ratio `imageRatio`) inside a frame of `frameRatio` with object-fit: cover. */
export function cropRect(imageRatio: number, frameRatio: number, focal: Point): Rect {
  if (frameRatio < imageRatio) {
    const w = frameRatio / imageRatio
    return { x: (1 - w) * focal.x, y: 0, w, h: 1 }
  }
  const h = imageRatio / frameRatio
  return { x: 0, y: (1 - h) * focal.y, w: 1, h }
}

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type BannerCheck = { id: string; label: string; status: CheckStatus; message: string }

export function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

export function checkFile(file: File): BannerCheck[] {
  const typeOk = (BANNER_SPEC.acceptedTypes as readonly string[]).includes(file.type)
  const sizeOk = file.size <= BANNER_SPEC.maxBytes
  return [
    {
      id: 'format',
      label: 'Format',
      status: typeOk ? 'pass' : 'fail',
      message: typeOk ? file.type.replace('image/', '').toUpperCase() : `Format belum didukung. Gunakan ${BANNER_SPEC.acceptedLabel}.`,
    },
    {
      id: 'size',
      label: 'Ukuran file',
      status: sizeOk ? 'pass' : 'fail',
      message: sizeOk ? formatBytes(file.size) : `File ${formatBytes(file.size)}, maksimal ${formatBytes(BANNER_SPEC.maxBytes)}.`,
    },
  ]
}

/** Resolution of the 16:9 area that will be exported. */
export function checkResolution(width: number, height: number): BannerCheck {
  const { min, recommended } = BANNER_SPEC
  if (width < min.width || height < min.height)
    return {
      id: 'resolution',
      label: 'Resolusi',
      status: 'fail',
      message: `Area 16:9 hanya ${width}×${height}px, minimal ${min.width}×${min.height}px agar tidak pecah di layar HP.`,
    }
  if (width < recommended.width)
    return {
      id: 'resolution',
      label: 'Resolusi',
      status: 'warn',
      message: `${width}×${height}px. Disarankan ${recommended.width}×${recommended.height}px.`,
    }
  return { id: 'resolution', label: 'Resolusi', status: 'pass', message: `${width}×${height}px` }
}

export type SourceImage = { file: File; url: string; width: number; height: number }

export function readImage(file: File): Promise<SourceImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ file, url, width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File gambar tidak bisa dibaca. Coba file lain.'))
    }
    img.src = url
  })
}

/** Pixel size of the 16:9 area of `src` (before any downscale). */
export function cropSize(src: Pick<SourceImage, 'width' | 'height'>, focal: Point) {
  const r = cropRect(src.width / src.height, CANVAS_RATIO, focal)
  return { width: Math.round(r.w * src.width), height: Math.round(r.h * src.height) }
}

/** Renders the visible 16:9 area to a new file (downscaled to the recommended width at most). */
export async function exportCrop(src: SourceImage, focal: Point): Promise<{ file: File; url: string; width: number; height: number }> {
  const r = cropRect(src.width / src.height, CANVAS_RATIO, focal)
  const sx = r.x * src.width
  const sy = r.y * src.height
  const sw = r.w * src.width
  const sh = r.h * src.height
  const width = Math.round(Math.min(sw, BANNER_SPEC.recommended.width))
  const height = Math.round(width / CANVAS_RATIO)

  const img = new Image()
  img.src = src.url
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)

  const type = src.file.type
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses gambar.'))), type, 0.92),
  )
  const file = new File([blob], src.file.name, { type: blob.type })
  return { file, url: URL.createObjectURL(file), width, height }
}

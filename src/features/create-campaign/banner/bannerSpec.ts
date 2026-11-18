/**
 * Single source of truth for campaign banner rules.
 *
 * Every surface that renders the banner (web + mobile app) must use
 * `object-fit: cover` together with `object-position: {focalPoint.x * 100}% {focalPoint.y * 100}%`.
 * With that contract the crop math below is exactly what users will see,
 * so whatever the admin keeps inside the safe zone is never cut off.
 */

export type Ratio = { w: number; h: number }
export type Point = { x: number; y: number } // 0..1
export type Rect = { x: number; y: number; w: number; h: number } // fractions of the image

export type BannerSurface = {
  id: string
  platform: 'web' | 'app'
  label: string
  ratio: Ratio
}

export const BANNER_SPEC = {
  ratio: { w: 16, h: 9 } satisfies Ratio,
  recommended: { width: 1920, height: 1080 },
  min: { width: 1280, height: 720 },
  maxBytes: 5 * 1024 * 1024,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedLabel: 'JPG, PNG, WEBP',
  /** Relative deviation from 16:9 that is still treated as "pas". */
  ratioTolerance: 0.02,
} as const

/**
 * Where the banner appears. Web ratios come from the Figma (card 354×199, hero 480×270).
 * App ratios: confirm with the mobile team and update here — the guideline,
 * safe zone and previews all derive from this list.
 */
export const BANNER_SURFACES: BannerSurface[] = [
  { id: 'web', platform: 'web', label: 'Web · Card & detail', ratio: { w: 16, h: 9 } },
  { id: 'app-detail', platform: 'app', label: 'App · Header detail', ratio: { w: 4, h: 3 } },
  { id: 'app-card', platform: 'app', label: 'App · Card list', ratio: { w: 2, h: 1 } },
]

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

/** Area visible on every surface — the only place where text and logos are safe. */
export function safeZone(imageRatio: number, focal: Point, surfaces = BANNER_SURFACES): Rect {
  return surfaces
    .map((s) => cropRect(imageRatio, toNumber(s.ratio), focal))
    .reduce((acc, r) => {
      const x = Math.max(acc.x, r.x)
      const y = Math.max(acc.y, r.y)
      return {
        x,
        y,
        w: Math.min(acc.x + acc.w, r.x + r.w) - x,
        h: Math.min(acc.y + acc.h, r.y + r.h) - y,
      }
    })
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
      message: typeOk ? file.type.replace('image/', '').toUpperCase() : `Gunakan ${BANNER_SPEC.acceptedLabel}`,
    },
    {
      id: 'size',
      label: 'Ukuran file',
      status: sizeOk ? 'pass' : 'fail',
      message: sizeOk
        ? formatBytes(file.size)
        : `${formatBytes(file.size)} — maksimal ${formatBytes(BANNER_SPEC.maxBytes)}`,
    },
  ]
}

export function checkDimensions(width: number, height: number): BannerCheck[] {
  const { min, recommended, ratio, ratioTolerance } = BANNER_SPEC
  const target = toNumber(ratio)
  const deviation = Math.abs(width / height - target) / target

  const resolution: BannerCheck =
    width < min.width || height < min.height
      ? {
          id: 'resolution',
          label: 'Resolusi',
          status: 'fail',
          message: `${width}×${height}px — minimal ${min.width}×${min.height}px agar tidak pecah di layar HP`,
        }
      : {
          id: 'resolution',
          label: 'Resolusi',
          status: width < recommended.width ? 'warn' : 'pass',
          message:
            width < recommended.width
              ? `${width}×${height}px — disarankan ${recommended.width}×${recommended.height}px`
              : `${width}×${height}px`,
        }

  const ratioCheck: BannerCheck =
    deviation <= ratioTolerance
      ? { id: 'ratio', label: 'Rasio', status: 'pass', message: '16:9' }
      : {
          id: 'ratio',
          label: 'Rasio',
          status: 'warn',
          message: `${(width / height).toFixed(2)}:1 — bukan 16:9, sebagian gambar akan terpotong. Atur titik fokus di bawah.`,
        }

  return [resolution, ratioCheck]
}

export function readImage(file: File): Promise<{ url: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ url, width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File gambar tidak bisa dibaca'))
    }
    img.src = url
  })
}

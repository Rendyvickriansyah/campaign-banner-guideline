import { useState } from 'react'
import { MonitorIcon, PhoneIcon } from '../../../components/icons'
import { BANNER_SURFACES, objectPosition, type Point } from './bannerSpec'

const surface = (id: string) => BANNER_SURFACES.find((s) => s.id === id)!

function Banner({ src, focal, ratio, className = '' }: { src: string; focal: Point; ratio: { w: number; h: number }; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      className={`block w-full object-cover ${className}`}
      style={{ aspectRatio: `${ratio.w} / ${ratio.h}`, objectPosition: objectPosition(focal) }}
    />
  )
}

/** Mock of how the banner renders on each surface — same object-fit/object-position contract as production. */
export function SurfacePreview({ src, focal, title }: { src: string; focal: Point; title: string }) {
  const [tab, setTab] = useState<'web' | 'app'>('app')
  const tabs = [
    { id: 'app' as const, label: 'Mobile App', Icon: PhoneIcon },
    { id: 'web' as const, label: 'Web', Icon: MonitorIcon },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label="Preview banner" className="grid grid-cols-2 gap-1 rounded-lg border border-stroke bg-field p-1">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex h-9 items-center justify-center gap-2 rounded-md text-sm transition-colors ${
              tab === id ? 'bg-white/10 text-white' : 'text-muted hover:text-teks'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'app' ? (
        <div className="flex justify-center gap-4 rounded-lg border border-stroke bg-surface-0 p-4">
          {/* Phone: campaign detail header */}
          <div className="w-[150px] overflow-hidden rounded-[18px] border-[3px] border-[#222] bg-surface-1">
            <div className="relative">
              <Banner src={src} focal={focal} ratio={surface('app-detail').ratio} />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-surface-1" />
            </div>
            <div className="flex flex-col gap-1.5 p-2.5">
              <p className="truncate text-[11px] font-medium">{title || 'Judul Campaign'}</p>
              <div className="h-1.5 w-2/3 rounded bg-white/10" />
              <div className="h-1.5 w-1/2 rounded bg-white/10" />
              <div className="mt-2 h-5 rounded bg-brand/90" />
            </div>
            <p className="pb-2 text-center text-[9px] text-muted">Header detail · 4:3</p>
          </div>
          {/* Phone: campaign list card */}
          <div className="w-[150px] overflow-hidden rounded-[18px] border-[3px] border-[#222] bg-surface-1 p-2">
            <p className="mb-2 text-[10px] font-medium">Jelajahi campaign</p>
            {[0, 1].map((i) => (
              <div key={i} className={`mb-2 overflow-hidden rounded-md border border-stroke ${i ? 'opacity-30' : ''}`}>
                <Banner src={src} focal={focal} ratio={surface('app-card').ratio} />
                <div className="p-1.5">
                  <p className="truncate text-[9px]">{title || 'Judul Campaign'}</p>
                </div>
              </div>
            ))}
            <p className="text-center text-[9px] text-muted">Card list · 2:1</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-stroke bg-surface-0 p-4">
          <div className="mx-auto max-w-[300px] overflow-hidden rounded-xl border border-stroke bg-surface-1">
            <div className="relative">
              <Banner src={src} focal={focal} ratio={surface('web').ratio} />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-surface-0" />
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium">{title || 'Judul Campaign'}</p>
              <p className="text-xs text-teks">Card & detail campaign · 16:9</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

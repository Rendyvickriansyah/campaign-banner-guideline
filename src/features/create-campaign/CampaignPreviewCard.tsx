import { InfoIcon, InstagramIcon, TiktokIcon, YoutubeIcon } from '../../components/icons'
import { objectPosition, type Point } from './banner/bannerSpec'

const pill =
  'rounded-full border-[0.8px] border-stroke bg-[linear-gradient(177deg,#000_31.7%,#262626_122%,#666_192%)] px-[18px] py-2 text-xs leading-[1.2]'

/** Left panel of the create-campaign modal: live preview of the campaign card. */
export function CampaignPreviewCard({
  title,
  contentType,
  category,
  banner,
}: {
  title: string
  contentType: string
  category: string
  banner: { src: string; focal: Point } | null
}) {
  return (
    <aside className="relative hidden w-[398px] shrink-0 flex-col self-stretch bg-surface-0 shadow-card-inset md:flex">
      <div className="relative h-[224px] w-full overflow-hidden">
        {banner ? (
          <img src={banner.src} alt="" className="size-full object-cover" style={{ objectPosition: objectPosition(banner.focal) }} />
        ) : (
          // Placeholder artwork (the Figma default banner image could not be exported here).
          <div className="flex size-full items-center justify-center bg-[radial-gradient(90%_120%_at_50%_0%,#6b2c0c_0%,#1d0d05_55%,#030303_100%)]">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.04)_0_2px,transparent_2px_40px)]" />
            <span className="relative text-5xl font-bold tracking-tight">Klip.</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgb(3_3_3/0)] from-[56%] via-[rgb(3_3_3/0.59)] via-[74%] to-surface-0" />
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[7px]">
            <span className="grid size-6 place-items-center rounded-full bg-[#2e5cff] text-[10px] font-bold">P</span>
            <span className="text-sm leading-[1.16]">Polymarket</span>
          </div>
          <span className={pill}>{contentType || 'Tipe Konten'}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <p className="truncate text-lg font-medium leading-[1.16]">{title || 'Judul Campaign'}</p>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs leading-[1.4] text-teks">CPM Tertinggi</p>
            <p className="flex items-end gap-1">
              <span className="text-2xl font-bold leading-8">Rp0</span>
              <span className="pb-0.5 text-sm leading-[1.4] text-teks">/ 1K views</span>
            </p>
          </div>
          <div className="flex items-center gap-[9px] text-muted">
            <div className="flex items-center gap-2">
              <TiktokIcon size={14} />
              <InstagramIcon size={16} />
              <YoutubeIcon size={16} />
            </div>
            <span className="size-[2.3px] rounded-full bg-white" />
            <span className={`${pill} uppercase text-teks`}>{category || 'Entertainment'}</span>
            <span className={`${pill} uppercase text-teks`}>Per CPM</span>
          </div>
        </div>

        <hr className="border-stroke" />

        <div className="relative flex h-[120px] flex-col justify-between rounded-xl border border-stroke bg-[linear-gradient(7deg,#090909_13%,#141414_88%)] px-3 py-4 shadow-card-inset">
          <p className="flex items-center gap-1.5 text-sm font-medium leading-[1.4]">
            Total Budget Campaign <InfoIcon size={12} />
          </p>
          <p className="w-fit bg-[linear-gradient(-31deg,#ff0004_0%,#ff8400_50%,#fff_95%)] bg-clip-text text-xl font-medium leading-[1.4] text-transparent">
            Rp15.000.000
          </p>
        </div>
      </div>
    </aside>
  )
}

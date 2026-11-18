import { useState, type ComponentType } from 'react'
import { ChevronDownIcon, InstagramIcon, ThreadsIcon, TiktokIcon, YoutubeIcon } from '../../components/icons'
import { BannerUploadField, type BannerValue } from './banner/BannerUploadField'
import { CampaignPreviewCard } from './CampaignPreviewCard'

const STEPS = [1, 2, 3, 4, 5]
const PLATFORMS: { id: string; label: string; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'instagram', label: 'Instagram', Icon: InstagramIcon },
  { id: 'tiktok', label: 'Tiktok', Icon: TiktokIcon },
  { id: 'youtube', label: 'Youtube', Icon: YoutubeIcon },
  { id: 'threads', label: 'Threads', Icon: ThreadsIcon },
]
const CONTENT_TYPES = ['UGC', 'Clipping', 'Review']
const CATEGORIES = ['Entertainment', 'Gaming', 'Finance', 'Lifestyle']

function Stepper({ current }: { current: number }) {
  return (
    <ol className="relative flex w-[344px] max-w-full items-center justify-between" aria-label="Langkah create campaign">
      <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/15" aria-hidden />
      {STEPS.map((s) => (
        <li
          key={s}
          aria-current={s === current ? 'step' : undefined}
          className={`relative grid size-6 place-items-center rounded-full border bg-black text-sm leading-none text-teks ${
            s === current ? 'border-primary' : 'border-stroke'
          }`}
        >
          {s}
        </li>
      ))}
    </ol>
  )
}

function Select({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2.5">
      <label htmlFor={id} className="text-sm leading-[1.16] text-teks">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full appearance-none rounded-[10px] border border-stroke bg-field px-3 pr-10 text-sm outline-none focus:border-white/30 ${
            value ? 'text-white' : 'text-muted'
          }`}
        >
          <option value="" disabled>
            {label}
          </option>
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-teks" />
      </div>
    </div>
  )
}

export function CreateCampaignModal() {
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState('')
  const [category, setCategory] = useState('')
  const [platforms, setPlatforms] = useState<string[]>(['instagram'])
  const [banner, setBanner] = useState<BannerValue | null>(null)

  const canContinue = title.trim().length > 0 && platforms.length > 0 && !!banner

  const togglePlatform = (id: string) =>
    setPlatforms((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  return (
    <div className="flex min-h-full items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[876px] overflow-hidden rounded-xl border border-white/10 shadow-[0_1.66px_3.32px_rgb(0_0_0/0.04)]">
        <CampaignPreviewCard
          title={title}
          contentType={contentType}
          category={category}
          bannerUrl={banner?.url ?? null}
        />

        <form
          className="flex min-w-0 flex-1 flex-col gap-10 overflow-y-auto bg-surface-1 p-6 shadow-card-inset sm:p-8"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canContinue || !banner) return
            // Hand-off to the API: upload the 16:9 file; every surface center-crops it.
            console.info('Step 1 payload', {
              title,
              contentType,
              category,
              platforms,
              banner: { file: banner.file, width: banner.width, height: banner.height },
            })
          }}
        >
          <Stepper current={1} />

          <div className="flex flex-col gap-6">
            <h1 className="text-xl font-medium leading-[1.4]">Profile Campaign</h1>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="title" className="text-sm leading-[1.16] text-teks">
                  Judul Campaign
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Judul campaign"
                  className="h-[50px] rounded-xl border border-stroke bg-field px-5 text-sm text-white outline-none placeholder:text-muted focus:border-white/30"
                />
              </div>

              <div className="flex gap-4">
                <Select id="type" label="Tipe Konten" value={contentType} options={CONTENT_TYPES} onChange={setContentType} />
                <Select id="category" label="Kategori" value={category} options={CATEGORIES} onChange={setCategory} />
              </div>

              <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-2.5 text-sm leading-[1.16] text-teks">Platform</legend>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(({ id, label, Icon }) => {
                    const on = platforms.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => togglePlatform(id)}
                        className={`flex h-10 items-center gap-3 rounded-lg border px-3 text-sm leading-[1.4] transition-colors ${
                          on ? 'border-brand text-white' : 'border-white/10 text-muted hover:text-teks'
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <BannerUploadField value={banner} onChange={setBanner} />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={!canContinue}
                  className="h-[42px] rounded-xl bg-brand px-5 text-base font-medium text-white shadow-card-inset [text-shadow:0_1px_2px_rgb(0_0_0/0.1)] hover:bg-[#ff5a12] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

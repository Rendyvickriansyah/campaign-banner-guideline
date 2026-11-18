# Campaign Banner Guideline

A guideline for uploading campaign banners in the admin **Create Campaign** flow, so banners don't get cut off in the mobile app.
Built with React, TypeScript, Tailwind CSS v4 and Vite. The entry point is Step 1 "Profile Campaign" › Thumbnail (Figma `Orova-Product-Design`, node `8134:50817`).

```bash
npm install
npm run dev
```

## The flow

1. **Guideline dialog** opens the first time the admin clicks or drops a file into Thumbnail, for every new campaign. It shows the safe zone, the file specs, and do/don't examples. It can be reopened anytime with "Lihat panduan banner".
2. **Automatic validation**: format, file size and resolution can block the upload. A ratio other than 16:9 or a resolution below the recommended size only shows a warning.
3. **Focal point**: the admin drags the point (or uses the arrow keys) onto the important part of the image. The crop for each surface and the **safe zone** (the area visible on every screen) update live.
4. **Preview per screen**: Mobile App (detail header 4:3, card list 2:1) and Web (16:9).
5. **Confirmation**: "Selanjutnya" stays disabled until the banner passes validation and the admin confirms the preview.

## Contract for backend and mobile app ⚠️

The previews are only accurate if **every platform renders the banner the same way**:

```
object-fit: cover;
object-position: {focalPoint.x * 100}% {focalPoint.y * 100}%;
```

- Store `focalPoint: { x: number, y: number }` (0–1, default `0.5, 0.5`) with the campaign, alongside `width` and `height`.
- iOS/Android: use the image library's equivalent of cover plus alignment/focal point (for example, Coil/Glide with a custom transformation, or SwiftUI `.scaledToFill()` with an alignment offset).

## Configuration

All rules live in `src/features/create-campaign/banner/bannerSpec.ts`:

- `BANNER_SPEC`: ratio, min/recommended resolution, max size, file formats.
- `BANNER_SURFACES`: the list of screens and their ratios. **The app ratios (4:3 and 2:1) are assumptions. Confirm them with the mobile team.** The safe zone, guideline and previews all update automatically from this list.

## File structure

```
src/features/create-campaign/
  CreateCampaignModal.tsx      Step 1 modal (Figma)
  CampaignPreviewCard.tsx      Live preview card on the left
  banner/
    bannerSpec.ts              Specs, crop/safe-zone math, validation
    BannerUploadField.tsx      Upload field + state (entry point)
    BannerGuidelineDialog.tsx  Guideline dialog
    FocalPointEditor.tsx       Focal point editor + overlay
    SurfaceOverlay.tsx         Crop frames per surface + safe zone
    SurfacePreview.tsx         Mobile App / Web previews
```

## Notes

- The Figma assets (default banner image, Polymarket logo, icons) could not be exported because figma.com is blocked in the build environment. They are replaced with inline SVG icons and a gradient placeholder. Swap in the design system's own assets/icons when integrating.
- The Neue Montreal font is not bundled. It falls back to Inter or the system font.

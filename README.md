# Campaign Banner Guideline

A guideline for uploading campaign banners in the admin **Create Campaign** flow, so banners don't get cut off in the mobile app.
Built with React, TypeScript, Tailwind CSS v4 and Vite. The entry point is Step 1 "Profile Campaign" › Thumbnail (Figma `Orova-Product-Design`, node `8134:50817`).

```bash
npm install
npm run dev
```

## The flow

1. In Step 1 › **Thumbnail**, clicking or dropping a file opens the **Edit Thumbnail** modal (Figma node `8134:52843`).
2. The 16:9 canvas shows a crop frame for every surface, all centered: **Web Banner**, **Mobile Card**, **Campaign Detail** and **Mobile Carousel**. Even before an image is chosen, the admin can see which areas are safe.
3. Each frame can be hidden with the eye icon, and the overlay opacity can be adjusted with the slider.
4. If the image is not 16:9, the admin drags it (or uses the arrow keys) to choose which part is shown.
5. Validation:
   - an unsupported format or a file over 5 MB is rejected straight away;
   - if the 16:9 area is smaller than 1280×720 px, the **Selesai** button is disabled;
   - below 1920×1080 px only a warning is shown.
6. **Selesai** exports the visible 16:9 area as a new file (at most 1920 px wide) and returns it to Step 1. **Kembali** discards the changes.

## Contract for backend and mobile app ⚠️

The thumbnail file that gets uploaded is **always 16:9**. Every surface just needs to render it with:

```
object-fit: cover;
object-position: center;
```

This way each surface shows exactly the frame drawn in the modal. No extra field needs to be stored.

## Configuration

All rules live in `src/features/create-campaign/banner/bannerSpec.ts`:

- `BANNER_SPEC`: ratio, min/recommended resolution, max size, file formats.
- `BANNER_SURFACES`: the list of surfaces, their ratios and frame colors. The ratios are measured from the Figma frame (794×448 canvas: Mobile Card 652 px, Campaign Detail 419 px, Mobile Carousel 315 px wide). **Confirm them with the mobile team.** If the app changes, update the ratio here and the frames in the modal follow automatically.

## File structure

```
src/features/create-campaign/
  CreateCampaignModal.tsx      Step 1 modal (Figma)
  CampaignPreviewCard.tsx      Live preview card on the left
  banner/
    bannerSpec.ts              Specs, crop math, validation, 16:9 export
    BannerUploadField.tsx      Thumbnail field in Step 1 (entry point)
    EditThumbnailModal.tsx     Edit Thumbnail modal (Figma)
```

## Notes

- The Figma assets (default banner image, Polymarket logo, icons) could not be exported because figma.com is blocked in the build environment. They are replaced with inline SVG icons and a gradient placeholder. Swap in the design system's own assets/icons when integrating.
- The Neue Montreal font is not bundled. It falls back to Inter or the system font.

/**
 * @fileoverview Loads app-preview screenshots without requiring the files
 * to exist at build time. Drop real screenshots into
 * src/assets/app-previews/{featureSlug}/{n}.png (numeric filenames sort
 * the display order) and they appear automatically — AppOnlyFeature falls
 * back to a "Screenshot coming soon" placeholder frame when none exist yet,
 * at the same dimensions, so no layout work is needed later.
 */

// import.meta.glob doesn't require the matched files to exist right now —
// it just returns an empty object until real files land in the folder.
const modules = import.meta.glob('../assets/app-previews/*/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

/**
 * @param {string} featureSlug - e.g. 'ride-calendar'
 * @returns {string[]} resolved image URLs, sorted by filename
 */
export function getPreviewScreenshots(featureSlug) {
  return Object.entries(modules)
    .filter(([path]) => path.includes(`/app-previews/${featureSlug}/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, src]) => src);
}

# Image Gallery Modernization

**Date:** 2026-04-15
**Status:** Approved
**Scope:** `ul.imageGallery` in `src/styles/Home.module.scss` and `src/components/Home/BlogPostList.tsx`

## Summary

Modernize the blog post gallery grid with a clean & minimal aesthetic: CSS Grid layout, rounded images with soft shadows, smooth hover transitions, and a 4:3 aspect ratio.

## Design Decisions

| Aspect | Current | New |
|--------|---------|-----|
| Layout | `display: flex; flex-wrap: wrap`, fixed 300px cards | CSS Grid `repeat(auto-fill, minmax(300px, 1fr))` |
| Image shape | `aspect-ratio: 1/1` (square) | `aspect-ratio: 4/3` (landscape photo) |
| Image border | `.25rem solid white` | None |
| Image shadow | `drop-shadow(.25rem .25rem 0 lightgreen)` on img, `drop-shadow(.25rem .25rem 10rem ...)` on picture | `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25)` on img |
| Image corners | None (sharp) | `border-radius: 10px` |
| Hover effect | None | `transform: scale(1.02)`, shadow deepens to `0 8px 30px rgba(0, 0, 0, 0.35)` |
| Transitions | None | `transition: transform 0.2s ease, box-shadow 0.2s ease` |
| Grid gap | `gap: 1rem` | `gap: 1.5rem` |
| Card sizing | `min-width: 300px; max-width: 300px` on `li` | Removed — grid handles sizing via `minmax(300px, 1fr)` |
| Card padding | `padding-left/right: .5rem` on `li` | Removed — grid gap handles spacing |
| Caption | Below image, outside container | Same — title + date below the rounded image |
| Tags | Below caption in `section` | Unchanged |

## What Gets Removed

- White border on images (`border: .25rem solid white`)
- Lightgreen drop-shadow on images (`filter: drop-shadow(.25rem .25rem 0 lightgreen)`)
- Large glow drop-shadow on picture (`filter: drop-shadow(.25rem .25rem 10rem ...)`)
- Fixed `min-width`/`max-width: 300px` on `li`
- `padding-left`/`padding-right` on `li`

## What Gets Added

- `border-radius: 10px` on images
- `box-shadow` (neutral, soft) on images
- `transition` on images for hover lift + shadow deepening
- `display: grid` with `auto-fill` on the `ul`

## Files to Modify

1. **`src/styles/Home.module.scss`** — Replace `ul.imageGallery` block with new grid + image styles
2. **`src/components/Home/BlogPostList.tsx`** — No structural changes expected; aspect ratio is controlled by CSS

## Theme Compatibility

The shadow uses `rgba(0, 0, 0, ...)` which works in both light and dark themes. The removal of hardcoded `white` border and `lightgreen` shadow improves theme neutrality — these were dark-theme-only aesthetics that wouldn't adapt to a light theme.

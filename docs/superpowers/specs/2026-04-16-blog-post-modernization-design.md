# Blog Post Page Modernization

**Date:** 2026-04-16
**Status:** Draft
**Scope:** Full visual overhaul of the blog post page — hero image, meta area, article body typography

## Goal

Replace the dated blog post layout with a modern, spacious design featuring a full-bleed hero image with text overlay, improved visual hierarchy in the meta area, and minimal spacious article body typography.

## Design Decisions

| Question | Choice | Rationale |
|---|---|---|
| Cover image | Full-bleed hero with text overlay | Dramatic, editorial; consistent framing via 16:9 aspect ratio |
| Image filter | Subtle desaturation (50%) | Tones down the image so overlay text pops without going fully grayscale |
| Body style | Minimal Spacious | Generous line-height, narrower width, airy — lets content breathe |
| Meta area | Spacious with visual hierarchy | Clear separation between hero, meta elements, and body |

## 1. Full-Bleed Hero Image

Replaces the current fixed-350px figure with a full-width hero.

**Structure:**
- `<figure>` wraps the image, gradient overlay, and overlaid text
- Image uses `fill` layout with `object-fit: cover`
- `aspect-ratio: 16/9` on the figure, capped with `max-height: 400px`
- `filter: saturate(0.5)` on the image — subtle desaturation, not grayscale
- Remove the old `border: 1rem solid white` and `filter: grayscale(1)`

**Gradient overlay:**
- `::after` pseudo-element on the figure
- `background: linear-gradient(transparent 40%, rgba(0,0,0,0.85) 100%)`
- Covers the bottom portion so white text is always readable

**Overlaid content (positioned absolute, bottom of figure):**
- Post title (`h1`) — white, large, text-shadow for extra readability
- Date line — white at reduced opacity

**Figcaption:**
- Positioned absolute, bottom-right of the figure, above the gradient
- Small font (`0.7rem`), `opacity: 0.4`, white text
- Acts as an image credit/alt text line — doesn't compete with the title

## 2. Meta Area — Below the Hero

Below the hero figure, above the body. Spacious vertical layout:

1. **Author row** — avatar (50px, gold border, rounded) + "By Author Name" (linked if slug exists). Margin: `1.5rem` top.
2. **Tags** — existing `<Tags>` component. Margin: `1rem` top.
3. **Description/lede** — `font-size: 1.15rem`, `opacity: 0.7`, generous margin (`1.5rem` top, `2rem` bottom). Acts as a subtitle/intro paragraph.

Each element has clear vertical separation. No cramming.

## 3. Article Body — Minimal Spacious Typography

Applied to the `<Markdown>` rendered content and the overall article area.

**Typography:**
- Font: system sans-serif (unchanged from site default)
- Body text size: `1.05rem`
- Line-height: `2.0`
- Text color: `rgba(255,255,255,0.8)` — slightly muted for softer reading
- Max content width: `600px`, centered within the 750px wrapper

**Headings:**
- `h2`: `1.3rem`, `font-weight: 600`, `margin-top: 3rem`, `margin-bottom: 1rem`, bottom border (`1px solid rgba(255,255,255,0.08)`), `padding-bottom: 0.5rem`
- `h3`: `1.1rem`, `font-weight: 600`, `margin-top: 2.5rem`, `margin-bottom: 0.75rem`, no border

**Blockquotes:**
- Left border: `2px solid rgba(255,255,255,0.15)`
- Padding-left: `1.5rem`
- `opacity: 0.75`, `font-style: italic`
- Margin: `2rem 0`

**Horizontal rules:**
- No visible line
- Replaced with centered dot dividers: `· · ·`
- `margin: 3rem auto`, `opacity: 0.2`
- Implemented via `hr::after { content: '· · ·' }`

**Inline code:**
- Monospace font, `font-size: 0.88em`
- Subtle background: `rgba(255,255,255,0.05)`
- Small border-radius: `3px`
- Padding: `0.15em 0.35em`

**Paragraphs:**
- `margin-bottom: 1.5rem`

**Links:**
- Keep existing `lightgreen` color
- Remove the light-mode `text-shadow` and `drop-shadow` filter on links — these are heavy and dated

## 4. Prev/Next Navigation

Keep the current `.postNav` styling — it already works well. No changes needed.

## 5. Light Mode Considerations

- The hero gradient overlay uses dark tones — for `prefers-color-scheme: light`, adjust to fade into the light background instead: `linear-gradient(transparent 40%, rgba(255,255,255,0.9) 100%)`
- Overlay text color switches to dark for light mode
- Body text color adjusts: `rgba(0,0,0,0.75)` for light mode
- Desaturation filter stays the same — works in both modes
- Remove the current light-mode link `text-shadow` hack

## Files to Modify

| File | Action | Change |
|---|---|---|
| `src/pages/post/[slug].tsx` | Modify | Move title + date inside the hero figure for overlay positioning; restructure meta area below hero (author, tags, description with spacing) |
| `src/styles/BlogPost.module.scss` | Rewrite | Hero styles (aspect-ratio, gradient, overlay text), spacious meta area, minimal body typography (line-height, width, headings, blockquotes, hr, code) |

## Not In Scope

- No changes to the Markdown component itself — styling is applied via CSS selectors on the rendered output
- No changes to data fetching or props
- No new dependencies
- No changes to prev/next nav, embeds, gallery, or playlist sections

# Blog Index Visual Enhancements

**Date:** 2026-04-16
**Status:** Draft
**Scope:** CSS animations, vanilla JS interactions, View Transitions API

## Goal

Make the blog index page more visually engaging and interactive while preserving SEO (static export), accessibility, and mobile-first design. No new dependencies.

## Design Decisions

| Question | Choice | Rationale |
|---|---|---|
| Scroll entrance | Scale Reveal | Clean zoom-in feel; pairs visually with image zoom hover |
| Hover effect | Image Zoom | Draws focus into the photo without moving the card |
| Tag navigation | View Transitions API | Animated page transitions with zero routing changes; progressive enhancement |
| Mobile touch — tap | Scale pulse | Quick tactile feedback on tap via CSS `:active` |
| Mobile touch — long press | Elevated preview | JS-based hold-to-preview; visual-only, does not block navigation |
| Reduced motion | Disable all | Full `prefers-reduced-motion: reduce` respect; content appears instantly |

## 1. Scale Reveal (Scroll Entrance)

Cards start hidden (`opacity: 0; transform: scale(0.92)`) and animate to full visibility when they enter the viewport.

**Behavior:**
- `IntersectionObserver` with `threshold: 0.15` watches each `<li>` in the post grid
- When a card enters, it receives a `.visible` class that triggers the CSS transition
- Transition: `opacity 0.7s ease, transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- In multi-column layouts, cards stagger with ~80ms delay between siblings in the same row
- Observer fires once per card (`unobserve` after triggering) — no re-animation on scroll-up

**Mobile (single column):**
- No stagger delay — each card animates independently as it enters

## 2. Image Zoom (Hover Effect)

On hover, the post image scales up within its container. Replaces the existing `transform: scale(1.02)` on the entire card.

**Behavior:**
- Image gets `transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- On card hover: `img { transform: scale(1.08) }`
- Container keeps `overflow: hidden` (already set via `border-radius`) so the zoom is clipped
- Card gains a deeper `box-shadow` on hover for depth
- Remove existing whole-card `transform: scale(1.02)` and its hover `box-shadow` override

## 3. View Transitions (Tag Navigation)

Use the browser-native View Transitions API to animate between tag-filtered pages.

**Implementation:**
- Add `<meta name="view-transition" content="same-origin">` to `<SeoHead>` or `_document.tsx`
- Assign `view-transition-name` to each post card using the post slug (e.g., `style={{ viewTransitionName: post.fields.slug }}`)
- Assign `view-transition-name: tag-nav` to the tag navigation bar so it stays anchored
- Add CSS rules for `::view-transition-old` and `::view-transition-new` pseudo-elements in `globals.css` to control the crossfade/morph animation

**Progressive enhancement:**
- Chrome/Edge 120+ support same-origin view transitions natively
- Safari and Firefox get instant navigation — no polyfill, no fallback code
- The meta tag and CSS are inert in unsupported browsers

## 4. Mobile Touch Interactions

Scoped to touch devices via `@media (hover: none)`.

### 4a. Tap Feedback (CSS)

- On `:active`, card scales to `0.97` with `transition: transform 0.15s ease`
- Immediate tactile response, no JS needed

### 4b. Long-Press Preview (JS)

- `touchstart` event starts a 500ms timer
- If held without `touchmove` or `touchend`, card enters preview state:
  - `transform: translateY(-4px)`
  - Image zoom to `scale(1.05)`
  - Slightly elevated shadow
- `touchend` clears the preview state and navigates normally
- `touchmove` (beyond a small threshold) cancels the timer to avoid interfering with scrolling

**Implementation:** Custom React hook (`useCardInteractions`) defined in `src/components/Home/BlogPostList.tsx` that attaches touch listeners to a card ref and manages the timer via `useRef`. Not extracted to a separate file — single use.

## 5. Reduced Motion

All animations wrapped in `@media (prefers-reduced-motion: no-preference)`.

When `prefers-reduced-motion: reduce`:
- Scale Reveal: cards start visible, no animation
- Image Zoom: no transform on hover
- View Transitions: disabled (browser respects this automatically via `@media`)
- Touch interactions: no scale pulse, no preview elevation
- Content appears instantly in its final state

## Files to Modify

| File | Changes |
|---|---|
| `src/styles/Home.module.scss` | Scale reveal initial/visible states, image zoom hover (replacing existing card hover), stagger delays, reduced motion queries |
| `src/components/Home/BlogPostList.tsx` | `IntersectionObserver` via `useEffect`, `view-transition-name` per card, `useCardInteractions` hook for touch events |
| `src/components/SeoHead.tsx` or `src/pages/_document.tsx` | Add `<meta name="view-transition" content="same-origin">` |
| `src/styles/globals.css` | `::view-transition-*` CSS rules, `view-transition-name` for tag nav |

## Not In Scope

- No new npm dependencies
- No client-side routing changes
- No changes to Contentful data fetching
- No changes to post detail pages
- No changes to pagination

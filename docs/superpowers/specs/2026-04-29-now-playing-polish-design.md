# Now-Playing Card Polish — Design Spec

## Problem

The `NowPlayingCard` shipped in PR #93 with utilitarian SCSS — clean, but visually flat. It reads as "blog card with a progress bar" rather than "this is the live broadcast hub of the brand." The DJ Audeos identity is musical, energetic, club-aesthetic; the home page's hero element should feel that way.

## Solution

A maximalist visual rework of `NowPlayingCard.module.scss` (and small JSX additions to support new visual elements). The component's behavior and data flow stay identical to what shipped in PR #93 — only the styling and a few decorative DOM nodes change. The result: a richly layered card combining elements from four design directions (glass + aurora, vinyl spinner, neon conic ring, ambient gradient + grain), with motion that respects `prefers-reduced-motion`.

## Visual elements (the hybrid)

The mockup confirmed in brainstorming combines all four directions into one card. Each element below maps to one of those directions:

| Element | Source | Purpose |
|---|---|---|
| **Spinning vinyl disc** (left, ~110px) | B (Vinyl) | Distinctive music identity; primary visual anchor |
| **Animated equalizer bars** (next to "● Live now") | B (Vinyl) | Subtle "audio is happening" cue; small audio-meter detail |
| **Conic-gradient progress ring** (right, ~110px) | C (Neon) | Replaces linear progress bar; `1:35 / 3:35` displayed inside |
| **Aurora radial-gradient drift** (background, animated) | A (Glass) | Slow-drifting color depth; reads as "alive" |
| **Animated gradient border** (cyan → violet → magenta, looping) | C (Neon) | Frames the card; ties palette together |
| **Film grain overlay** (SVG noise, fixed) | D (Ambient) | Texture; prevents flat-screen-feel |
| **Gradient title text** (white → soft violet) | D (Ambient) | Subtle hero treatment for the track title |
| **Glow on accent text** (source label, CTA) | C (Neon) | Reinforces the neon palette without overdoing it |

Color palette:
- `--bg-deep: #0a0618` — base canvas
- `--neon-cyan: #38bdf8`
- `--neon-violet: #a855f7`
- `--neon-magenta: #ec4899`
- `--text-warm: #f5f3ff`

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Visual scope | Hybrid combining elements from all four mockup directions | User explicitly chose "ship it" on the maximalist hybrid |
| Layout | 3-column grid: vinyl \| content \| ring (~110px / 1fr / ~110px) | Matches the approved mockup; gives both decorative elements equal weight to the content |
| Linear progress bar | **Replaced** by conic-gradient ring on the right | Ring is more distinctive visually; time displayed inside |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables vinyl spin, EQ bars, aurora drift, and border shift | Accessibility non-negotiable; static fallback still shows vinyl + ring + gradient at rest |
| Mobile/narrow | Below ~720px viewport, vinyl moves to top-left, ring stays right but smaller (~80px) | Three-column layout doesn't survive narrow widths |
| Stream offline state | Same maximalist treatment but desaturated / monochromatic, vinyl static, ring at 0% | Visual continuity; reads as "the same card, but quiet" |
| Skeleton state | Pulsing gradient placeholder matching card dimensions | Prevents layout shift; reads as "loading" not "broken" |
| Test impact | Existing tests assert content + behavior, not styling | No test changes needed; existing data-testids (`now-playing-skeleton`, `now-playing-progress-fill`, `now-playing-channel-info`) all preserved |

## Architecture

### Files

**Modified:**
- `src/components/NowPlaying/NowPlayingCard.tsx` — adds decorative DOM (vinyl div, EQ-bar spans, conic-ring wrapper). Wires `--progress-percent` CSS custom property to drive the ring fill from React state.
- `src/components/NowPlaying/NowPlayingCard.module.scss` — full rewrite implementing the hybrid visual treatment.

**No new files. No new dependencies.**

### JSX additions

The component currently renders (skeleton / live / offline). The live render adds three new visual surfaces:

```tsx
<a className={styles.card}>
  {/* NEW: animated gradient border (positioned absolute, mask-composite) */}
  <span className={styles.cardBorder} aria-hidden="true" />

  {/* NEW: vinyl disc (left column of grid) */}
  <div className={styles.vinyl} aria-hidden="true" />

  {/* Center column — content (existing JSX, plus EQ bars next to source label) */}
  <div className={styles.content}>
    <p className={styles.sourceLabel}>
      {SOURCE_LABEL[data.source]}
      {/* NEW: equalizer bars */}
      <span className={styles.eq} aria-hidden="true">
        <span /><span /><span /><span />
      </span>
    </p>
    <h2 className={styles.trackTitle}>...</h2>
    <p className={styles.artist}>...</p>
    {/* OMITTED: linear progress bar — replaced by ring on the right */}
    <p className={styles.upNext}>...</p>
    <div className={styles.footer}>...</div>
  </div>

  {/* NEW: conic ring (right column of grid) */}
  <div
    className={styles.ringWrap}
    style={{ "--progress-percent": `${progressPercent}` } as CSSProperties}
  >
    <div className={styles.ring} aria-hidden="true" />
    <div className={styles.ringText}>
      <span className={styles.ringNow}>{formatMs(displayPositionMs)}</span>
      <span className={styles.ringTotal}>{formatMs(data.track.duration_ms)}</span>
    </div>
  </div>
</a>
```

The `--progress-percent` CSS custom property bridges React state to the conic gradient. Computed in the component:

```tsx
const progressPercent = data.track.duration_ms > 0
  ? Math.min(100, (displayPositionMs / data.track.duration_ms) * 100)
  : 0;
```

The existing `data-testid="now-playing-progress-fill"` element is preserved on the conic ring (rather than the deleted linear bar) so the test from PR #93 — `bar.style.width === "0%"` — still works. The ring's CSS uses `--progress-percent` so we set `style.width = "0%"` as a no-op equivalent OR change the test assertion target. The simplest path: keep the ring's `data-testid` and assert on a different attribute (e.g., the inline `--progress-percent` value).

**Test impact:** the existing test `renders progress bar at 0% when duration_ms is 0` (in `NowPlayingCard.test.tsx`) currently asserts `bar.style.width === "0%"`. Since the linear bar is gone, this test must be updated to assert `bar.style.getPropertyValue("--progress-percent") === "0"` against the ring element. Same `data-testid="now-playing-progress-fill"` lives on the ring's `<div>`. Behavior preserved; assertion target shifts.

### CSS architecture

The SCSS module is rewritten end-to-end. Major sections:

1. **Card layout** (grid: 110px 1fr 110px; gap 1.4rem; padding 1.6rem 1.85rem; border-radius 18px)
2. **Layered backgrounds** (three pseudo-elements / z-index'd children for aurora, grain, border)
3. **Vinyl** (radial-gradient disc, 9s linear `vinyl-spin` animation, magenta center label dot)
4. **Source label + EQ bars** (flexbox; 4 spans with staggered keyframe animation)
5. **Title** (gradient text-fill via `background-clip: text`)
6. **Conic ring** (`conic-gradient(var(--neon-cyan) 0, var(--neon-violet) calc(var(--progress-percent) * 1%), rgba(255,255,255,0.08) 0)`; 6px inner mask via `::before`)
7. **Footer & CTA** (existing, with neon-cyan glow on the CTA)
8. **Offline + skeleton states** (desaturated palette, no animations)
9. **Mobile/narrow rules** (single column at <720px, ring shrinks)
10. **Reduced motion** (disables vinyl-spin, eq, aurora, border-shift, transitions)

The layered backgrounds use CSS-modules-style class names (`.aurora`, `.grain`, `.cardBorder`) on dedicated child elements, NOT pseudo-elements on the card itself. This is because:
- The card needs `overflow: hidden` to clip the layers, which would clip the gradient border (positioned outside the content edge).
- Pseudo-elements on `<a>` interact poorly with `mask-composite` for the border-shift trick.

So the component renders ~3 dedicated decorative `<span aria-hidden="true">`s for the visual layers. Light DOM cost; clean separation of concerns.

### Animation specifics

| Animation | Duration | Easing | Loop | Disabled by reduced-motion |
|---|---|---|---|---|
| Vinyl spin | 9s | linear | infinite | Yes |
| EQ bars | 0.85s (staggered 0.15s per bar) | ease-in-out | infinite | Yes |
| Aurora drift | 14s | ease-in-out alternate | infinite | Yes |
| Border shift | 8s | linear | infinite | Yes |
| Progress ring fill | 0.4s | linear | one-shot per state change | Yes (instant transition) |
| Hover lift | 0.2s | ease | one-shot | Yes (no transform) |

Total: 4 simultaneous CSS animations always running on the live state. All are GPU-accelerated (`transform`, `opacity`, `background-position`). No layout-triggering properties.

## Mobile / responsive

At viewports below 720px, the 3-column grid collapses:

```scss
@media (max-width: 720px) {
  .card {
    grid-template-columns: 80px 1fr;
    grid-template-areas:
      "vinyl content"
      "ring   ring";
    gap: 1rem;
  }
  .vinyl    { grid-area: vinyl; width: 80px; height: 80px; }
  .content  { grid-area: content; }
  .ringWrap { grid-area: ring; justify-self: center; margin-top: 0.5rem; }
  .ring     { width: 80px; height: 80px; }
}
```

The ring takes a row of its own at the bottom on mobile rather than being squeezed alongside the content.

## Edge cases

| Case | Behavior |
|---|---|
| `duration_ms === 0` | Ring renders fully empty (gradient stops both at 0%); time displays `0:00 / 0:00` |
| `track === null` | Renders "No metadata available." in place of title/artist; ring is not rendered (no progress to show); vinyl still spins (or is static under reduced motion) |
| `next_track === null` | Up-next line omitted; everything else unchanged |
| `channel.description === null` | Footer renders only `channel.name` |
| Stream offline | Vinyl visible but static; ring at 0%; aurora/border desaturated to grays; text + accents drop their cyan/violet glow |
| Reduced motion | All animations disabled; vinyl frozen at neutral angle; aurora frozen mid-position; border static gradient; no hover transform |
| Mobile (<720px) | Ring moves below content; vinyl shrinks to 80px |

## Testing

No new tests. Existing `NowPlayingCard.test.tsx` (28 tests) all continue to pass with one minor adjustment:

- **`renders progress bar at 0% when duration_ms is 0`** — currently asserts `bar.style.width === "0%"`. Update to assert `bar.style.getPropertyValue("--progress-percent") === "0"`. The `data-testid="now-playing-progress-fill"` element moves from the deleted linear-bar to the conic ring's container. One-line change in the test, no behavior change.

All other tests assert on text content, presence/absence of elements, ARIA attributes, or polling behavior — none of which are affected by the visual rework.

## SEO / performance impact

- **No SSR data change.** The skeleton placeholder still renders on the server; client hydration starts polling. No new build-time API calls.
- **Animation CPU cost.** 4 simultaneous CSS animations, all GPU-accelerated. Modern browsers handle this in compositor with no main-thread cost. On the home page only (one card per page), no perf concern.
- **Bundle size.** Pure SCSS additions (~280 lines, gzipped ~3KB). No JS dependencies. Negligible.
- **LCP.** The card's skeleton renders server-side; live data hydrates client-side. The hero is still the first card image of the first category section (unchanged). Skeleton dimensions match live card → zero CLS contribution.
- **Reduced-motion users** see a clean static version, no degradation in legibility or hierarchy.

## Out of scope

- Audio visualization driven by real audio data (the EQ bars are decorative; not connected to anything).
- Album-art-extracted color theming (no album art in the API response).
- Audio playback embedded in the card (tap goes to `play.audeos.com`).
- Different visual treatments per `source` value (live / scheduled / loop_fallback all use the same hybrid).
- Animating the conic ring fill with smooth transitions on poll updates (the existing 0.4s linear transition is sufficient; smooth-tracking via `@property` registration is a future enhancement).
- Bringing back the linear progress bar as a fallback. Decision is to commit fully to the ring.

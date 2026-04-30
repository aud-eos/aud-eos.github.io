# Now-Playing Card Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visual rework of `NowPlayingCard` — vinyl spinner, conic progress ring, animated gradient border, aurora drift backdrop, EQ bars, film grain overlay. Behavior identical to PR #93; only styling and a few decorative DOM nodes change.

**Architecture:** Two-step refactor of the component file. Task 1 restructures the JSX — adds vinyl/ring/EQ/border DOM nodes, replaces linear progress bar with conic ring (with `data-testid="now-playing-progress-fill"` moved to it), wires `--progress-percent` CSS custom property from React state, and updates one test assertion to match. Task 2 rewrites the SCSS module end-to-end to implement the hybrid visual treatment. Task 3 verifies and ships.

**Tech Stack:** React 19, TypeScript, SCSS modules, Vitest. Pure CSS for all visual effects (no new dependencies).

**Spec:** `docs/superpowers/specs/2026-04-29-now-playing-polish-design.md`

**Branch:** `polish-now-playing-card` (already created, off `main`).

---

### Task 1: Restructure JSX + update one test assertion

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.tsx`
- Modify: `src/components/NowPlaying/NowPlayingCard.module.scss` (add empty rules for new class names; full styling in Task 2)
- Modify: `src/__tests__/components/NowPlayingCard.test.tsx` (one test assertion)

The component grows new decorative DOM (gradient border span, vinyl div, EQ bars, conic ring with text inside) and loses the linear progress bar. The `data-testid="now-playing-progress-fill"` moves from the deleted linear-bar element to the new ring element. Inline `style={{ "--progress-percent": ... }}` drives the conic gradient from React state.

The time display text format stays identical (`${formatMs(now)} / ${formatMs(total)}` in a single span) so 99% of existing tests pass without changes. Only the one test that asserts `bar.style.width === "0%"` needs to change to `ring.style.getPropertyValue("--progress-percent") === "0"`.

- [ ] **Step 1: Read the current component to confirm starting state**

Read `src/components/NowPlaying/NowPlayingCard.tsx`. Confirm it currently has:
- `useReducer` with `displayPositionMs` and `epoch` state
- Two `useEffect`s (poll + tick)
- Renders `<a className={styles.card}>` with source label, track info, linear progress bar inside `.progress` / `.progressTrack` / `.progressFill`, up-next, footer, etc.
- An offline branch and a skeleton branch.

If anything significantly differs from this, STOP and report — the plan assumes the component matches the post-PR-#93 state.

- [ ] **Step 2: Update the one test assertion**

In `src/__tests__/components/NowPlayingCard.test.tsx`, find this test:

```typescript
  it( "renders progress bar at 0% when duration_ms is 0", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 0, duration_ms: 0 },
    });
    render( <NowPlayingCard /> );
    const bar = await screen.findByTestId( "now-playing-progress-fill" );
    expect( bar.style.width ).toBe( "0%" );
  });
```

Replace with:

```typescript
  it( "renders progress ring at 0% when duration_ms is 0", async () => {
    mockFetchOnce({
      ...livePayload,
      track: { ...livePayload.track, position_ms: 0, duration_ms: 0 },
    });
    render( <NowPlayingCard /> );
    const ring = await screen.findByTestId( "now-playing-progress-fill" );
    expect( ring.style.getPropertyValue( "--progress-percent" ) ).toBe( "0" );
  });
```

- [ ] **Step 3: Run all NowPlayingCard tests — the modified test should now FAIL**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: 1 test FAILS (the one we just rewrote — it now expects `--progress-percent === "0"` but the current component sets `width` not `--progress-percent`). 27 others still PASS.

If more than 1 test fails, STOP and investigate.

- [ ] **Step 4: Replace the live-render JSX in the component**

In `src/components/NowPlaying/NowPlayingCard.tsx`:

First, add `CSSProperties` to the React imports at the top:

```typescript
import { useEffect, useReducer, type CSSProperties } from "react";
```

Replace the entire live-render block. Find this current block:

```typescript
  return (
    <a
      href={ `${AUDEOS_PLAY_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <p className={ styles.sourceLabel }>{ SOURCE_LABEL[data.source] }</p>
      { data.track ? (
        <div className={ styles.trackInfo }>
          <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
          { data.track.artist && (
            <p className={ styles.artist }>{ data.track.artist }</p>
          ) }
          <div className={ styles.progress }>
            <div className={ styles.progressTrack }>
              <div
                data-testid="now-playing-progress-fill"
                className={ styles.progressFill }
                style={ {
                  width: data.track.duration_ms > 0
                    ? `${Math.min( 100, ( displayPositionMs / data.track.duration_ms ) * 100 )}%`
                    : "0%",
                } }
              />
            </div>
            <span className={ styles.progressTime }>
              { formatMs( displayPositionMs ) } / { formatMs( data.track.duration_ms ) }
            </span>
          </div>
        </div>
      ) : (
        <p className={ styles.noMetadata }>No metadata available.</p>
      ) }
      { data.next_track && (
        <p className={ styles.upNext }>
          Up next · { data.next_track.title }
          { data.next_track.artist && ` · ${data.next_track.artist}` }
        </p>
      ) }
      <div className={ styles.footer }>
        <p data-testid="now-playing-channel-info" className={ styles.channelInfo }>
          { data.channel.name }
          { data.channel.description && ` · ${data.channel.description}` }
        </p>
        <div className={ styles.footerRow }>
          <span className={ styles.listenerCount }>
            { data.listener_count } listening
          </span>
          <span className={ styles.cta }>Tune in →</span>
        </div>
      </div>
    </a>
  );
```

Replace with:

```typescript
  const trackDurationMs = data.track?.duration_ms ?? 0;
  const progressPercent = trackDurationMs > 0
    ? Math.min( 100, ( displayPositionMs / trackDurationMs ) * 100 )
    : 0;

  return (
    <a
      href={ `${AUDEOS_PLAY_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <span className={ styles.cardBorder } aria-hidden="true" />
      <div className={ styles.vinyl } aria-hidden="true" />

      <div className={ styles.content }>
        <p className={ styles.sourceLabel }>
          { SOURCE_LABEL[data.source] }
          <span className={ styles.eq } aria-hidden="true">
            <span /><span /><span /><span />
          </span>
        </p>
        { data.track ? (
          <>
            <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
            { data.track.artist && (
              <p className={ styles.artist }>{ data.track.artist }</p>
            ) }
          </>
        ) : (
          <p className={ styles.noMetadata }>No metadata available.</p>
        ) }
        { data.next_track && (
          <p className={ styles.upNext }>
            Up next · { data.next_track.title }
            { data.next_track.artist && ` · ${data.next_track.artist}` }
          </p>
        ) }
        <div className={ styles.footer }>
          <p data-testid="now-playing-channel-info" className={ styles.channelInfo }>
            { data.channel.name }
            { data.channel.description && ` · ${data.channel.description}` }
          </p>
          <div className={ styles.footerRow }>
            <span className={ styles.listenerCount }>
              { data.listener_count } listening
            </span>
            <span className={ styles.cta }>Tune in →</span>
          </div>
        </div>
      </div>

      { data.track && (
        <div className={ styles.ringWrap }>
          <div
            data-testid="now-playing-progress-fill"
            className={ styles.ring }
            style={ { "--progress-percent": String( progressPercent ) } as CSSProperties }
            aria-hidden="true"
          />
          <span className={ styles.ringTime }>
            { formatMs( displayPositionMs ) } / { formatMs( data.track.duration_ms ) }
          </span>
        </div>
      ) }
    </a>
  );
```

Key differences from before:
- Added `progressPercent` calculation above `return`
- Wrapped content in `<div className={styles.content}>` (the center column of the grid)
- Added `<span className={styles.cardBorder}>`, `<div className={styles.vinyl}>` (decorative-only, `aria-hidden="true"`)
- Added EQ bars `<span>` (with 4 inner `<span>`s) inside the source label
- Removed the linear progress bar (`.progress`, `.progressTrack`, `.progressFill`)
- Added `<div className={styles.ringWrap}>` (right column) containing the ring + single-line time text
- Moved `data-testid="now-playing-progress-fill"` to the ring element
- Inline `style={{"--progress-percent": String(progressPercent)}}` on the ring (drives the conic gradient in CSS)
- Time text format `${formatMs(now)} / ${formatMs(total)}` is unchanged (preserves existing test assertions)

The offline + skeleton branches stay UNCHANGED in this task — they don't have a progress bar anyway.

- [ ] **Step 5: Add placeholder rules for new SCSS classes**

In `src/components/NowPlaying/NowPlayingCard.module.scss`, ADD these empty rules (don't remove existing ones — Task 2 rewrites the whole file):

```scss
.cardBorder {}
.vinyl {}
.content {}
.eq {}
.ringWrap {}
.ring {}
.ringTime {}
```

Without these placeholders, the `styles.cardBorder`, `styles.vinyl`, etc. references resolve to `undefined` at runtime — harmless for tests but causes lint complaints in some setups. Better to declare them up front.

- [ ] **Step 6: Run tests — all 28 should pass**

Run: `yarn test src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS — 28/28 tests green.

If any test fails, the most likely cause is text content matching. The time format test assertions like `"1:35 / 3:35"` rely on the time being one continuous text node. The new JSX uses `<span className={styles.ringTime}>{formatMs(...)} / {formatMs(...)}</span>` which renders as one text node. If JSX whitespace handling produces something different, fix the spaces in the template.

- [ ] **Step 7: Run lint + typecheck + full suite**

Run: `yarn lint && yarn typecheck && yarn test`
Expected: PASS, no regressions.

- [ ] **Step 8: Commit**

```bash
git add src/components/NowPlaying/NowPlayingCard.tsx src/components/NowPlaying/NowPlayingCard.module.scss src/__tests__/components/NowPlayingCard.test.tsx
git commit -m "refactor: NowPlayingCard JSX adds vinyl/ring/EQ/border decorations"
```

---

### Task 2: Full SCSS rewrite — hybrid visual treatment

**Files:**
- Modify: `src/components/NowPlaying/NowPlayingCard.module.scss` (full rewrite)

Replace the entire SCSS module with the hybrid styling: spinning vinyl, conic ring, EQ bars, aurora gradient drift, animated gradient border, film grain overlay, gradient title text, neon cyan accents, light-mode override, mobile breakpoint, reduced-motion override.

- [ ] **Step 1: Replace the entire SCSS file**

Replace the ENTIRE contents of `src/components/NowPlaying/NowPlayingCard.module.scss` with:

```scss
.card {
  --bg-deep: #0a0618;
  --neon-cyan: #38bdf8;
  --neon-violet: #a855f7;
  --neon-magenta: #ec4899;
  --text-warm: #f5f3ff;

  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: 110px 1fr 110px;
  gap: 1.4rem;
  align-items: center;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto 4rem;
  padding: 1.6rem 1.85rem;
  border-radius: 18px;
  color: var(--text-warm);
  text-decoration: none;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 15% 30%, rgba(168, 85, 247, 0.55), transparent 55%),
    radial-gradient(ellipse at 85% 75%, rgba(56, 189, 248, 0.5), transparent 55%),
    radial-gradient(ellipse at 60% 25%, rgba(236, 72, 153, 0.4), transparent 55%),
    var(--bg-deep);
  background-size: 200% 200%;
  animation: aurora 14s ease-in-out infinite alternate;
  box-shadow:
    0 20px 60px rgba(168, 85, 247, 0.25),
    0 0 80px rgba(56, 189, 248, 0.1);
  transition: box-shadow 0.25s ease, transform 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 28px 80px rgba(168, 85, 247, 0.35),
      0 0 100px rgba(56, 189, 248, 0.2);
  }

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    background:
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E"),
      linear-gradient(180deg, rgba(10, 6, 24, 0.4), rgba(10, 6, 24, 0.55));
    pointer-events: none;
  }
}

@keyframes aurora {
  0%   { background-position: 0% 0%, 100% 100%, 50% 50%, 0 0; }
  100% { background-position: 60% 40%, 30% 70%, 80% 30%, 0 0; }
}

.cardBorder {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  padding: 1px;
  background: linear-gradient(120deg, var(--neon-cyan), var(--neon-violet), var(--neon-magenta), var(--neon-cyan));
  background-size: 300% 100%;
  animation: borderShift 8s linear infinite;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 0;
}

@keyframes borderShift {
  to { background-position: 300% 0%; }
}

.vinyl {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%,
    var(--neon-magenta) 0 8%,
    #1a1a1a 9% 12%,
    #2a2a2a 12% 14%,
    #1a1a1a 14% 50%,
    #2a2a2a 50% 53%,
    #1a1a1a 53% 100%);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 24px rgba(0, 0, 0, 0.6),
    0 0 24px rgba(168, 85, 247, 0.4);
  animation: vinylSpin 9s linear infinite;
  position: relative;
}

.vinyl::after {
  content: "";
  position: absolute;
  inset: 47%;
  background: var(--bg-deep);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
}

@keyframes vinylSpin {
  to { transform: rotate(360deg); }
}

.content {
  min-width: 0;
}

.sourceLabel {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.6rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--neon-cyan);
  text-shadow: 0 0 12px rgba(56, 189, 248, 0.5);
}

.eq {
  display: inline-flex;
  align-items: end;
  gap: 3px;
  height: 14px;
}

.eq span {
  width: 3px;
  background: var(--neon-cyan);
  border-radius: 1px;
  box-shadow: 0 0 6px rgba(56, 189, 248, 0.7);
  animation: eq 0.85s ease-in-out infinite;
}
.eq span:nth-child(1) { animation-delay: 0s; }
.eq span:nth-child(2) { animation-delay: 0.15s; }
.eq span:nth-child(3) { animation-delay: 0.3s; }
.eq span:nth-child(4) { animation-delay: 0.45s; }

@keyframes eq {
  0%, 100% { height: 25%; }
  50%      { height: 100%; }
}

.trackTitle {
  margin: 0 0 0.3rem;
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1.15;
  background: linear-gradient(90deg, var(--text-warm), #e9d5ff);
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
          color: transparent;
}

.artist {
  margin: 0 0 0.95rem;
  font-size: 0.95rem;
  opacity: 0.75;
}

.noMetadata {
  margin: 0.6rem 0 0;
  font-style: italic;
  opacity: 0.6;
}

.upNext {
  margin: 0 0 0.95rem;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.7;
}

.footer {
  margin-top: 0.6rem;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.channelInfo {
  margin: 0;
  font-size: 0.78rem;
  opacity: 0.55;
}

.footerRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.4rem;
  font-size: 0.88rem;
}

.listenerCount {
  opacity: 0.7;
}

.cta {
  color: var(--neon-cyan);
  font-weight: 600;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.5);
}

.ringWrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 110px;
  height: 110px;
}

.ring {
  --progress-percent: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(
    var(--neon-cyan) 0,
    var(--neon-violet) calc(var(--progress-percent) * 1%),
    rgba(255, 255, 255, 0.08) calc(var(--progress-percent) * 1%),
    rgba(255, 255, 255, 0.08) 100%
  );
  box-shadow: 0 0 24px rgba(56, 189, 248, 0.3);
  position: relative;
  transition: background 0.4s linear;
}

.ring::before {
  content: "";
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 30%, rgba(168, 85, 247, 0.2), transparent 60%),
    var(--bg-deep);
}

.ringTime {
  position: absolute;
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 0.78rem;
  color: var(--neon-cyan);
  text-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
  white-space: nowrap;
}

/* ===== Skeleton ===== */
.skeleton {
  position: relative;
  width: 100%;
  max-width: 64rem;
  min-height: 12rem;
  margin: 0 auto 4rem;
  padding: 1.6rem 1.85rem;
  border-radius: 18px;
  background: linear-gradient(135deg,
    rgba(168, 85, 247, 0.12),
    rgba(56, 189, 248, 0.08));
  border: 1px solid rgba(168, 85, 247, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  animation: skeletonPulse 1.6s ease-in-out infinite;
  pointer-events: none;
  cursor: default;
}

@keyframes skeletonPulse {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 0.9; }
}

/* ===== Offline ===== */
.offline {
  position: relative;
  display: block;
  width: 100%;
  max-width: 64rem;
  margin: 0 auto 4rem;
  padding: 1.6rem 1.85rem;
  border-radius: 18px;
  color: rgba(245, 243, 255, 0.85);
  text-decoration: none;
  background:
    linear-gradient(180deg, rgba(40, 40, 55, 0.8), rgba(20, 20, 30, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
  transition: border-color 0.2s ease, transform 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.16);
    transform: translateY(-1px);
  }
}

.offlineCta {
  margin: 0.6rem 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  opacity: 0.75;
}

/* ===== Mobile / narrow widths ===== */
@media (max-width: 720px) {
  .card {
    grid-template-columns: 80px 1fr;
    grid-template-areas:
      "vinyl content"
      "ring  ring";
    gap: 1rem;
    padding: 1.25rem 1.4rem;
  }
  .vinyl {
    grid-area: vinyl;
    width: 80px;
    height: 80px;
  }
  .content {
    grid-area: content;
  }
  .ringWrap {
    grid-area: ring;
    justify-self: center;
    margin-top: 0.6rem;
    width: 90px;
    height: 90px;
  }
  .trackTitle {
    font-size: 1.4rem;
  }
}

/* ===== Light mode tweaks ===== */
@media (prefers-color-scheme: light) {
  .card {
    --bg-deep: #1a1530;
    box-shadow:
      0 14px 40px rgba(168, 85, 247, 0.2),
      0 0 60px rgba(56, 189, 248, 0.08);
  }
  .skeleton {
    background: linear-gradient(135deg,
      rgba(168, 85, 247, 0.1),
      rgba(56, 189, 248, 0.06));
  }
}

/* ===== Reduced motion ===== */
@media (prefers-reduced-motion: reduce) {
  .card,
  .vinyl,
  .cardBorder,
  .eq span,
  .skeleton,
  .ring {
    animation: none;
  }
  .card,
  .offline {
    transition: none;
  }
  .card:hover,
  .offline:hover {
    transform: none;
  }
}
```

- [ ] **Step 2: Run lint + typecheck**

Run: `yarn lint && yarn typecheck`
Expected: PASS — pure SCSS additions, no TypeScript impact.

- [ ] **Step 3: Run the full test suite**

Run: `yarn test`
Expected: PASS — tests assert on text content + DOM structure + behavior; styling is invisible to them.

- [ ] **Step 4: Run the production build**

Run: `yarn build`
Expected: PASS — SCSS compiles via the existing pipeline.

- [ ] **Step 5: Commit**

```bash
git add src/components/NowPlaying/NowPlayingCard.module.scss
git commit -m "feat: hybrid visual treatment for NowPlayingCard (vinyl + ring + aurora + grain)"
```

---

### Task 3: Final verification + PR

**Files:**
- (No file changes — verification + PR creation only.)

- [ ] **Step 1: Run all checks one more time**

Run: `yarn typecheck && yarn lint && yarn test && yarn build`
Expected: PASS — all green.

If `yarn build` fails or produces unexpected output, investigate before opening the PR.

- [ ] **Step 2: Verify the skeleton still renders in dist/index.html**

```bash
node -e "
const fs = require('fs');
const html = fs.readFileSync('dist/index.html', 'utf8');
console.log('skeleton present:', /now-playing-skeleton/.test(html));
console.log('category section present:', /category-music/.test(html));
"
```

Expected: Both `true`. The widget's skeleton renders SSR; the live card materializes after hydration.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin polish-now-playing-card
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --title "feat: visual polish for NowPlayingCard (vinyl + ring + aurora)" --body "$(cat <<'EOF'
## Summary

Visual rework of \`NowPlayingCard\` combining four design directions into one richly layered hero card. Behavior is identical to PR #93 — only styling and a few decorative DOM nodes change.

### What's combined
- **Spinning vinyl disc** on the left (slow 9s rotation; magenta center label)
- **Conic-gradient progress ring** on the right (replaces the linear bar; cyan→violet fill)
- **Animated equalizer bars** next to the "● Live now" label (4 bars with staggered keyframes)
- **Aurora gradient drift** behind everything (14s slow color shift across magenta/violet/cyan radial gradients)
- **Animated gradient border** running cyan→violet→magenta around the card edge (8s linear loop)
- **Film grain overlay** (SVG noise) for texture
- **Gradient title text** (white→soft violet)
- **Neon cyan accents** on source label + Tune in CTA (with text-shadow glow)

### Accessibility
- All decorative DOM has \`aria-hidden="true"\`
- \`@media (prefers-reduced-motion: reduce)\` disables all animations and hover transforms
- \`@media (prefers-color-scheme: light)\` tweaks the base color
- Mobile (<720px) collapses to two-row grid: vinyl + content on top, ring centered below

### Tests
28/28 existing NowPlayingCard tests pass. One assertion updated: the \`renders progress at 0%\` test moved from asserting \`bar.style.width === "0%"\` (linear bar, deleted) to \`ring.style.getPropertyValue("--progress-percent") === "0"\` (conic ring). Same \`data-testid="now-playing-progress-fill"\` lives on the ring.

### Performance
- 4 simultaneous CSS animations, all GPU-accelerated (transform / background-position)
- No new JS dependencies
- ~280 lines of SCSS added (~3KB gzipped)
- Skeleton dimensions match live card (zero CLS contribution)
- Zero impact on Contentful API quota (still pure client-side)

## Test plan
- [ ] Load \`/\` in browser — see the live card with spinning vinyl, progress ring, animated border, aurora drift
- [ ] Verify track title gradient, EQ bars next to "Live now", listener count, Tune in CTA glow
- [ ] Resize to mobile width — vinyl + content stack on top, ring drops below centered
- [ ] DevTools → Rendering → "Emulate prefers-reduced-motion: reduce" — all animations stop, layout intact
- [ ] DevTools → Rendering → "Emulate prefers-color-scheme: light" — card adjusts; readable
- [ ] Stream offline state (throttle to offline, wait 30s) — card swaps to monochromatic offline placeholder

Spec: \`docs/superpowers/specs/2026-04-29-now-playing-polish-design.md\`
Plan: \`docs/superpowers/plans/2026-04-29-now-playing-polish.md\`
EOF
)"
```

- [ ] **Step 5: Return the PR URL**

The output of `gh pr create` is the PR URL. Report it back.

---

## Self-review

**Spec coverage** — every section of the spec maps to a task:

| Spec section | Task |
|---|---|
| JSX additions (vinyl, EQ, ring, border span, content wrapper) | 1 |
| `--progress-percent` CSS custom property wiring | 1 |
| `data-testid` move from linear bar to ring | 1 |
| Test assertion update (one test) | 1 |
| Aurora gradient drift | 2 |
| Animated gradient border | 2 |
| Vinyl spin animation | 2 |
| EQ bar animation (4 bars staggered) | 2 |
| Conic-gradient progress ring | 2 |
| Film grain overlay (SVG noise) | 2 |
| Gradient title text | 2 |
| Neon cyan accents (source label, CTA, text-shadow glows) | 2 |
| Mobile breakpoint at 720px | 2 |
| Light mode tweaks | 2 |
| Reduced-motion override | 2 |
| Skeleton + offline state styling | 2 |
| Verification + PR | 3 |

**Type consistency:**
- `progressPercent` (Task 1, JSX) is consumed by the inline `--progress-percent` style on `.ring`, then read by `conic-gradient(... calc(var(--progress-percent) * 1%) ...)` in Task 2's SCSS. Names match.
- `data-testid="now-playing-progress-fill"` is on the ring in both Task 1's JSX and the assertion target in Task 1's updated test. Names match.
- All new CSS class names introduced in Task 1 (`cardBorder`, `vinyl`, `content`, `eq`, `ringWrap`, `ring`, `ringTime`) get rules in Task 2's SCSS rewrite. No orphan class names.

**Placeholder scan** — no TBDs / TODOs / "implement appropriate". Every code step has the actual code an engineer can paste.

**Note on intermediate state** — between Task 1's commit and Task 2's commit, the card renders with the new DOM structure but only minimal styling (the empty rules from Task 1's Step 5). The card will look broken (unstyled grid, no decoration) but tests pass and the build succeeds. Task 2's commit fixes the visuals. This is similar to the original now-playing widget plan (Tasks 2-6 used empty SCSS rules until the final styling task). Mention this in the Task 2 commit.

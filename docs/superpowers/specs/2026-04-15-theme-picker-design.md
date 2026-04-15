# Theme Picker Design

**Date:** 2026-04-15
**Status:** Approved

## Overview

Add a light/dark/system color scheme picker to the site footer. The picker is a segmented control that lets users override the OS-level `prefers-color-scheme` preference, with the choice persisted in localStorage.

## How It Works

The site currently uses `@media (prefers-color-scheme: dark)` in CSS to switch themes. This design adds a user-override layer:

1. A `data-theme` attribute on `<html>` controls the active theme. Values: `"light"`, `"dark"`, or absent (system default).
2. CSS selectors change from `@media (prefers-color-scheme: dark)` to `[data-theme="dark"]`, with a fallback media query that sets `data-theme` when no override is present.
3. A blocking `<script>` in `_document.tsx` reads localStorage and sets `data-theme` before first paint, preventing flash-of-wrong-theme.
4. Selecting "system" clears localStorage and removes `data-theme`, reverting to pure CSS media query behavior.

## ThemePicker Component

- Segmented control with three buttons: ☀️ (light), 🌙 (dark), 💻 (system)
- Minimal/modern styling: subtle border, rounded corners, blends quietly into the footer
- Placed in footer between the copyright notice and the cookie preferences button
- Reads and writes `localStorage` using a constant key (`THEME_PREFERENCE_KEY`)
- Sets `document.documentElement.dataset.theme` on click
- For "system" selection: removes `data-theme` attribute and clears localStorage

## Flash Prevention

An inline `<script>` in `_document.tsx` `<Head>` runs before React hydration:

```
(function() {
  var pref = localStorage.getItem("theme-preference");
  if (pref === "light" || pref === "dark") {
    document.documentElement.setAttribute("data-theme", pref);
  }
})();
```

When no preference is stored (or "system" was chosen), `data-theme` stays absent and CSS media queries handle theming natively.

## CSS Strategy

### globals.css

Current structure:
```css
:root { /* light variables */ }
@media (prefers-color-scheme: dark) { :root { /* dark variables */ } }
```

New structure:
```css
:root { /* light variables */ }
[data-theme="dark"] { /* dark variables */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark variables */ }
}
```

The media query block uses `:root:not([data-theme="light"])` so that dark mode still applies automatically when the user hasn't set an explicit preference, but is overridden when the user explicitly chose light mode.

### SCSS Modules

The same pattern applies to all 6 SCSS files that currently use `@media (prefers-color-scheme)`:

- `OldSchoolButton.module.scss`
- `BlogPost.module.scss`
- `Markdown.module.scss`
- `Gallery.module.scss`
- `Tags.module.scss`
- `Playlist.module.scss`

Each `@media (prefers-color-scheme: dark)` block becomes a `[data-theme="dark"]` selector plus a `:not([data-theme="light"])` media query fallback. Light-mode `@media` blocks follow the inverse pattern.

## File Changes

| File | Change |
|------|--------|
| `src/components/ThemePicker.tsx` | **New** — segmented control component |
| `src/styles/ThemePicker.module.scss` | **New** — minimal picker styling |
| `src/constants.ts` | Add `THEME_PREFERENCE_KEY` |
| `src/pages/_document.tsx` | Add inline blocking script for flash prevention |
| `src/styles/globals.css` | Replace media queries with `data-theme` selectors |
| `src/styles/OldSchoolButton.module.scss` | Replace media queries |
| `src/styles/BlogPost.module.scss` | Replace media queries |
| `src/styles/Markdown.module.scss` | Replace media queries |
| `src/styles/Gallery.module.scss` | Replace media queries |
| `src/styles/Tags.module.scss` | Replace media queries |
| `src/styles/Playlist.module.scss` | Replace media queries |
| `src/components/Layout/Footer.tsx` | Import and render `<ThemePicker />` |

## Out of Scope

- No React context or theme provider — `data-theme` on `<html>` + CSS handles everything
- No JS `matchMedia` listener for system mode — clearing the override lets CSS do the work
- No animation/transition between themes

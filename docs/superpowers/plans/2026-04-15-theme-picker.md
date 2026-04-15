# Theme Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a light/dark/system theme picker to the footer that persists in localStorage and prevents flash-of-wrong-theme.

**Architecture:** A `data-theme` attribute on `<html>` drives all color decisions. A blocking inline script in `_document.tsx` sets it before first paint. CSS selectors use `[data-theme="dark"]` for explicit dark, `[data-theme="light"]` for explicit light, and a `@media (prefers-color-scheme: dark)` fallback with `:not([data-theme="light"])` for system-default users. The `ThemePicker` component reads/writes localStorage and toggles the attribute.

**Tech Stack:** Next.js (Pages Router), SCSS Modules, CSS custom properties, localStorage

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/constants.ts` | Modify | Add `THEME_PREFERENCE_KEY` |
| `src/pages/_document.tsx` | Modify | Add blocking theme script |
| `src/styles/globals.css` | Modify | Replace media queries with `data-theme` selectors |
| `src/styles/OldSchoolButton.module.scss` | Modify | Replace media queries |
| `src/styles/BlogPost.module.scss` | Modify | Replace media queries |
| `src/styles/Markdown.module.scss` | Modify | Replace media queries |
| `src/styles/Gallery.module.scss` | Modify | Replace media queries |
| `src/styles/Tags.module.scss` | Modify | Replace media queries |
| `src/styles/Playlist.module.scss` | Modify | Replace media queries |
| `src/components/ThemePicker.tsx` | Create | Segmented control component |
| `src/styles/ThemePicker.module.scss` | Create | Picker styling |
| `src/components/Layout/Footer.tsx` | Modify | Render ThemePicker |

---

### Task 1: Add constant and blocking theme script

**Files:**
- Modify: `src/constants.ts:8` (add constant after COOKIE_CONSENT_KEY)
- Modify: `src/pages/_document.tsx:6-9` (add script inside Head)

- [ ] **Step 1: Add THEME_PREFERENCE_KEY to constants**

In `src/constants.ts`, add after line 8 (`COOKIE_CONSENT_KEY`):

```ts
export const THEME_PREFERENCE_KEY = "theme-preference";
```

- [ ] **Step 2: Add blocking theme script to _document.tsx**

The inline script is a hardcoded string literal — not user input — so `dangerouslySetInnerHTML` is safe here (standard Next.js pattern for blocking scripts).

Replace `src/pages/_document.tsx` with:

```tsx
import { Html, Head, Main, NextScript } from "next/document";
import { THEME_PREFERENCE_KEY } from "@/constants";

const themeScript = `(function(){var p=localStorage.getItem("${THEME_PREFERENCE_KEY}");if(p==="light"||p==="dark"){document.documentElement.setAttribute("data-theme",p)}})()`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

Note: The constant value is inlined into the script string at build time. The script runs before React hydration, preventing flash-of-wrong-theme.

- [ ] **Step 3: Run lint and typecheck**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/constants.ts src/pages/_document.tsx
git commit -m "feat: add theme preference constant and blocking script"
```

---

### Task 2: Convert globals.css to data-theme selectors

**Files:**
- Modify: `src/styles/globals.css:1-108`

The pattern: every `@media (prefers-color-scheme: dark) { :root { ... } }` becomes two blocks:
1. `[data-theme="dark"] { ... }` — explicit user choice
2. `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` — system default fallback

- [ ] **Step 1: Replace the dark-mode variable block (lines 43-74)**

Replace:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    /* ... all dark variables ... */
  }
}
```

With:
```css
[data-theme="dark"] {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 0, 0, 0;
  --background-end-rgb: 0, 0, 0;

  --primary-glow: radial-gradient(rgba(1, 65, 255, 0.4), rgba(1, 65, 255, 0));
  --secondary-glow: linear-gradient(
    to bottom right,
    rgba(1, 65, 255, 0),
    rgba(1, 65, 255, 0),
    rgba(1, 65, 255, 0.3)
  );

  --tile-start-rgb: 2, 13, 46;
  --tile-end-rgb: 2, 5, 19;
  --tile-border: conic-gradient(
    #ffffff80,
    #ffffff40,
    #ffffff30,
    #ffffff20,
    #ffffff10,
    #ffffff10,
    #ffffff80
  );

  --callout-rgb: 20, 20, 20;
  --callout-border-rgb: 108, 108, 108;
  --card-rgb: 100, 100, 100;
  --card-border-rgb: 200, 200, 200;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;

    --primary-glow: radial-gradient(rgba(1, 65, 255, 0.4), rgba(1, 65, 255, 0));
    --secondary-glow: linear-gradient(
      to bottom right,
      rgba(1, 65, 255, 0),
      rgba(1, 65, 255, 0),
      rgba(1, 65, 255, 0.3)
    );

    --tile-start-rgb: 2, 13, 46;
    --tile-end-rgb: 2, 5, 19;
    --tile-border: conic-gradient(
      #ffffff80,
      #ffffff40,
      #ffffff30,
      #ffffff20,
      #ffffff10,
      #ffffff10,
      #ffffff80
    );

    --callout-rgb: 20, 20, 20;
    --callout-border-rgb: 108, 108, 108;
    --card-rgb: 100, 100, 100;
    --card-border-rgb: 200, 200, 200;
  }
}
```

- [ ] **Step 2: Replace the color-scheme block (lines 104-108)**

Replace:
```css
@media (prefers-color-scheme: dark) {
  html {
    color-scheme: dark;
  }
}
```

With:
```css
[data-theme="dark"] {
  color-scheme: dark;
}

[data-theme="light"] {
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) {
    color-scheme: dark;
  }
}
```

- [ ] **Step 3: Run lint**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: convert globals.css to data-theme selectors"
```

---

### Task 3: Convert SCSS modules to data-theme selectors

**Files:**
- Modify: `src/styles/OldSchoolButton.module.scss:21-54`
- Modify: `src/styles/BlogPost.module.scss:8-11,22-24`
- Modify: `src/styles/Markdown.module.scss:5-8`
- Modify: `src/styles/Gallery.module.scss:28-30,97-100,124-126,137-139,159-162`
- Modify: `src/styles/Tags.module.scss:9-11`
- Modify: `src/styles/Playlist.module.scss:8-10`

The conversion pattern for each file:

**`@media (prefers-color-scheme: dark)` → two selectors:**
- `:global([data-theme="dark"]) .selector { ... }` — explicit dark
- `@media (prefers-color-scheme: dark) { :global(:root:not([data-theme="light"])) .selector { ... } }` — system fallback

**`@media (prefers-color-scheme: light)` → two selectors:**
- `:global([data-theme="light"]) .selector { ... }` — explicit light
- `@media (prefers-color-scheme: light) { :global(:root:not([data-theme="dark"])) .selector { ... } }` — system fallback

Note: In SCSS modules, `[data-theme]` lives on `<html>` which is outside the module scope, so we use `:global()` to escape module scoping.

- [ ] **Step 1: Convert OldSchoolButton.module.scss**

Replace the full file content with:

```scss
.button {
  display: inline-block;

  font-size: 32px;
  line-height: 1;
  padding: 14px 36px;

  text-decoration: none;
  cursor: pointer;

  border: none;
  border-radius: 0;

  letter-spacing: 2px;

  transition: none;

}


/* LIGHT MODE */
:global([data-theme="light"]) .button {
  background: #c0c0c0;
  color: #000000;
  box-shadow: 12px 12px 0 #000000;
}

:global([data-theme="light"]) .button:active {
  transform: translate(12px, 12px);
  box-shadow: none;
}

@media (prefers-color-scheme: light) {
  :global(:root:not([data-theme="dark"])) .button {
    background: #c0c0c0;
    color: #000000;
    box-shadow: 12px 12px 0 #000000;
  }

  :global(:root:not([data-theme="dark"])) .button:active {
    transform: translate(12px, 12px);
    box-shadow: none;
  }
}


/* DARK MODE */
:global([data-theme="dark"]) .button {
  background: #c0c0c0;
  color: #000000;
  box-shadow: 12px 12px 0 #0000aa;
}

:global([data-theme="dark"]) .button:active {
  transform: translate(12px, 12px);
  box-shadow: none;
}

@media (prefers-color-scheme: dark) {
  :global(:root:not([data-theme="light"])) .button {
    background: #c0c0c0;
    color: #000000;
    box-shadow: 12px 12px 0 #0000aa;
  }

  :global(:root:not([data-theme="light"])) .button:active {
    transform: translate(12px, 12px);
    box-shadow: none;
  }
}
```

- [ ] **Step 2: Convert BlogPost.module.scss**

The file has two `@media (prefers-color-scheme: light)` blocks — one nested inside `.main a` (line 8) and one nested inside `.postNav` (line 22).

Replace lines 6-12 (the `a` block):
```scss
  a {
    color: lightgreen;
    :global([data-theme="light"]) & {
      filter: drop-shadow(.1rem .1rem .1rem black);
      text-shadow: -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000;
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme="dark"])) & {
        filter: drop-shadow(.1rem .1rem .1rem black);
        text-shadow: -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000;
      }
    }
  }
```

Replace lines 20-24 (the border-top-color inside `.postNav`):
```scss
    :global([data-theme="light"]) & {
      border-top-color: rgba(0, 0, 0, 0.15);
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme="dark"])) & {
        border-top-color: rgba(0, 0, 0, 0.15);
      }
    }
```

- [ ] **Step 3: Convert Markdown.module.scss**

Replace lines 3-9 (the `a` block):
```scss
  a {
    color: lightgreen;
    :global([data-theme="light"]) & {
      filter: drop-shadow(.1rem .1rem .1rem black);
      text-shadow: -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000;
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme="dark"])) & {
        filter: drop-shadow(.1rem .1rem .1rem black);
        text-shadow: -1px -1px 1px #000, 1px -1px 1px #000, -1px 1px 1px #000, 1px 1px 1px #000;
      }
    }
  }
```

- [ ] **Step 4: Convert Tags.module.scss**

Replace lines 9-11 (dark background inside `.tags > a > code`):
```scss
    :global([data-theme="dark"]) & {
      background: rgb(33, 33, 33);
    }
    @media (prefers-color-scheme: dark) {
      :global(:root:not([data-theme="light"])) & {
        background: rgb(33, 33, 33);
      }
    }
```

- [ ] **Step 5: Convert Playlist.module.scss**

Replace lines 8-10 (light filter inside `.playlistHeader > a > img`):
```scss
    :global([data-theme="light"]) & {
      filter: invert(100%);
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme="dark"])) & {
        filter: invert(100%);
      }
    }
```

- [ ] **Step 6: Convert Gallery.module.scss**

This file has 5 `@media (prefers-color-scheme: light)` blocks. For each, apply the same pattern. The selectors and their properties:

1. `.viewport` (line 28) — replace lines 28-30:
```scss
  :global([data-theme="light"]) & {
    background: rgba(0, 0, 0, 0.04);
  }
  @media (prefers-color-scheme: light) {
    :global(:root:not([data-theme="dark"])) & {
      background: rgba(0, 0, 0, 0.04);
    }
  }
```

2. `.navPrev, .navNext` (line 97) — replace lines 97-100:
```scss
  :global([data-theme="light"]) & {
    background: rgba(255, 255, 255, 0.55);
    color: rgba(0, 0, 0, 0.8);
  }
  @media (prefers-color-scheme: light) {
    :global(:root:not([data-theme="dark"])) & {
      background: rgba(255, 255, 255, 0.55);
      color: rgba(0, 0, 0, 0.8);
    }
  }
```

3. `.navPrev:hover` (line 124) — replace lines 124-126:
```scss
    :global([data-theme="light"]) & {
      background: rgba(255, 255, 255, 0.85);
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme="dark"])) & {
        background: rgba(255, 255, 255, 0.85);
      }
    }
```

4. `.navNext:hover` (line 137) — replace lines 137-139:
```scss
    :global([data-theme="light"]) & {
      background: rgba(255, 255, 255, 0.85);
    }
    @media (prefers-color-scheme: light) {
      :global(:root:not([data-theme="dark"])) & {
        background: rgba(255, 255, 255, 0.85);
      }
    }
```

5. `.counter` (line 159) — replace lines 159-162:
```scss
  :global([data-theme="light"]) & {
    color: rgba(0, 0, 0, 0.7);
    background: rgba(255, 255, 255, 0.55);
  }
  @media (prefers-color-scheme: light) {
    :global(:root:not([data-theme="dark"])) & {
      color: rgba(0, 0, 0, 0.7);
      background: rgba(255, 255, 255, 0.55);
    }
  }
```

- [ ] **Step 7: Run lint and tests**

Run: `yarn lint && yarn test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/styles/OldSchoolButton.module.scss src/styles/BlogPost.module.scss src/styles/Markdown.module.scss src/styles/Gallery.module.scss src/styles/Tags.module.scss src/styles/Playlist.module.scss
git commit -m "feat: convert SCSS modules to data-theme selectors"
```

---

### Task 4: Create ThemePicker component and styles

**Files:**
- Create: `src/components/ThemePicker.tsx`
- Create: `src/styles/ThemePicker.module.scss`

- [ ] **Step 1: Create ThemePicker.module.scss**

Create `src/styles/ThemePicker.module.scss`:

```scss
.themePicker {
  display: inline-flex;
  border: 1px solid rgba(128, 128, 128, 0.4);
  border-radius: 6px;
  overflow: hidden;
}

.themeButton {
  padding: 6px 14px;
  background: transparent;
  border: none;
  color: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  line-height: 1;

  &:hover {
    background: rgba(128, 128, 128, 0.15);
  }
}

.themeButtonActive {
  background: rgba(128, 128, 128, 0.25);

  &:hover {
    background: rgba(128, 128, 128, 0.25);
  }
}
```

- [ ] **Step 2: Create ThemePicker.tsx**

Create `src/components/ThemePicker.tsx`:

```tsx
import { FC, useCallback, useSyncExternalStore } from "react";
import { THEME_PREFERENCE_KEY } from "@/constants";
import styles from "@/styles/ThemePicker.module.scss";

type ThemePreference = "light" | "dark" | "system";

const THEME_OPTIONS: { value: ThemePreference; label: string; title: string }[] = [
  { value: "light", label: "☀️", title: "Light mode" },
  { value: "dark", label: "🌙", title: "Dark mode" },
  { value: "system", label: "💻", title: "System default" },
];

function getStoredPreference(): ThemePreference {
  const stored = localStorage.getItem( THEME_PREFERENCE_KEY );
  if ( stored === "light" || stored === "dark" ) return stored;
  return "system";
}

function applyTheme( preference: ThemePreference ): void {
  if ( preference === "light" || preference === "dark" ) {
    document.documentElement.setAttribute( "data-theme", preference );
    localStorage.setItem( THEME_PREFERENCE_KEY, preference );
  } else {
    document.documentElement.removeAttribute( "data-theme" );
    localStorage.removeItem( THEME_PREFERENCE_KEY );
  }
}

function subscribe( callback: () => void ): () => void {
  window.addEventListener( "storage", callback );
  return () => window.removeEventListener( "storage", callback );
}

export const ThemePicker: FC = () => {
  const isClient = useSyncExternalStore( () => () => {}, () => true, () => false );
  const activePreference = useSyncExternalStore(
    subscribe, getStoredPreference, () => "system" as ThemePreference,
  );

  const handleClick = useCallback( ( preference: ThemePreference ) => {
    applyTheme( preference );
    window.dispatchEvent( new Event( "storage" ) );
  }, [] );

  if ( !isClient ) return null;

  return (
    <div className={ styles.themePicker } role="group" aria-label="Color scheme">
      { THEME_OPTIONS.map( ( option ) => (
        <button
          key={ option.value }
          className={ `${styles.themeButton} ${activePreference === option.value ? styles.themeButtonActive : ""}` }
          onClick={ () => handleClick( option.value ) }
          title={ option.title }
          aria-pressed={ activePreference === option.value }
        >
          { option.label }
        </button>
      ) ) }
    </div>
  );
};
```

- [ ] **Step 3: Run lint**

Run: `yarn lint`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/components/ThemePicker.tsx src/styles/ThemePicker.module.scss
git commit -m "feat: create ThemePicker component"
```

---

### Task 5: Add ThemePicker to Footer

**Files:**
- Modify: `src/components/Layout/Footer.tsx:18,46-68`

- [ ] **Step 1: Add ThemePicker import and render in Footer**

Add import at line 18 (after the OldSchoolButton import):

```tsx
import { ThemePicker } from "../ThemePicker";
```

In the JSX, add a new `<div>` containing `<ThemePicker />` between the copyright div and the cookie button div (between lines 56 and 63):

```tsx
      <div>
        <ThemePicker />
      </div>
```

The footer JSX should end up as:
```tsx
      <div>
        { SOCIAL_LINKS.map( ... ) }
      </div>

      <div>
        <p>
          © { new Date().getFullYear() } Audeos, LLC | All Rights Reserved
        </p>
      </div>

      <div>
        <ThemePicker />
      </div>

      <div>
        <OldSchoolButton
          onClick={ resetCookieConsent }
          label="Update Cookie Preferences"
        />
      </div>
```

- [ ] **Step 2: Run lint and tests**

Run: `yarn lint && yarn test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout/Footer.tsx
git commit -m "feat: add ThemePicker to footer"
```

---

### Task 6: Manual verification

- [ ] **Step 1: Start dev server and verify**

Run: `yarn dev`

Open the site and verify:
1. Footer shows the theme picker between copyright and cookie button
2. Clicking ☀️ switches to light mode, sets `data-theme="light"` on `<html>`
3. Clicking 🌙 switches to dark mode, sets `data-theme="dark"` on `<html>`
4. Clicking 💻 removes `data-theme`, reverts to OS preference
5. Refresh the page — chosen theme persists (no flash)
6. Open DevTools → Application → Local Storage — verify `theme-preference` key appears/disappears correctly
7. All existing styled components (OldSchoolButton, Gallery nav, Tags, Blog post links, Markdown links, Playlist header) respect the chosen theme

- [ ] **Step 2: Run full build**

Run: `yarn build`
Expected: PASS — static export completes without errors

- [ ] **Step 3: Final commit if any fixes needed**

If any adjustments were required during verification, commit them:
```bash
git add -A
git commit -m "fix: theme picker adjustments from manual testing"
```

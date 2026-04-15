# Image Gallery Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize `ul.imageGallery` with CSS Grid, rounded images, soft shadows, hover transitions, and 4:3 aspect ratio.

**Architecture:** Pure SCSS change — replace the existing `ul.imageGallery` block in `Home.module.scss`. No component or markup changes needed.

**Tech Stack:** SCSS modules, CSS Grid

---

### Task 1: Replace imageGallery SCSS with modern grid + image styles

**Files:**
- Modify: `src/styles/Home.module.scss:59-99`

**Spec:** `docs/superpowers/specs/2026-04-15-image-gallery-modernization-design.md`

- [ ] **Step 1: Replace the `ul.imageGallery` block**

Replace lines 59-99 of `src/styles/Home.module.scss` with:

```scss
ul.imageGallery {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  justify-content: center;
  width: 100%;
  max-width: 1300px;

  li {
    figure {
      picture {
        > img {
          display: block;
          width: 100%;
          object-fit: cover;
          aspect-ratio: 4/3;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          margin-bottom: 0.25rem;

          &:hover {
            transform: scale(1.02);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
          }
        }
      }
      > figcaption, section {
        padding-right: 0.5rem;
        padding-left: 0.5rem;
        padding-top: 0.5rem;
        > a {
          text-decoration: none;
        }
      }
    }
  }
}
```

- [ ] **Step 2: Run format and lint**

Run: `yarn format && yarn lint`
Expected: No errors

- [ ] **Step 3: Run tests**

Run: `yarn test`
Expected: All tests pass (this is a CSS-only change, no logic affected)

- [ ] **Step 4: Visual check**

Run: `yarn dev`
Verify in browser:
- Grid fills available width, cards stretch to fill rows
- Images are 4:3 landscape with rounded corners
- Soft shadow visible on images
- Hovering an image scales it up slightly and deepens the shadow
- No white border, no green shadow
- Tags and captions render correctly below images
- Responsive: resize browser — grid reflows from 3 cols → 2 → 1

- [ ] **Step 5: Commit**

```bash
git add src/styles/Home.module.scss
git commit -m "feat: modernize imageGallery with CSS Grid, rounded images, and hover transitions"
```

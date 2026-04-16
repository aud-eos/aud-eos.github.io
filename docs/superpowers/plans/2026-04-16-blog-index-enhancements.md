# Blog Index Visual Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add scroll entrance animations, image zoom hover, View Transitions for tag navigation, and mobile touch interactions to the blog index page.

**Architecture:** Pure CSS animations + vanilla JS via React hooks. View Transitions API for cross-page tag navigation (progressive enhancement). All animations gated behind `prefers-reduced-motion: no-preference`. No new dependencies.

**Tech Stack:** Next.js, SCSS Modules, IntersectionObserver API, View Transitions API, React hooks

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/styles/Home.module.scss` | Modify | Scale reveal states, image zoom hover, stagger delays, tap feedback, reduced motion queries |
| `src/components/Home/BlogPostList.tsx` | Modify | IntersectionObserver hook, view-transition-name per card, touch interaction hook |
| `src/pages/_document.tsx` | Modify | Add view-transition meta tag |
| `src/styles/globals.css` | Modify | View transition CSS rules, tag nav view-transition-name |
| `src/__tests__/components/BlogPostList.test.tsx` | Create | Tests for BlogPostList rendering, view-transition-name, reduced motion |

---

### Task 1: Scale Reveal — CSS States

**Files:**
- Modify: `src/styles/Home.module.scss:129-158`

- [ ] **Step 1: Add scale reveal initial and visible states to the `li` elements**

In `src/styles/Home.module.scss`, replace the existing `li` block inside `ul.imageGallery` with scale reveal styles. The `li` starts hidden and animates when it receives a `.visible` class. Also replace the existing image hover effect (whole-card `scale(1.02)`) with the image-only zoom.

Replace this block (lines 129-158):
```scss
  li {
    figure {
      picture {
        > img {
          display: block;
          width: 100%;
          object-fit: cover;
          aspect-ratio: 4/3;
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.1);
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
```

With:
```scss
  li {
    // Scale reveal — hidden by default, shown by IntersectionObserver
    opacity: 0;
    transform: scale(0.92);
    transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    // Stagger delays for multi-column layouts
    &:nth-child(2) { transition-delay: 0.08s; }
    &:nth-child(3) { transition-delay: 0.16s; }
    &:nth-child(4) { transition-delay: 0.24s; }

    // Reset stagger for rows beyond the first (every 2 cards at 2-col, etc.)
    @media (min-width: 800px) {
      &:nth-child(2n+1) { transition-delay: 0s; }
      &:nth-child(2n+2) { transition-delay: 0.08s; }
    }
    @media (min-width: 1200px) {
      &:nth-child(3n+1) { transition-delay: 0s; }
      &:nth-child(3n+2) { transition-delay: 0.08s; }
      &:nth-child(3n+3) { transition-delay: 0.16s; }
    }
    @media (min-width: 1600px) {
      &:nth-child(4n+1) { transition-delay: 0s; }
      &:nth-child(4n+2) { transition-delay: 0.08s; }
      &:nth-child(4n+3) { transition-delay: 0.16s; }
      &:nth-child(4n+4) { transition-delay: 0.24s; }
    }

    figure {
      picture {
        overflow: hidden;
        display: block;
        border-radius: 10px;

        > img {
          display: block;
          width: 100%;
          object-fit: cover;
          aspect-ratio: 4/3;
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.3s ease;
          margin-bottom: 0.25rem;

          &:hover {
            transform: scale(1.08);
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
```

- [ ] **Step 2: Add the `.visible` class and mobile tap feedback**

Still in `src/styles/Home.module.scss`, add these rules inside `ul.imageGallery`, after the `li` block:

```scss
  // Scale reveal — visible state (applied by IntersectionObserver)
  li.visible {
    opacity: 1;
    transform: scale(1);
  }

  // Mobile tap feedback
  @media (hover: none) {
    li figure a:active {
      transform: scale(0.97);
      transition: transform 0.15s ease;
    }
  }
```

- [ ] **Step 3: Add reduced motion query**

Add at the very end of `src/styles/Home.module.scss`, outside the `ul.imageGallery` block:

```scss
// Reduced motion: disable all animations
@media (prefers-reduced-motion: reduce) {
  ul.imageGallery {
    li {
      opacity: 1;
      transform: none;
      transition: none;

      figure picture > img {
        transition: none;

        &:hover {
          transform: none;
        }
      }
    }

    li.visible {
      transition: none;
    }

    @media (hover: none) {
      li figure a:active {
        transform: none;
        transition: none;
      }
    }

    li.longPressPreview {
      transform: none;
      box-shadow: none;
      transition: none;

      figure picture > img {
        transform: none;
      }
    }
  }
}
```

- [ ] **Step 4: Run format and verify**

```bash
yarn format
yarn typecheck
```

Expected: both pass with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/styles/Home.module.scss
git commit -m "feat: add scale reveal, image zoom hover, and reduced motion styles"
```

---

### Task 2: IntersectionObserver Hook

**Files:**
- Modify: `src/components/Home/BlogPostList.tsx`

- [ ] **Step 1: Add IntersectionObserver to reveal cards on scroll**

Replace the full contents of `src/components/Home/BlogPostList.tsx` with:

```tsx
import { useEffect, useRef } from "react";
import Link from "next/link";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import Picture from "@/components/Picture";
import { Tags } from "@/components/Tags";
import { PAGE_SIZE } from "@/constants";
import { BlogPost } from "@/utils/contentfulUtils";
import { POSTS_ANCHOR } from "@/constants";


const IMAGE_WIDTH = 800;
const OBSERVER_THRESHOLD = 0.15;


export interface BlogPostListProps {
  posts: BlogPost[]
  page: number
  tagId?: string
}

export default function BlogPostList({ posts, page, tagId }: BlogPostListProps ) {
  const listRef = useRef<HTMLUListElement>( null );

  useEffect( () => {
    const list = listRef.current;
    if ( !list ) return;

    const prefersReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    if ( prefersReducedMotion ) {
      list.querySelectorAll( "li" ).forEach( item => item.classList.add( styles.visible ) );
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach( entry => {
          if ( entry.isIntersecting ) {
            entry.target.classList.add( styles.visible );
            observer.unobserve( entry.target );
          }
        });
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    list.querySelectorAll( "li" ).forEach( item => observer.observe( item ) );

    return () => observer.disconnect();
  }, [ posts, page, tagId ] );

  return (
    <ul id={ POSTS_ANCHOR } className={ styles.imageGallery } role="list" ref={ listRef }>
      {
        [ ...posts ]
          .sort( sortBlogPostsByDate )
          .slice( PAGE_SIZE * ( page - 1 ), PAGE_SIZE * page )
          .map( post => {

            const url = `/post/${post.fields.slug}`;
            const pictureUrl = post.fields.image?.fields.file?.url || "";
            const altText = post.fields.image?.fields.description || "";
            const timestamp = resolvePostDate( post );

            return (
              <li key={ post.sys.id }>
                <figure>
                  <Link href={ url } aria-label={ post.fields.title }>
                    <Picture
                      url={ pictureUrl }
                      maxWidth={ IMAGE_WIDTH }
                      alt={ altText }
                    />
                  </Link>
                  <figcaption>
                    <Link href={ url }><h3>{ post.fields.title }</h3></Link>
                    <DateTimeFormat
                      timestamp={ timestamp }
                    />
                  </figcaption>
                  <Tags
                    tags={ post.metadata.tags }
                    tagId={ tagId }
                  />
                </figure>
              </li>
            );
          })
      }
    </ul>
  );
}
```

- [ ] **Step 2: Run format and verify**

```bash
yarn format
yarn typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/Home/BlogPostList.tsx
git commit -m "feat: add IntersectionObserver for scroll-triggered scale reveal"
```

---

### Task 3: View Transitions — Meta Tag and CSS

**Files:**
- Modify: `src/pages/_document.tsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add view-transition meta tag to `_document.tsx`**

In `src/pages/_document.tsx`, add the meta tag inside `<Head>`, after the existing viewport meta:

```tsx
<meta name="view-transition" content="same-origin" />
```

The full file should be:

```tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="view-transition" content="same-origin" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

- [ ] **Step 2: Add view transition CSS rules to `globals.css`**

Add at the end of `src/styles/globals.css`:

```css
/* View Transitions — tag navigation crossfade/morph */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 0s;
  }
}
```

- [ ] **Step 3: Add view-transition-name to tag nav**

In `src/styles/Home.module.scss`, add `view-transition-name` to the `.tagNav` class so it stays anchored during page transitions:

Add this line inside the `.tagNav` block (after `border-bottom`):

```scss
  view-transition-name: tag-nav;
```

- [ ] **Step 4: Run format and verify**

```bash
yarn format
yarn typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/_document.tsx src/styles/globals.css src/styles/Home.module.scss
git commit -m "feat: add View Transitions API for tag navigation"
```

---

### Task 4: View Transition Names on Post Cards

**Files:**
- Modify: `src/components/Home/BlogPostList.tsx`

- [ ] **Step 1: Add view-transition-name to each `<li>` using the post slug**

In `src/components/Home/BlogPostList.tsx`, update the `<li>` element to include a `style` prop with a `viewTransitionName` set to the post slug. CSS `view-transition-name` values cannot contain slashes or special characters, so the slug (which is URL-safe) works directly.

Change:
```tsx
              <li key={ post.sys.id }>
```

To:
```tsx
              <li key={ post.sys.id } style={{ viewTransitionName: post.fields.slug }}>
```

- [ ] **Step 2: Run format and verify**

```bash
yarn format
yarn typecheck
```

Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/Home/BlogPostList.tsx
git commit -m "feat: add view-transition-name per post card for cross-page morphing"
```

---

### Task 5: Mobile Long-Press Preview

**Files:**
- Modify: `src/components/Home/BlogPostList.tsx`
- Modify: `src/styles/Home.module.scss`

- [ ] **Step 1: Add long-press preview CSS class**

In `src/styles/Home.module.scss`, add after the mobile tap feedback block (the `@media (hover: none)` block inside `ul.imageGallery`):

```scss
  // Long-press preview state
  li.longPressPreview {
    transform: scale(1) translateY(-4px);
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    figure picture > img {
      transform: scale(1.05);
    }
  }
```

- [ ] **Step 2: Add the `useCardInteractions` hook in `BlogPostList.tsx`**

Add this hook definition above the `BlogPostList` component, after the constants:

```tsx
const LONG_PRESS_DURATION = 500;
const TOUCH_MOVE_THRESHOLD = 10;

function useCardInteractions( listRef: React.RefObject<HTMLUListElement | null> ) {
  useEffect( () => {
    const list = listRef.current;
    if ( !list ) return;

    const isTouchDevice = window.matchMedia( "(hover: none)" ).matches;
    const prefersReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    if ( !isTouchDevice || prefersReducedMotion ) return;

    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;
    let activeCard: HTMLElement | null = null;

    function clearPreview() {
      if ( activeCard ) {
        activeCard.classList.remove( styles.longPressPreview );
        activeCard = null;
      }
      if ( pressTimer ) {
        clearTimeout( pressTimer );
        pressTimer = null;
      }
    }

    function handleTouchStart( event: TouchEvent ) {
      const card = ( event.target as HTMLElement ).closest( "li" );
      if ( !card || !list.contains( card ) ) return;

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      pressTimer = setTimeout( () => {
        activeCard = card as HTMLElement;
        activeCard.classList.add( styles.longPressPreview );
      }, LONG_PRESS_DURATION );
    }

    function handleTouchMove( event: TouchEvent ) {
      if ( !pressTimer && !activeCard ) return;
      const touch = event.touches[0];
      const deltaX = Math.abs( touch.clientX - startX );
      const deltaY = Math.abs( touch.clientY - startY );
      if ( deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD ) {
        clearPreview();
      }
    }

    function handleTouchEnd() {
      clearPreview();
    }

    list.addEventListener( "touchstart", handleTouchStart, { passive: true } );
    list.addEventListener( "touchmove", handleTouchMove, { passive: true } );
    list.addEventListener( "touchend", handleTouchEnd );
    list.addEventListener( "touchcancel", handleTouchEnd );

    return () => {
      list.removeEventListener( "touchstart", handleTouchStart );
      list.removeEventListener( "touchmove", handleTouchMove );
      list.removeEventListener( "touchend", handleTouchEnd );
      list.removeEventListener( "touchcancel", handleTouchEnd );
      clearPreview();
    };
  }, [] );
}
```

- [ ] **Step 3: Call the hook inside `BlogPostList`**

In the `BlogPostList` component body, after the existing `useEffect` call, add:

```tsx
  useCardInteractions( listRef );
```

- [ ] **Step 4: Run format and verify**

```bash
yarn format
yarn typecheck
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/Home/BlogPostList.tsx src/styles/Home.module.scss
git commit -m "feat: add mobile long-press preview interaction"
```

---

### Task 6: Tests

**Files:**
- Create: `src/__tests__/components/BlogPostList.test.tsx`

- [ ] **Step 1: Write tests for BlogPostList**

Create `src/__tests__/components/BlogPostList.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  PAGE_SIZE: 10,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );
vi.mock( "@/components/Picture", () => ({
  default: ({ alt }: { alt: string }) => <img alt={ alt } />,
}) );
vi.mock( "@/components/Tags", () => ({
  Tags: () => <div data-testid="tags" />,
}) );
vi.mock( "@/components/DateTimeFormat", () => ({
  default: () => <time />,
}) );

import BlogPostList from "@/components/Home/BlogPostList";

const makePosts = ( count: number ) =>
  Array.from({ length: count }, ( _, index ) => ({
    sys: { id: String( index ), createdAt: "2026-01-01T00:00:00Z" },
    fields: {
      title: `Post ${ index }`,
      slug: `post-${ index }`,
      image: { fields: { file: { url: "//img.test/photo.jpg" }, description: `Alt ${ index }` } },
      date: "2026-01-01",
    },
    metadata: { tags: [] },
  }) );

// Mock IntersectionObserver
const mockObserve = vi.fn();
const mockUnobserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach( () => {
  vi.stubGlobal( "IntersectionObserver", vi.fn( () => ({
    observe: mockObserve,
    unobserve: mockUnobserve,
    disconnect: mockDisconnect,
  }) ) );
  mockObserve.mockClear();
  mockUnobserve.mockClear();
  mockDisconnect.mockClear();
});

describe( "BlogPostList", () => {
  it( "renders all posts for the current page", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 3 ) as never[] } page={ 1 } />,
    );
    const items = container.querySelectorAll( "li" );
    expect( items ).toHaveLength( 3 );
  });

  it( "sets view-transition-name on each li using the post slug", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 2 ) as never[] } page={ 1 } />,
    );
    const items = container.querySelectorAll( "li" );
    expect( ( items[0] as HTMLElement ).style.viewTransitionName ).toBe( "post-1" );
    expect( ( items[1] as HTMLElement ).style.viewTransitionName ).toBe( "post-0" );
  });

  it( "creates an IntersectionObserver on mount", () => {
    render(
      <BlogPostList posts={ makePosts( 2 ) as never[] } page={ 1 } />,
    );
    expect( IntersectionObserver ).toHaveBeenCalledTimes( 1 );
    expect( mockObserve ).toHaveBeenCalledTimes( 2 );
  });

  it( "immediately shows all cards when prefers-reduced-motion is reduce", () => {
    vi.stubGlobal( "matchMedia", vi.fn( ( query: string ) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) ) );

    // Re-mock IntersectionObserver to not be called
    const observerSpy = vi.fn();
    vi.stubGlobal( "IntersectionObserver", observerSpy );

    const { container } = render(
      <BlogPostList posts={ makePosts( 2 ) as never[] } page={ 1 } />,
    );

    // Observer should not have been constructed
    expect( observerSpy ).not.toHaveBeenCalled();

    // All items should have the visible class
    const items = container.querySelectorAll( "li" );
    items.forEach( item => {
      expect( item.className ).toContain( "visible" );
    });
  });

  it( "renders links with correct hrefs", () => {
    const { container } = render(
      <BlogPostList posts={ makePosts( 1 ) as never[] } page={ 1 } />,
    );
    const links = container.querySelectorAll( "a" );
    const hrefs = Array.from( links ).map( link => link.getAttribute( "href" ) );
    expect( hrefs ).toContain( "/post/post-0" );
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
yarn test
```

Expected: all tests pass, including the new `BlogPostList.test.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/components/BlogPostList.test.tsx
git commit -m "test: add BlogPostList tests for scroll reveal, view transitions, reduced motion"
```

---

### Task 7: Manual Verification

- [ ] **Step 1: Start dev server and test in browser**

```bash
yarn dev
```

Open http://localhost:3000 and verify:

1. **Scale Reveal**: scroll down — cards should fade/scale in as they enter viewport
2. **Image Zoom**: hover over a card image — it should zoom to ~1.08 within the frame
3. **View Transitions**: click a tag — in Chrome/Edge, page should crossfade; in Safari/Firefox, instant nav
4. **Mobile (DevTools)**: toggle device mode to iPhone SE, tap a card — should pulse, long-press should elevate
5. **Reduced Motion**: in DevTools, enable "Emulate CSS media feature prefers-reduced-motion: reduce" — all animations should be disabled, content appears instantly

- [ ] **Step 2: Run full lint and test suite**

```bash
yarn lint
yarn test
```

Expected: all pass.

- [ ] **Step 3: Final commit if any format changes**

```bash
yarn format
git add -A
git status
```

Only commit if there are changes from formatting.

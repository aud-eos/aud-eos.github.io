# TikTok oEmbed Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TikTok video embedding to blog posts using TikTok's oEmbed API with client-side script hydration.

**Architecture:** Build-time oEmbed fetch in `getStaticProps`, static blockquote HTML rendered into the page, TikTok's `embed.js` loaded client-side via `useEffect` to hydrate the player. Follows the existing YouTube/SoundCloud embed pattern.

**Tech Stack:** Next.js (static export), React, TypeScript, Vitest, Contentful CMS, SCSS modules

**Security note:** `dangerouslySetInnerHTML` is used to render oEmbed HTML fetched at build time from TikTok's official oEmbed API — a trusted first-party source. This is the same trust model used by the existing YouTube and SoundCloud embed components. The HTML is never sourced from user input.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/utils/tiktok/getOembed.ts` | Fetch TikTok oEmbed data at build time |
| Create | `src/utils/tiktok/getOembed.test.ts` | Unit tests for oEmbed fetch utility |
| Create | `src/components/TikTokEmbed.tsx` | Render TikTok embed with client-side script loading |
| Create | `src/__tests__/components/TikTokEmbed.test.tsx` | Unit tests for embed component |
| Create | `src/styles/TikTokEmbed.module.scss` | Embed styles |
| Modify | `src/pages/post/[slug].tsx` | Wire up TikTok oEmbed fetch, props, and rendering |
| Modify | `src/__tests__/pages/post/slug.test.tsx` | Add TikTok oEmbed tests for `getStaticProps` |

---

### Task 1: Add `tiktokUrl` field to Contentful and regenerate types

**Files:**
- Modify: Contentful BlogPost content type (via Contentful MCP or web UI)
- Regenerate: `src/types/contentful/TypeBlogPost.ts` (via `make types`)

- [ ] **Step 1: Add the `tiktokUrl` field to the BlogPost content type in Contentful**

Use the Contentful MCP tool `update_content_type` to add a new optional field:
- Field ID: `tiktokUrl`
- Display name: `TikTok URL`
- Type: Symbol (short text)
- Required: false
- Validation: URL pattern matching `https://www.tiktok.com/` or `https://vm.tiktok.com/`

To do this, first fetch the current BlogPost content type with `get_content_type`, then call `update_content_type` with the existing fields plus the new `tiktokUrl` field appended. Do NOT remove or reorder existing fields.

- [ ] **Step 2: Regenerate TypeScript types**

Run: `make types`
Expected: `src/types/contentful/TypeBlogPost.ts` now includes a `tiktokUrl` field:
```typescript
tiktokUrl?: EntryFieldTypes.Symbol;
```

- [ ] **Step 3: Verify the build still passes**

Run: `yarn typecheck`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/contentful/
git commit -m "feat: add tiktokUrl field to BlogPost content type"
```

---

### Task 2: Create TikTok oEmbed fetch utility with tests

**Files:**
- Create: `src/utils/tiktok/getOembed.ts`
- Create: `src/utils/tiktok/getOembed.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/tiktok/getOembed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal( "fetch", mockFetch );

import { getOembed, TikTokOembed } from "./getOembed";

const TIKTOK_VIDEO_URL = "https://www.tiktok.com/@testuser/video/1234567890";

const MOCK_OEMBED_RESPONSE: TikTokOembed = {
  title: "Test TikTok Video",
  author_name: "testuser",
  author_url: "https://www.tiktok.com/@testuser",
  html: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@testuser/video/1234567890"><section>Test content</section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>',
  thumbnail_url: "https://p16-sign.tiktokcdn.com/obj/test-thumbnail.jpg",
};

describe( "getOembed", () => {
  beforeEach( () => {
    vi.resetAllMocks();
  });

  it( "fetches oEmbed data for a valid TikTok URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    const result = await getOembed( TIKTOK_VIDEO_URL );

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://www.tiktok.com/oembed?format=json&url=${encodeURIComponent( TIKTOK_VIDEO_URL )}`,
    );
    expect( result ).toEqual( MOCK_OEMBED_RESPONSE );
  });

  it( "returns null when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getOembed( TIKTOK_VIDEO_URL );

    expect( result ).toBeNull();
  });

  it( "returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce( new Error( "Network error" ) );

    const result = await getOembed( TIKTOK_VIDEO_URL );

    expect( result ).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/tiktok/getOembed.test.ts`
Expected: FAIL — module `./getOembed` not found.

- [ ] **Step 3: Write the implementation**

Create `src/utils/tiktok/getOembed.ts`:

```typescript
export interface TikTokOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://www.tiktok.com/oembed";

export async function getOembed( tiktokUrl: string ): Promise<TikTokOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( tiktokUrl )}`;

  try {
    const response = await fetch( url );

    if( !response.ok ) {
      return null;
    }

    const data: TikTokOembed = await response.json();
    return data;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/utils/tiktok/getOembed.test.ts`
Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/tiktok/
git commit -m "feat: add TikTok oEmbed fetch utility"
```

---

### Task 3: Create TikTokEmbed component with tests

**Files:**
- Create: `src/components/TikTokEmbed.tsx`
- Create: `src/__tests__/components/TikTokEmbed.test.tsx`
- Create: `src/styles/TikTokEmbed.module.scss`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/TikTokEmbed.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import { TikTokEmbed } from "@/components/TikTokEmbed";
import { TikTokOembed } from "@/utils/tiktok/getOembed";

const MOCK_TIKTOK_URL = "https://www.tiktok.com/@testuser/video/1234567890";

const MOCK_OEMBED: TikTokOembed = {
  title: "Test TikTok Video",
  author_name: "testuser",
  author_url: "https://www.tiktok.com/@testuser",
  html: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@testuser/video/1234567890"><section>Test content</section></blockquote>',
  thumbnail_url: "https://p16-sign.tiktokcdn.com/obj/test-thumbnail.jpg",
};

describe( "TikTokEmbed", () => {
  it( "renders the oEmbed HTML content", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    expect( screen.getByText( "Test content" ) ).toBeInTheDocument();
  });

  it( "renders the video title as a link to the TikTok URL that opens in a new tab", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    const titleLink = screen.getByRole( "link", { name: /Test TikTok Video/i });
    expect( titleLink ).toHaveAttribute( "href", MOCK_TIKTOK_URL );
    expect( titleLink ).toHaveAttribute( "target", "_blank" );
    expect( titleLink ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders a TikTok link to the author profile that opens in a new tab", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    const tiktokLink = screen.getByRole( "link", { name: /TikTok/i });
    expect( tiktokLink ).toHaveAttribute( "href", "https://www.tiktok.com/@testuser" );
    expect( tiktokLink ).toHaveAttribute( "target", "_blank" );
  });

  it( "appends the TikTok embed.js script to the container on mount", () => {
    render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    const script = document.querySelector( 'script[src="https://www.tiktok.com/embed.js"]' );
    expect( script ).not.toBeNull();
  });

  it( "removes the script on unmount", () => {
    const { unmount } = render( <TikTokEmbed oembed={ MOCK_OEMBED } url={ MOCK_TIKTOK_URL } /> );

    unmount();

    const script = document.querySelector( 'script[src="https://www.tiktok.com/embed.js"]' );
    expect( script ).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/__tests__/components/TikTokEmbed.test.tsx`
Expected: FAIL — module `@/components/TikTokEmbed` not found.

- [ ] **Step 3: Create the SCSS module**

Create `src/styles/TikTokEmbed.module.scss`:

```scss
section.tiktokEmbed {
  margin-top: 2rem;
  margin-bottom: 4rem;
}

.tiktokHeader {
  margin-bottom: 1rem;
}

.embedContainer {
  display: flex;
  justify-content: center;
}
```

- [ ] **Step 4: Write the component implementation**

Create `src/components/TikTokEmbed.tsx`. Note: `dangerouslySetInnerHTML` is used here to render oEmbed HTML fetched at build time from TikTok's official API — this is a trusted first-party source, not user input. This is the same trust model used by the existing YouTube and SoundCloud embed components.

```tsx
import { FC, useEffect, useRef } from "react";
import Link from "next/link";
import { TikTokOembed } from "@/utils/tiktok/getOembed";
import styles from "@/styles/TikTokEmbed.module.scss";

export interface TikTokEmbedProps {
  oembed: TikTokOembed;
  url: string;
}

const TIKTOK_EMBED_SCRIPT_SRC = "https://www.tiktok.com/embed.js";

export const TikTokEmbed: FC<TikTokEmbedProps> = ({ oembed, url }) => {
  const containerRef = useRef<HTMLDivElement>( null );

  useEffect( () => {
    const container = containerRef.current;
    if( !container ) {
      return;
    }

    const script = document.createElement( "script" );
    script.src = TIKTOK_EMBED_SCRIPT_SRC;
    script.async = true;
    container.appendChild( script );

    return () => {
      script.remove();
    };
  }, [] );

  return (
    <section className={ styles.tiktokEmbed }>
      <header className={ styles.tiktokHeader }>
        <h2>
          Watch &quot;<Link
            href={ url }
            target="_blank"
            rel="noopener noreferrer"
          >{ oembed.title }</Link>&quot; on{ " " }
          <Link
            href={ oembed.author_url }
            target="_blank"
            rel="noopener noreferrer"
          >TikTok</Link>
        </h2>
      </header>
      <div
        ref={ containerRef }
        className={ styles.embedContainer }
        dangerouslySetInnerHTML={ { __html: oembed.html } }
      />
    </section>
  );
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/__tests__/components/TikTokEmbed.test.tsx`
Expected: 5 tests PASS.

- [ ] **Step 6: Run lint and format**

Run: `yarn format`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/TikTokEmbed.tsx src/__tests__/components/TikTokEmbed.test.tsx src/styles/TikTokEmbed.module.scss
git commit -m "feat: add TikTokEmbed component with client-side script hydration"
```

---

### Task 4: Integrate TikTok embed into the post page

**Files:**
- Modify: `src/pages/post/[slug].tsx:1-22` (imports), `src/pages/post/[slug].tsx:34-41` (props), `src/pages/post/[slug].tsx:143-146` (render), `src/pages/post/[slug].tsx:186-194` (getStaticProps), `src/pages/post/[slug].tsx:215-224` (return props)
- Modify: `src/__tests__/pages/post/slug.test.tsx` (add TikTok test block)

- [ ] **Step 1: Write the failing tests for getStaticProps TikTok integration**

Add to `src/__tests__/pages/post/slug.test.tsx`. First, add the TikTok mock at the top alongside the other mocks:

After the existing `vi.mock( "@/utils/youtube/getOembed", ... )` line, add:
```typescript
vi.mock( "@/utils/tiktok/getOembed", () => ({
  getOembed: vi.fn(),
}) );
```

After the existing `vi.mock( "@/components/YouTubeEmbed", ... )` line, add:
```typescript
vi.mock( "@/components/TikTokEmbed", () => ({ TikTokEmbed: () => null }) );
```

Add a new import after the existing YouTube import:
```typescript
import { getOembed as getTikTokOembed } from "@/utils/tiktok/getOembed";
```

In every existing `beforeEach` block that mocks `getYouTubeOembed`, add:
```typescript
vi.mocked( getTikTokOembed ).mockResolvedValue( null );
```

Then add a new describe block at the end of the file:

```typescript
describe( "getStaticProps — TikTok oEmbed", () => {
  const postWithTiktok = makePost({ slug: "tt-post" });
  Object.assign( postWithTiktok.fields, {
    tiktokUrl: "https://www.tiktok.com/@testuser/video/1234567890",
  });

  const postWithoutTiktok = makePost({ slug: "no-tt-post" });

  beforeEach( () => {
    vi.resetAllMocks();
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: [ postWithTiktok, postWithoutTiktok ] } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
    vi.mocked( getTikTokOembed ).mockResolvedValue( null );
  });

  it( "fetches oEmbed data when tiktokUrl is present", async () => {
    const mockOembed = { title: "TikTok Video", author_name: "testuser", author_url: "https://www.tiktok.com/@testuser", html: "<blockquote>content</blockquote>", thumbnail_url: "" };
    vi.mocked( getBlogPost ).mockResolvedValue( postWithTiktok as never );
    vi.mocked( getTikTokOembed ).mockResolvedValue( mockOembed );

    const result = await getStaticProps({ params: { slug: "tt-post" } } as never );

    expect( getTikTokOembed ).toHaveBeenCalledWith( "https://www.tiktok.com/@testuser/video/1234567890" );
    expect( result ).toMatchObject({
      props: { tikTokOembed: mockOembed },
    });
  });

  it( "passes null when tiktokUrl is absent", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithoutTiktok as never );

    const result = await getStaticProps({ params: { slug: "no-tt-post" } } as never );

    expect( getTikTokOembed ).not.toHaveBeenCalled();
    expect( result ).toMatchObject({
      props: { tikTokOembed: null },
    });
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: FAIL — `tikTokOembed` not found in props, `getTikTokOembed` never called.

- [ ] **Step 3: Update `src/pages/post/[slug].tsx` imports**

Add after the existing YouTube import lines:
```typescript
import { getOembed as getTikTokOembed, TikTokOembed } from "@/utils/tiktok/getOembed";
import { TikTokEmbed } from "@/components/TikTokEmbed";
```

- [ ] **Step 4: Update `BlogPostViewProps` interface**

Add `tikTokOembed` to the interface:
```typescript
export interface BlogPostViewProps {
  post: BlogPost
  playlist?: SpotifyPlaylist|null
  soundCloudOembed?: SoundCloudOembed|null
  youTubeOembed?: YouTubeOembed|null
  tikTokOembed?: TikTokOembed|null
  prevPost?: PostNavLink|null
  nextPost?: PostNavLink|null
}
```

- [ ] **Step 5: Update `BlogPostView` component signature and rendering**

Add `tikTokOembed` to the destructured props:
```typescript
export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, soundCloudOembed, youTubeOembed, tikTokOembed, prevPost, nextPost }) => {
```

Add the TikTok embed render **before** the `<Markdown>` component (after `</header>`):
```tsx
          </header>
          { tikTokOembed && post.fields.tiktokUrl && <TikTokEmbed oembed={ tikTokOembed } url={ post.fields.tiktokUrl } /> }
          <Markdown>{ post.fields.body || "" }</Markdown>
```

- [ ] **Step 6: Update `getStaticProps` to fetch TikTok oEmbed**

Add after the YouTube oEmbed fetch:
```typescript
  const tikTokOembed = post.fields.tiktokUrl
    ? await getTikTokOembed( post.fields.tiktokUrl ) : null;
```

Add `tikTokOembed` to the returned props object:
```typescript
  return {
    props: {
      post,
      playlist,
      soundCloudOembed,
      youTubeOembed,
      tikTokOembed,
      prevPost,
      nextPost,
    },
  };
```

- [ ] **Step 7: Run all tests to verify everything passes**

Run: `yarn test`
Expected: All tests PASS, including the new TikTok tests.

- [ ] **Step 8: Run lint, format, and typecheck**

Run: `yarn format && yarn typecheck`
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add src/pages/post/[slug].tsx src/__tests__/pages/post/slug.test.tsx
git commit -m "feat: integrate TikTok oEmbed into blog post page"
```

---

### Task 5: Verify with a real TikTok URL

**Files:** None (manual verification)

- [ ] **Step 1: Test oEmbed API with a real TikTok URL**

Run a quick curl to confirm the API returns expected data:
```bash
curl -s "https://www.tiktok.com/oembed?format=json&url=https://www.tiktok.com/@tiktok/video/7484771928498908459" | python3 -m json.tool
```

Expected: JSON response with `title`, `author_name`, `author_url`, `html` (containing a `<blockquote>`), and `thumbnail_url`.

- [ ] **Step 2: Run the full build**

Run: `yarn build`
Expected: Build completes successfully. No posts currently have a `tiktokUrl`, so the TikTok embed code path is exercised but produces `null` — no errors.

- [ ] **Step 3: Start the dev server and verify no regressions**

Run: `yarn dev`
Navigate to an existing post in the browser. Verify:
- Post renders correctly
- Existing YouTube/SoundCloud embeds (if present on any post) still work
- No console errors

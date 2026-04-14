# YouTube Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional YouTube video embedding to blog posts using YouTube's oEmbed API.

**Architecture:** A new `youtubeUrl` Contentful field triggers a build-time oEmbed fetch in `getStaticProps`. The oEmbed response is passed to a `<YouTubeEmbed>` component that renders a sanitized iframe. Follows the identical pattern established by the SoundCloud embed feature.

**Tech Stack:** Next.js, Contentful, YouTube oEmbed API, Vitest, React Testing Library

---

### Task 1: YouTube oEmbed Utility

**Files:**
- Create: `src/utils/youtube/getOembed.ts`
- Create: `src/utils/youtube/getOembed.test.ts`

- [ ] **Step 1: Write the failing test for successful oEmbed fetch**

Create `src/utils/youtube/getOembed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal( "fetch", mockFetch );

import { getOembed, YouTubeOembed } from "./getOembed";

const YOUTUBE_VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const MOCK_OEMBED_RESPONSE: YouTubeOembed = {
  title: "Test Video",
  author_name: "Test Channel",
  author_url: "https://www.youtube.com/@testchannel",
  html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="Test Video"></iframe>',
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
};

describe( "getOembed", () => {
  beforeEach( () => {
    vi.resetAllMocks();
  });

  it( "fetches oEmbed data for a valid YouTube URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    const result = await getOembed( YOUTUBE_VIDEO_URL );

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent( YOUTUBE_VIDEO_URL )}`,
    );
    expect( result ).toEqual( MOCK_OEMBED_RESPONSE );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/utils/youtube/getOembed.test.ts`
Expected: FAIL — module `./getOembed` does not exist

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/youtube/getOembed.ts`:

```typescript
export interface YouTubeOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://www.youtube.com/oembed";

export async function getOembed( youtubeUrl: string ): Promise<YouTubeOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( youtubeUrl )}`;

  try {
    const response = await fetch( url );

    if( !response.ok ) {
      return null;
    }

    const data: YouTubeOembed = await response.json();
    return data;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/utils/youtube/getOembed.test.ts`
Expected: PASS

- [ ] **Step 5: Add failure and network error tests**

Add to the existing `describe` block in `src/utils/youtube/getOembed.test.ts`:

```typescript
  it( "returns null when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getOembed( YOUTUBE_VIDEO_URL );

    expect( result ).toBeNull();
  });

  it( "returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce( new Error( "Network error" ) );

    const result = await getOembed( YOUTUBE_VIDEO_URL );

    expect( result ).toBeNull();
  });
```

- [ ] **Step 6: Run all tests to verify they pass**

Run: `yarn test src/utils/youtube/getOembed.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 7: Run format and full test suite**

Run: `yarn format && yarn test`
Expected: All pass

- [ ] **Step 8: Commit**

```bash
git add src/utils/youtube/getOembed.ts src/utils/youtube/getOembed.test.ts
git commit -m "feat: add YouTube oEmbed fetch utility"
```

---

### Task 2: YouTubeEmbed Component

**Files:**
- Create: `src/components/YouTubeEmbed.tsx`
- Create: `src/styles/YouTubeEmbed.module.scss`
- Create: `src/__tests__/components/YouTubeEmbed.test.tsx`

- [ ] **Step 1: Write the failing test for the component**

Create `src/__tests__/components/YouTubeEmbed.test.tsx`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { YouTubeOembed } from "@/utils/youtube/getOembed";

const MOCK_YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

const MOCK_OEMBED: YouTubeOembed = {
  title: "Test Video",
  author_name: "Test Channel",
  author_url: "https://www.youtube.com/@testchannel",
  html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="Test Video"></iframe>',
  thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
};

describe( "YouTubeEmbed", () => {
  it( "renders an iframe with the src extracted from oEmbed html", () => {
    render( <YouTubeEmbed oembed={ MOCK_OEMBED } url={ MOCK_YOUTUBE_URL } /> );

    const iframe = screen.getByTitle( "Test Video" );
    expect( iframe ).toBeInTheDocument();
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?feature=oembed",
    );
  });

  it( "renders the video title as a link to the YouTube URL that opens in a new tab", () => {
    render( <YouTubeEmbed oembed={ MOCK_OEMBED } url={ MOCK_YOUTUBE_URL } /> );

    const titleLink = screen.getByRole( "link", { name: /Test Video/i });
    expect( titleLink ).toHaveAttribute( "href", MOCK_YOUTUBE_URL );
    expect( titleLink ).toHaveAttribute( "target", "_blank" );
    expect( titleLink ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders a YouTube link to the channel that opens in a new tab", () => {
    render( <YouTubeEmbed oembed={ MOCK_OEMBED } url={ MOCK_YOUTUBE_URL } /> );

    const youtubeLink = screen.getByRole( "link", { name: /YouTube/i });
    expect( youtubeLink ).toHaveAttribute( "href", "https://www.youtube.com/@testchannel" );
    expect( youtubeLink ).toHaveAttribute( "target", "_blank" );
  });

  it( "does not render an iframe when the src is not from www.youtube.com", () => {
    const maliciousOembed: YouTubeOembed = {
      ...MOCK_OEMBED,
      html: '<iframe src="https://evil.com/exploit"></iframe>',
    };

    render( <YouTubeEmbed oembed={ maliciousOembed } url={ MOCK_YOUTUBE_URL } /> );

    expect( document.querySelector( "iframe" ) ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/__tests__/components/YouTubeEmbed.test.tsx`
Expected: FAIL — module `@/components/YouTubeEmbed` does not exist

- [ ] **Step 3: Write the component**

Create `src/components/YouTubeEmbed.tsx`:

```typescript
import { FC } from "react";
import Link from "next/link";
import { YouTubeOembed } from "@/utils/youtube/getOembed";
import styles from "@/styles/YouTubeEmbed.module.scss";

export interface YouTubeEmbedProps {
  oembed: YouTubeOembed;
  url: string;
}

const ALLOWED_IFRAME_HOST = "www.youtube.com";

function extractIframeSrc( html: string ): string | null {
  const srcMatch = html.match( /src="([^"]+)"/ );
  if( !srcMatch?.[1] ) {
    return null;
  }

  try {
    const parsedUrl = new URL( srcMatch[1] );
    if( parsedUrl.host !== ALLOWED_IFRAME_HOST ) {
      return null;
    }
    return srcMatch[1];
  } catch {
    return null;
  }
}

export const YouTubeEmbed: FC<YouTubeEmbedProps> = ({ oembed, url }) => {
  const iframeSrc = extractIframeSrc( oembed.html );

  if( !iframeSrc ) {
    return null;
  }

  return (
    <section className={ styles.youtubeEmbed }>
      <header className={ styles.youtubeHeader }>
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
          >YouTube</Link>
        </h2>
      </header>
      <div className={ styles.iframeWrapper }>
        <iframe
          title={ oembed.title }
          src={ iframeSrc }
          width="100%"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </section>
  );
};
```

- [ ] **Step 4: Create the stylesheet**

Create `src/styles/YouTubeEmbed.module.scss`:

```scss
section.youtubeEmbed {
  margin-top: 2rem;
  margin-bottom: 2rem;
}

.youtubeHeader {
  margin-bottom: 1rem;
}

.iframeWrapper {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;

  > iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/__tests__/components/YouTubeEmbed.test.tsx`
Expected: All 4 tests PASS

- [ ] **Step 6: Run format and full test suite**

Run: `yarn format && yarn test`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/components/YouTubeEmbed.tsx src/styles/YouTubeEmbed.module.scss src/__tests__/components/YouTubeEmbed.test.tsx
git commit -m "feat: add YouTubeEmbed component"
```

---

### Task 3: Integrate into Blog Post Page

**Files:**
- Modify: `src/pages/post/[slug].tsx:1-228`
- Modify: `src/__tests__/pages/post/slug.test.tsx:1-221`

- [ ] **Step 1: Write the failing tests for YouTube oEmbed fetch in getStaticProps**

In `src/__tests__/pages/post/slug.test.tsx`:

Add the mock at the top alongside existing mocks (after the SoundCloud mocks around line 12-14):

```typescript
vi.mock( "@/utils/youtube/getOembed", () => ({
  getOembed: vi.fn(),
}) );
```

Add the YouTubeEmbed component mock alongside the SoundCloudEmbed mock (after line 15):

```typescript
vi.mock( "@/components/YouTubeEmbed", () => ({ YouTubeEmbed: () => null }) );
```

Add the import alongside existing imports (after the SoundCloud getOembed import around line 40). Use an alias to avoid collision with the SoundCloud `getOembed` import:

```typescript
import { getOembed as getYouTubeOembed } from "@/utils/youtube/getOembed";
```

Update the `beforeEach` in the `"getStaticProps — post navigation"` describe block (around line 119) to also mock the YouTube getOembed:

```typescript
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
```

Update the `beforeEach` in the `"getStaticProps — SoundCloud oEmbed"` describe block (around line 191) to also mock the YouTube getOembed:

```typescript
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
```

Add a new describe block at the END of the file:

```typescript
describe( "getStaticProps — YouTube oEmbed", () => {
  const postWithYoutube = makePost({ slug: "yt-post" });
  Object.assign( postWithYoutube.fields, {
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  });

  const postWithoutYoutube = makePost({ slug: "no-yt-post" });

  beforeEach( () => {
    vi.resetAllMocks();
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: [ postWithYoutube, postWithoutYoutube ] } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
  });

  it( "fetches oEmbed data when youtubeUrl is present", async () => {
    const mockOembed = { title: "Video", author_name: "Channel", author_url: "https://www.youtube.com/@channel", html: "<iframe></iframe>", thumbnail_url: "" };
    vi.mocked( getBlogPost ).mockResolvedValue( postWithYoutube as never );
    vi.mocked( getYouTubeOembed ).mockResolvedValue( mockOembed );

    const result = await getStaticProps({ params: { slug: "yt-post" } } as never );

    expect( getYouTubeOembed ).toHaveBeenCalledWith( "https://www.youtube.com/watch?v=dQw4w9WgXcQ" );
    expect( result ).toMatchObject({
      props: { youTubeOembed: mockOembed },
    });
  });

  it( "passes null when youtubeUrl is absent", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithoutYoutube as never );

    const result = await getStaticProps({ params: { slug: "no-yt-post" } } as never );

    expect( getYouTubeOembed ).not.toHaveBeenCalled();
    expect( result ).toMatchObject({
      props: { youTubeOembed: null },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: FAIL — `youTubeOembed` not in props

- [ ] **Step 3: Update [slug].tsx to fetch YouTube oEmbed and render the component**

In `src/pages/post/[slug].tsx`:

Add imports at the top (after the SoundCloudEmbed import on line 19):

```typescript
import { getOembed as getYouTubeOembed, YouTubeOembed } from "@/utils/youtube/getOembed";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
```

Update `BlogPostViewProps` to add (after `soundCloudOembed` on line 32):

```typescript
  youTubeOembed?: YouTubeOembed|null
```

Update the `BlogPostView` component destructuring (line 38) to include `youTubeOembed`:

```typescript
export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, soundCloudOembed, youTubeOembed, prevPost, nextPost }) => {
```

In `getStaticProps`, after the SoundCloud oEmbed fetch (after line 188), add:

```typescript
  const youTubeOembed = post.fields.youtubeUrl
    ? await getYouTubeOembed( post.fields.youtubeUrl ) : null;
```

Add `youTubeOembed` to the returned props (after `soundCloudOembed` on line 213):

```typescript
      youTubeOembed,
```

In the JSX, after the SoundCloud embed line (after line 140), add:

```typescript
              { youTubeOembed && post.fields.youtubeUrl && <YouTubeEmbed oembed={ youTubeOembed } url={ post.fields.youtubeUrl } /> }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Run format and full test suite**

Run: `yarn format && yarn test`
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add src/pages/post/[slug].tsx src/__tests__/pages/post/slug.test.tsx
git commit -m "feat: integrate YouTube oEmbed into blog post page"
```

---

### Task 4: Update Contentful Types

**Prerequisite:** The `youtubeUrl` field must be added to the `blogPost` content type in the Contentful UI before this step.

**Files:**
- Modify: `src/types/contentful/TypeBlogPost.ts` (regenerated)

- [ ] **Step 1: Add the field in Contentful**

In the Contentful web UI:
1. Go to Content Model → Blog Post
2. Add a new field: **Short text** (Symbol), field ID `youtubeUrl`, name "YouTube URL"
3. Set it as optional
4. Save the content type

- [ ] **Step 2: Regenerate types**

Run: `make types`

The `TypeBlogPostFields` interface will now include:

```typescript
youtubeUrl?: EntryFieldTypes.Symbol;
```

- [ ] **Step 3: Clean up the workaround in [slug].tsx**

If Task 3 used a `rawFields` workaround for `post.fields.youtubeUrl`, replace it with direct typed access:

```typescript
  const youTubeOembed = post.fields.youtubeUrl
    ? await getYouTubeOembed( post.fields.youtubeUrl ) : null;
```

- [ ] **Step 4: Verify the types compile**

Run: `yarn typecheck`
Expected: No errors.

- [ ] **Step 5: Run full test suite**

Run: `yarn test`
Expected: All pass

- [ ] **Step 6: Commit the regenerated types**

```bash
git add src/types/contentful/ src/pages/post/[slug].tsx
git commit -m "feat: regenerate Contentful types with youtubeUrl field"
```

---

### Task 5: Update New-Post Skill

**Files:**
- Modify: `.claude/skills/new-post/SKILL.md`

- [ ] **Step 1: Add youtubeUrl to the field assembly table**

In `.claude/skills/new-post/SKILL.md`, add a new row to the Field Assembly table after the `soundcloudUrl` row:

```markdown
| **youtubeUrl** | Ask if they want to embed a YouTube video (yes/no). If yes, collect the full YouTube URL. Skip if no. |
```

- [ ] **Step 2: Add youtubeUrl to the Entry Creation JSON**

In the Entry Creation section, add `youtubeUrl` to the fields object (after `soundcloudUrl`):

```json
"youtubeUrl": { "en-US": "<youtubeUrl>" }
```

- [ ] **Step 3: Update the "omit optional fields" line**

Change:
```markdown
Omit optional fields that were not provided (gallery, spotifyPlaylistId, soundcloudUrl, location).
```

To:
```markdown
Omit optional fields that were not provided (gallery, spotifyPlaylistId, soundcloudUrl, youtubeUrl, location).
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/new-post/SKILL.md
git commit -m "feat: add youtubeUrl to new-post skill"
```

# SoundCloud Embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional SoundCloud track/playlist embedding to blog posts using SoundCloud's oEmbed API.

**Architecture:** A new `soundcloudUrl` Contentful field triggers a build-time oEmbed fetch in `getStaticProps`. The oEmbed response is passed to a `<SoundCloudEmbed>` component that renders a sanitized iframe. The new-post skill is updated to collect the URL.

**Tech Stack:** Next.js, Contentful, SoundCloud oEmbed API, Vitest, React Testing Library

---

### Task 1: SoundCloud oEmbed Utility

**Files:**
- Create: `src/utils/soundcloud/getOembed.ts`
- Create: `src/utils/soundcloud/getOembed.test.ts`

- [ ] **Step 1: Write the failing test for successful oEmbed fetch**

Create `src/utils/soundcloud/getOembed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal( "fetch", mockFetch );

import { getOembed, SoundCloudOembed } from "./getOembed";

const SOUNDCLOUD_TRACK_URL = "https://soundcloud.com/artist/track-name";

const MOCK_OEMBED_RESPONSE: SoundCloudOembed = {
  title: "Test Track",
  author_name: "Test Artist",
  author_url: "https://soundcloud.com/artist",
  html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123"></iframe>',
  thumbnail_url: "https://i1.sndcdn.com/artworks-000-t500x500.jpg",
};

describe( "getOembed", () => {
  beforeEach( () => {
    vi.resetAllMocks();
  });

  it( "fetches oEmbed data for a valid SoundCloud URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve( MOCK_OEMBED_RESPONSE ),
    });

    const result = await getOembed( SOUNDCLOUD_TRACK_URL );

    expect( mockFetch ).toHaveBeenCalledWith(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent( SOUNDCLOUD_TRACK_URL )}`,
    );
    expect( result ).toEqual( MOCK_OEMBED_RESPONSE );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/utils/soundcloud/getOembed.test.ts`
Expected: FAIL — module `./getOembed` does not exist

- [ ] **Step 3: Write minimal implementation**

Create `src/utils/soundcloud/getOembed.ts`:

```typescript
export interface SoundCloudOembed {
  title: string;
  author_name: string;
  author_url: string;
  html: string;
  thumbnail_url: string;
}

const OEMBED_ENDPOINT = "https://soundcloud.com/oembed";

export async function getOembed( soundcloudUrl: string ): Promise<SoundCloudOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( soundcloudUrl )}`;
  const response = await fetch( url );

  if ( !response.ok ) {
    return null;
  }

  const data: SoundCloudOembed = await response.json();
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/utils/soundcloud/getOembed.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for fetch failure**

Add to the existing `describe` block in `src/utils/soundcloud/getOembed.test.ts`:

```typescript
  it( "returns null when the fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await getOembed( SOUNDCLOUD_TRACK_URL );

    expect( result ).toBeNull();
  });

  it( "returns null when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce( new Error( "Network error" ) );

    const result = await getOembed( SOUNDCLOUD_TRACK_URL );

    expect( result ).toBeNull();
  });
```

- [ ] **Step 6: Run tests to check which fail**

Run: `yarn test src/utils/soundcloud/getOembed.test.ts`
Expected: The "returns null when fetch fails" test should PASS (already handled by `!response.ok`). The "network error" test should FAIL — unhandled rejection.

- [ ] **Step 7: Add try/catch for network errors**

Update `getOembed` in `src/utils/soundcloud/getOembed.ts` to wrap the fetch in a try/catch:

```typescript
export async function getOembed( soundcloudUrl: string ): Promise<SoundCloudOembed | null> {
  const url = `${OEMBED_ENDPOINT}?format=json&url=${encodeURIComponent( soundcloudUrl )}`;

  try {
    const response = await fetch( url );

    if ( !response.ok ) {
      return null;
    }

    const data: SoundCloudOembed = await response.json();
    return data;
  } catch {
    return null;
  }
}
```

- [ ] **Step 8: Run all tests to verify they pass**

Run: `yarn test src/utils/soundcloud/getOembed.test.ts`
Expected: All 3 tests PASS

- [ ] **Step 9: Run format and full test suite**

Run: `yarn format && yarn test`
Expected: All pass

- [ ] **Step 10: Commit**

```bash
git add src/utils/soundcloud/getOembed.ts src/utils/soundcloud/getOembed.test.ts
git commit -m "feat: add SoundCloud oEmbed fetch utility"
```

---

### Task 2: SoundCloudEmbed Component

**Files:**
- Create: `src/components/SoundCloudEmbed.tsx`
- Create: `src/styles/SoundCloudEmbed.module.scss`
- Create: `src/__tests__/components/SoundCloudEmbed.test.tsx`

- [ ] **Step 1: Write the failing test for the component**

Create `src/__tests__/components/SoundCloudEmbed.test.tsx`:

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SoundCloudEmbed } from "@/components/SoundCloudEmbed";
import { SoundCloudOembed } from "@/utils/soundcloud/getOembed";

const MOCK_OEMBED: SoundCloudOembed = {
  title: "Test Track",
  author_name: "Test Artist",
  author_url: "https://soundcloud.com/test-artist",
  html: '<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123"></iframe>',
  thumbnail_url: "https://i1.sndcdn.com/artworks-000-t500x500.jpg",
};

describe( "SoundCloudEmbed", () => {
  it( "renders an iframe with the src extracted from oEmbed html", () => {
    render( <SoundCloudEmbed oembed={ MOCK_OEMBED } /> );

    const iframe = screen.getByTitle( "Test Track by Test Artist" );
    expect( iframe ).toBeInTheDocument();
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/123",
    );
  });

  it( "renders the track title and author as a heading link", () => {
    render( <SoundCloudEmbed oembed={ MOCK_OEMBED } /> );

    const link = screen.getByRole( "link", { name: /Test Artist/i } );
    expect( link ).toHaveAttribute( "href", "https://soundcloud.com/test-artist" );
  });

  it( "does not render an iframe when the src is not from w.soundcloud.com", () => {
    const maliciousOembed: SoundCloudOembed = {
      ...MOCK_OEMBED,
      html: '<iframe src="https://evil.com/exploit"></iframe>',
    };

    render( <SoundCloudEmbed oembed={ maliciousOembed } /> );

    expect( screen.queryByTagName?.( "iframe" ) ?? document.querySelector( "iframe" ) ).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/__tests__/components/SoundCloudEmbed.test.tsx`
Expected: FAIL — module `@/components/SoundCloudEmbed` does not exist

- [ ] **Step 3: Write the component**

Create `src/components/SoundCloudEmbed.tsx`:

```typescript
import { FC } from "react";
import Link from "next/link";
import { SoundCloudOembed } from "@/utils/soundcloud/getOembed";
import styles from "@/styles/SoundCloudEmbed.module.scss";

export interface SoundCloudEmbedProps {
  oembed: SoundCloudOembed;
}

const ALLOWED_IFRAME_HOST = "w.soundcloud.com";

function extractIframeSrc( html: string ): string | null {
  const srcMatch = html.match( /src="([^"]+)"/ );
  if ( !srcMatch?.[1] ) {
    return null;
  }

  try {
    const url = new URL( srcMatch[1] );
    if ( url.host !== ALLOWED_IFRAME_HOST ) {
      return null;
    }
    return srcMatch[1];
  } catch {
    return null;
  }
}

export const SoundCloudEmbed: FC<SoundCloudEmbedProps> = ({ oembed }) => {
  const iframeSrc = extractIframeSrc( oembed.html );

  if ( !iframeSrc ) {
    return null;
  }

  return (
    <section className={ styles.soundcloudEmbed }>
      <header className={ styles.soundcloudHeader }>
        <h2>
          Listen to &quot;{ oembed.title }&quot; by{" "}
          <Link href={ oembed.author_url }>{ oembed.author_name }</Link>
        </h2>
      </header>
      <iframe
        title={ `${oembed.title} by ${oembed.author_name}` }
        src={ iframeSrc }
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
      />
    </section>
  );
};
```

- [ ] **Step 4: Create the stylesheet**

Create `src/styles/SoundCloudEmbed.module.scss`:

```scss
section.soundcloudEmbed {
  margin-top: 2rem;
  margin-bottom: 2rem;

  > iframe {
    border: none;
    border-radius: 4px;
  }
}

.soundcloudHeader {
  margin-bottom: 1rem;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/__tests__/components/SoundCloudEmbed.test.tsx`
Expected: All 3 tests PASS

- [ ] **Step 6: Run format and full test suite**

Run: `yarn format && yarn test`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add src/components/SoundCloudEmbed.tsx src/styles/SoundCloudEmbed.module.scss src/__tests__/components/SoundCloudEmbed.test.tsx
git commit -m "feat: add SoundCloudEmbed component"
```

---

### Task 3: Integrate into Blog Post Page

**Files:**
- Modify: `src/pages/post/[slug].tsx:1-229`
- Modify: `src/__tests__/pages/post/slug.test.tsx`

- [ ] **Step 1: Write the failing test for SoundCloud oEmbed fetch in getStaticProps**

Add to `src/__tests__/pages/post/slug.test.tsx`. First, add the mock at the top of the file alongside the existing mocks:

```typescript
vi.mock( "@/utils/soundcloud/getOembed", () => ({
  getOembed: vi.fn(),
}) );
```

Add the import alongside the existing imports:

```typescript
import { getOembed } from "@/utils/soundcloud/getOembed";
```

Update the `beforeEach` in the `"getStaticProps — post navigation"` describe block to also mock `getOembed`:

```typescript
  beforeEach( () => {
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: orderedPosts } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
  });
```

Add a new describe block at the end of the file:

```typescript
describe( "getStaticProps — SoundCloud oEmbed", () => {
  const postWithSoundcloud = makePost({ slug: "sc-post" });
  Object.assign( postWithSoundcloud.fields, {
    soundcloudUrl: "https://soundcloud.com/artist/track",
  });

  const postWithoutSoundcloud = makePost({ slug: "no-sc-post" });

  beforeEach( () => {
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: [ postWithSoundcloud, postWithoutSoundcloud ] } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
  });

  it( "fetches oEmbed data when soundcloudUrl is present", async () => {
    const mockOembed = { title: "Track", author_name: "Artist", author_url: "https://soundcloud.com/artist", html: "<iframe></iframe>", thumbnail_url: "" };
    vi.mocked( getBlogPost ).mockResolvedValue( postWithSoundcloud as never );
    vi.mocked( getOembed ).mockResolvedValue( mockOembed );

    const result = await getStaticProps({ params: { slug: "sc-post" } } as never );

    expect( getOembed ).toHaveBeenCalledWith( "https://soundcloud.com/artist/track" );
    expect( result ).toMatchObject({
      props: { soundCloudOembed: mockOembed },
    });
  });

  it( "passes null when soundcloudUrl is absent", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithoutSoundcloud as never );

    const result = await getStaticProps({ params: { slug: "no-sc-post" } } as never );

    expect( getOembed ).not.toHaveBeenCalled();
    expect( result ).toMatchObject({
      props: { soundCloudOembed: null },
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: FAIL — `soundCloudOembed` not in props

- [ ] **Step 3: Update getStaticProps to fetch SoundCloud oEmbed**

In `src/pages/post/[slug].tsx`, add the import at the top:

```typescript
import { getOembed, SoundCloudOembed } from "@/utils/soundcloud/getOembed";
```

In `getStaticProps`, after the Spotify playlist fetch (line 181), add:

```typescript
  const soundCloudOembed = post.fields.soundcloudUrl
    ? await getOembed( post.fields.soundcloudUrl ) : null;
```

Add `soundCloudOembed` to the returned props object:

```typescript
  return {
    props: {
      post,
      playlist,
      soundCloudOembed,
      prevPost,
      nextPost,
    },
  };
```

Update `BlogPostViewProps` to include:

```typescript
  soundCloudOembed?: SoundCloudOembed | null
```

Update the `BlogPostView` component signature to destructure `soundCloudOembed`:

```typescript
export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, soundCloudOembed, prevPost, nextPost }) => {
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: All tests PASS (including the new SoundCloud describe block)

- [ ] **Step 5: Add SoundCloudEmbed to the view**

In `src/pages/post/[slug].tsx`, add the import:

```typescript
import { SoundCloudEmbed } from "@/components/SoundCloudEmbed";
```

In the JSX, add the embed after the Spotify playlist (after line 140):

```tsx
            { soundCloudOembed && <SoundCloudEmbed oembed={ soundCloudOembed } /> }
```

- [ ] **Step 6: Add the SoundCloudEmbed mock in slug.test.tsx**

Add alongside the existing component mocks at the top of `src/__tests__/pages/post/slug.test.tsx`:

```typescript
vi.mock( "@/components/SoundCloudEmbed", () => ({ SoundCloudEmbed: () => null }) );
```

- [ ] **Step 7: Run format and full test suite**

Run: `yarn format && yarn test`
Expected: All pass

- [ ] **Step 8: Commit**

```bash
git add src/pages/post/[slug].tsx src/__tests__/pages/post/slug.test.tsx
git commit -m "feat: integrate SoundCloud oEmbed into blog post page"
```

---

### Task 4: Update Contentful Types

**Prerequisite:** The `soundcloudUrl` field must be added to the `blogPost` content type in the Contentful UI before this step.

**Files:**
- Modify: `src/types/contentful/TypeBlogPost.ts` (regenerated)

- [ ] **Step 1: Add the field in Contentful**

In the Contentful web UI:
1. Go to Content Model → Blog Post
2. Add a new field: **Short text** (Symbol), field ID `soundcloudUrl`, name "SoundCloud URL"
3. Set it as optional
4. Save the content type

- [ ] **Step 2: Regenerate types**

Run: `make types`

This will export the space and regenerate `src/types/contentful/`. The `TypeBlogPostFields` interface will now include:

```typescript
soundcloudUrl?: EntryFieldTypes.Symbol;
```

- [ ] **Step 3: Verify the types compile**

Run: `yarn typecheck`
Expected: No errors. The `post.fields.soundcloudUrl` access in `[slug].tsx` should now be recognized.

- [ ] **Step 4: Run full test suite**

Run: `yarn test`
Expected: All pass

- [ ] **Step 5: Commit the regenerated types**

```bash
git add src/types/contentful/
git commit -m "feat: regenerate Contentful types with soundcloudUrl field"
```

**Note:** Until this task is completed, TypeScript may show errors on `post.fields.soundcloudUrl`. The code from Tasks 1-3 is still correct — the type just needs to catch up to the Contentful model change.

---

### Task 5: Update New-Post Skill

**Files:**
- Modify: `.claude/skills/new-post/SKILL.md`

- [ ] **Step 1: Add soundcloudUrl to the field assembly table**

In `.claude/skills/new-post/SKILL.md`, add a new row to the Field Assembly table (after the `spotifyPlaylistId` row):

```markdown
| **soundcloudUrl** | Ask if they want to embed a SoundCloud track or playlist (yes/no). If yes, collect the full SoundCloud URL. Skip if no. |
```

- [ ] **Step 2: Add soundcloudUrl to the Entry Creation JSON**

In the Entry Creation section, add `soundcloudUrl` to the fields object:

```json
"soundcloudUrl": { "en-US": "<soundcloudUrl>" }
```

Add a note to the "Omit optional fields" line: update it to include `soundcloudUrl`:

```markdown
Omit optional fields that were not provided (gallery, spotifyPlaylistId, soundcloudUrl, location). Tags go in `metadata`, not `fields`.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/new-post/SKILL.md
git commit -m "feat: add soundcloudUrl to new-post skill"
```

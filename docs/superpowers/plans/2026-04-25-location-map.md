# Google Maps Embed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render an embedded Google Map on blog posts with a location field using the free iframe embed.

**Architecture:** Pass lat/lon from Contentful through `getStaticProps` as props. The component constructs the embed URL and renders a responsive iframe. No API key or env vars needed.

**Tech Stack:** Next.js (static export), React, TypeScript, Vitest, SCSS modules

**Closes:** #12

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/LocationMap.tsx` | Map embed component |
| Create | `src/__tests__/components/LocationMap.test.tsx` | Unit tests for map component |
| Create | `src/styles/LocationMap.module.scss` | Map styles |
| Modify | `src/pages/post/[slug].tsx` | Pass location props and render LocationMap |
| Modify | `src/__tests__/pages/post/slug.test.tsx` | Add location tests for `getStaticProps` |

---

### Task 1: Create LocationMap component with tests

**Files:**
- Create: `src/components/LocationMap.tsx`
- Create: `src/__tests__/components/LocationMap.test.tsx`
- Create: `src/styles/LocationMap.module.scss`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/components/LocationMap.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { LocationMap } from "@/components/LocationMap";

const MOCK_LAT = 47.6062;
const MOCK_LON = -122.3321;

describe( "LocationMap", () => {
  it( "renders a Location heading", () => {
    render( <LocationMap lat={ MOCK_LAT } lon={ MOCK_LON } /> );

    expect( screen.getByRole( "heading", { name: "Location" } ) ).toBeInTheDocument();
  });

  it( "renders an iframe with the correct Google Maps embed URL", () => {
    render( <LocationMap lat={ MOCK_LAT } lon={ MOCK_LON } /> );

    const iframe = screen.getByTitle( "Location map" );
    expect( iframe.tagName ).toBe( "IFRAME" );
    expect( iframe ).toHaveAttribute(
      "src",
      `https://www.google.com/maps?q=${MOCK_LAT},${MOCK_LON}&output=embed`,
    );
  });

  it( "sets loading=lazy on the iframe", () => {
    render( <LocationMap lat={ MOCK_LAT } lon={ MOCK_LON } /> );

    const iframe = screen.getByTitle( "Location map" );
    expect( iframe ).toHaveAttribute( "loading", "lazy" );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/__tests__/components/LocationMap.test.tsx`
Expected: FAIL — module `@/components/LocationMap` not found.

- [ ] **Step 3: Create the SCSS module**

Create `src/styles/LocationMap.module.scss`:

```scss
section.locationMap {
  margin-top: 6rem;
  margin-bottom: 6rem;
}

.locationHeader {
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

- [ ] **Step 4: Write the component implementation**

Create `src/components/LocationMap.tsx`:

```tsx
import { FC } from "react";
import styles from "@/styles/LocationMap.module.scss";

export interface LocationMapProps {
  lat: number;
  lon: number;
}

export const LocationMap: FC<LocationMapProps> = ({ lat, lon }) => {
  const embedUrl = `https://www.google.com/maps?q=${lat},${lon}&output=embed`;

  return (
    <section className={ styles.locationMap }>
      <header className={ styles.locationHeader }>
        <h2>Location</h2>
      </header>
      <div className={ styles.iframeWrapper }>
        <iframe
          title="Location map"
          src={ embedUrl }
          loading="lazy"
          allowFullScreen
        />
      </div>
    </section>
  );
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/__tests__/components/LocationMap.test.tsx`
Expected: 3 tests PASS.

- [ ] **Step 6: Run lint and format**

Run: `yarn format`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/LocationMap.tsx src/__tests__/components/LocationMap.test.tsx src/styles/LocationMap.module.scss
git commit -m "feat: add LocationMap component with Google Maps iframe embed"
```

---

### Task 2: Integrate location map into the post page

**Files:**
- Modify: `src/pages/post/[slug].tsx`
- Modify: `src/__tests__/pages/post/slug.test.tsx`

- [ ] **Step 1: Write the failing tests for getStaticProps location integration**

Add to `src/__tests__/pages/post/slug.test.tsx`.

Add component mock at the top alongside the other mocks:

```typescript
vi.mock( "@/components/LocationMap", () => ({ LocationMap: () => null }) );
```

Then add a new describe block at the end of the file:

```typescript
describe( "getStaticProps — location map", () => {
  const postWithLocation = makePost({ slug: "loc-post" });
  Object.assign( postWithLocation.fields, {
    location: { lat: 47.6062, lon: -122.3321 },
  });

  const postWithoutLocation = makePost({ slug: "no-loc-post" });

  beforeEach( () => {
    vi.resetAllMocks();
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: [ postWithLocation, postWithoutLocation ] } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
    vi.mocked( getTikTokOembed ).mockResolvedValue( null );
  });

  it( "passes lat and lon when location is present", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithLocation as never );

    const result = await getStaticProps({ params: { slug: "loc-post" } } as never );

    expect( result ).toMatchObject({
      props: {
        locationLat: 47.6062,
        locationLon: -122.3321,
      },
    });
  });

  it( "passes null for location props when location is absent", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithoutLocation as never );

    const result = await getStaticProps({ params: { slug: "no-loc-post" } } as never );

    expect( result ).toMatchObject({
      props: {
        locationLat: null,
        locationLon: null,
      },
    });
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: FAIL — `locationLat` not found in props.

- [ ] **Step 3: Update `src/pages/post/[slug].tsx` imports**

Add after the TikTok import lines:

```typescript
import { LocationMap } from "@/components/LocationMap";
```

- [ ] **Step 4: Update `BlogPostViewProps` interface**

Add after `tikTokOembed`:

```typescript
  locationLat?: number|null
  locationLon?: number|null
```

- [ ] **Step 5: Update `BlogPostView` component signature and rendering**

Add the location props to the destructured props:

```typescript
export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, soundCloudOembed, youTubeOembed, tikTokOembed, locationLat, locationLon, prevPost, nextPost }) => {
```

Add the LocationMap render after the Playlist embed, before the post nav:

```tsx
            { playlist && <Playlist playlist={ playlist } /> }
            { locationLat != null && locationLon != null && (
              <LocationMap lat={ locationLat } lon={ locationLon } />
            ) }
            { ( prevPost || nextPost ) && (
```

- [ ] **Step 6: Update `getStaticProps` to pass location**

Add after the TikTok oEmbed fetch:

```typescript
  const locationLat = post.fields.location?.lat ?? null;
  const locationLon = post.fields.location?.lon ?? null;
```

Add both to the returned props object:

```typescript
  return {
    props: {
      post,
      playlist,
      soundCloudOembed,
      youTubeOembed,
      tikTokOembed,
      locationLat,
      locationLon,
      prevPost,
      nextPost,
    },
  };
```

- [ ] **Step 7: Run all tests to verify everything passes**

Run: `yarn test`
Expected: All tests PASS, including the new location map tests.

- [ ] **Step 8: Run lint, format, and typecheck**

Run: `yarn format && yarn typecheck`
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add "src/pages/post/[slug].tsx" "src/__tests__/pages/post/slug.test.tsx"
git commit -m "feat: integrate location map into blog post page"
```

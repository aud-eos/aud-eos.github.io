# Google Maps Static Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a static Google Maps image on blog posts with a location field, with CSS-based light/dark theme switching.

**Architecture:** Build static map URLs in `getStaticProps` using lat/lon from Contentful. Pass both light and dark URLs as props. The component renders two `<img>` tags inside a Google Maps link, CSS toggles visibility via `prefers-color-scheme`.

**Tech Stack:** Next.js (static export), React, TypeScript, Vitest, Google Static Maps API, SCSS modules

**Closes:** #12

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/utils/maps/buildStaticMapUrl.ts` | Construct Static Maps API URLs with theme styles |
| Create | `src/utils/maps/buildStaticMapUrl.test.ts` | Unit tests for URL construction |
| Create | `src/components/LocationMap.tsx` | Map component with CSS theme toggle |
| Create | `src/__tests__/components/LocationMap.test.tsx` | Unit tests for map component |
| Create | `src/styles/LocationMap.module.scss` | Map styles with prefers-color-scheme swap |
| Modify | `src/pages/post/[slug].tsx` | Wire up map URL construction, props, and rendering |
| Modify | `src/__tests__/pages/post/slug.test.tsx` | Add location map tests for `getStaticProps` |

---

### Task 1: Create map URL utility with tests

**Files:**
- Create: `src/utils/maps/buildStaticMapUrl.ts`
- Create: `src/utils/maps/buildStaticMapUrl.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/maps/buildStaticMapUrl.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildStaticMapUrl } from "./buildStaticMapUrl";

const MOCK_LAT = 47.6062;
const MOCK_LON = -122.3321;

describe( "buildStaticMapUrl", () => {
  it( "returns a Google Static Maps API URL with the correct center coordinates", () => {
    const url = buildStaticMapUrl( MOCK_LAT, MOCK_LON, "light" );

    expect( url ).toContain( `center=${MOCK_LAT},${MOCK_LON}` );
    expect( url ).toStartWith( "https://maps.googleapis.com/maps/api/staticmap" );
  });

  it( "includes zoom, size, scale, and marker parameters", () => {
    const url = buildStaticMapUrl( MOCK_LAT, MOCK_LON, "light" );

    expect( url ).toContain( "zoom=15" );
    expect( url ).toContain( "size=600x300" );
    expect( url ).toContain( "scale=2" );
    expect( url ).toContain( `markers=${MOCK_LAT},${MOCK_LON}` );
  });

  it( "includes the API key from environment", () => {
    const url = buildStaticMapUrl( MOCK_LAT, MOCK_LON, "light" );

    expect( url ).toContain( "key=" );
  });

  it( "does not include style parameters for light theme", () => {
    const url = buildStaticMapUrl( MOCK_LAT, MOCK_LON, "light" );

    expect( url ).not.toContain( "style=" );
  });

  it( "includes dark style parameters for dark theme", () => {
    const url = buildStaticMapUrl( MOCK_LAT, MOCK_LON, "dark" );

    expect( url ).toContain( "style=" );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/utils/maps/buildStaticMapUrl.test.ts`
Expected: FAIL — module `./buildStaticMapUrl` not found.

- [ ] **Step 3: Write the implementation**

Create `src/utils/maps/buildStaticMapUrl.ts`:

```typescript
import { strict as assert } from "assert";

const GOOGLE_MAPS_API_KEY: string = process.env["GOOGLE_MAPS_API_KEY"] as string;
assert( !!GOOGLE_MAPS_API_KEY );

const STATIC_MAPS_ENDPOINT = "https://maps.googleapis.com/maps/api/staticmap";
const MAP_ZOOM = 15;
const MAP_SIZE = "600x300";
const MAP_SCALE = 2;

const DARK_STYLES = [
  "element:geometry|color:0x242f3e",
  "element:labels.text.stroke|color:0x242f3e",
  "element:labels.text.fill|color:0x746855",
  "feature:administrative.locality|element:labels.text.fill|color:0xd59563",
  "feature:road|element:geometry|color:0x38414e",
  "feature:road|element:geometry.stroke|color:0x212a37",
  "feature:road|element:labels.text.fill|color:0x9ca5b3",
  "feature:road.highway|element:geometry|color:0x746855",
  "feature:road.highway|element:geometry.stroke|color:0x1f2835",
  "feature:water|element:geometry|color:0x17263c",
  "feature:water|element:labels.text.fill|color:0x515c6d",
];

export function buildStaticMapUrl( lat: number, lon: number, theme: "light" | "dark" ): string {
  const params = new URLSearchParams({
    center: `${lat},${lon}`,
    zoom: String( MAP_ZOOM ),
    size: MAP_SIZE,
    scale: String( MAP_SCALE ),
    markers: `${lat},${lon}`,
    key: GOOGLE_MAPS_API_KEY,
  });

  if( theme === "dark" ) {
    for( const style of DARK_STYLES ) {
      params.append( "style", style );
    }
  }

  return `${STATIC_MAPS_ENDPOINT}?${params.toString()}`;
}
```

- [ ] **Step 4: Set up the env var for tests**

The module-level `assert` will fail if `GOOGLE_MAPS_API_KEY` is not set. Add a test setup that sets a dummy value. Create or update the test to stub the env var before the import:

Update `src/utils/maps/buildStaticMapUrl.test.ts` to add at the top, before the import:

```typescript
import { describe, it, expect, vi } from "vitest";

vi.stubEnv( "GOOGLE_MAPS_API_KEY", "test-api-key" );

import { buildStaticMapUrl } from "./buildStaticMapUrl";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/utils/maps/buildStaticMapUrl.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/utils/maps/
git commit -m "feat: add Google Static Maps URL builder utility"
```

---

### Task 2: Create LocationMap component with tests

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

const MOCK_PROPS = {
  lightMapUrl: "https://maps.googleapis.com/maps/api/staticmap?style=light",
  darkMapUrl: "https://maps.googleapis.com/maps/api/staticmap?style=dark",
  lat: 47.6062,
  lon: -122.3321,
};

describe( "LocationMap", () => {
  it( "renders a link to Google Maps with the correct coordinates", () => {
    render( <LocationMap { ...MOCK_PROPS } /> );

    const link = screen.getByRole( "link", { name: /location map/i });
    expect( link ).toHaveAttribute( "href", "https://www.google.com/maps?q=47.6062,-122.3321" );
    expect( link ).toHaveAttribute( "target", "_blank" );
    expect( link ).toHaveAttribute( "rel", "noopener noreferrer" );
  });

  it( "renders a Location heading", () => {
    render( <LocationMap { ...MOCK_PROPS } /> );

    expect( screen.getByRole( "heading", { name: "Location" } ) ).toBeInTheDocument();
  });

  it( "renders both light and dark map images", () => {
    render( <LocationMap { ...MOCK_PROPS } /> );

    const images = screen.getAllByRole( "img" );
    const srcs = images.map( ( image ) => image.getAttribute( "src" ) );
    expect( srcs ).toContain( MOCK_PROPS.lightMapUrl );
    expect( srcs ).toContain( MOCK_PROPS.darkMapUrl );
  });

  it( "sets loading=lazy on both images", () => {
    render( <LocationMap { ...MOCK_PROPS } /> );

    const images = screen.getAllByRole( "img" );
    for( const image of images ) {
      expect( image ).toHaveAttribute( "loading", "lazy" );
    }
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

.mapImage {
  width: 100%;
  border-radius: 4px;
}

.mapLight {
  display: none;
}

.mapDark {
  display: block;
}

@media (prefers-color-scheme: light) {
  .mapLight {
    display: block;
  }

  .mapDark {
    display: none;
  }
}
```

- [ ] **Step 4: Write the component implementation**

Create `src/components/LocationMap.tsx`:

```tsx
import { FC } from "react";
import styles from "@/styles/LocationMap.module.scss";

export interface LocationMapProps {
  lightMapUrl: string;
  darkMapUrl: string;
  lat: number;
  lon: number;
}

export const LocationMap: FC<LocationMapProps> = ({ lightMapUrl, darkMapUrl, lat, lon }) => {
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  return (
    <section className={ styles.locationMap }>
      <header className={ styles.locationHeader }>
        <h2>Location</h2>
      </header>
      <a
        href={ googleMapsUrl }
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          className={ `${styles.mapImage} ${styles.mapLight}` }
          src={ lightMapUrl }
          alt="Location map"
          loading="lazy"
        />
        <img
          className={ `${styles.mapImage} ${styles.mapDark}` }
          src={ darkMapUrl }
          alt="Location map"
          loading="lazy"
        />
      </a>
    </section>
  );
};
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test src/__tests__/components/LocationMap.test.tsx`
Expected: 4 tests PASS.

- [ ] **Step 6: Run lint and format**

Run: `yarn format`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/LocationMap.tsx src/__tests__/components/LocationMap.test.tsx src/styles/LocationMap.module.scss
git commit -m "feat: add LocationMap component with CSS light/dark theme toggle"
```

---

### Task 3: Integrate location map into the post page

**Files:**
- Modify: `src/pages/post/[slug].tsx`
- Modify: `src/__tests__/pages/post/slug.test.tsx`

- [ ] **Step 1: Write the failing tests for getStaticProps location integration**

Add to `src/__tests__/pages/post/slug.test.tsx`.

Add mock at the top alongside the other mocks:

```typescript
vi.mock( "@/utils/maps/buildStaticMapUrl", () => ({
  buildStaticMapUrl: vi.fn( ( lat: number, lon: number, theme: string ) =>
    `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&theme=${theme}` ),
}) );
```

Add component mock:

```typescript
vi.mock( "@/components/LocationMap", () => ({ LocationMap: () => null }) );
```

Add import:

```typescript
import { buildStaticMapUrl } from "@/utils/maps/buildStaticMapUrl";
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

  it( "builds light and dark map URLs when location is present", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithLocation as never );

    const result = await getStaticProps({ params: { slug: "loc-post" } } as never );

    expect( buildStaticMapUrl ).toHaveBeenCalledWith( 47.6062, -122.3321, "light" );
    expect( buildStaticMapUrl ).toHaveBeenCalledWith( 47.6062, -122.3321, "dark" );
    expect( result ).toMatchObject({
      props: {
        locationMapLight: expect.stringContaining( "theme=light" ),
        locationMapDark: expect.stringContaining( "theme=dark" ),
        locationLat: 47.6062,
        locationLon: -122.3321,
      },
    });
  });

  it( "passes null for location props when location is absent", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( postWithoutLocation as never );

    const result = await getStaticProps({ params: { slug: "no-loc-post" } } as never );

    expect( buildStaticMapUrl ).not.toHaveBeenCalled();
    expect( result ).toMatchObject({
      props: {
        locationMapLight: null,
        locationMapDark: null,
        locationLat: null,
        locationLon: null,
      },
    });
  });
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

Run: `yarn test src/__tests__/pages/post/slug.test.tsx`
Expected: FAIL — `locationMapLight` not found in props, `buildStaticMapUrl` never called.

- [ ] **Step 3: Update `src/pages/post/[slug].tsx` imports**

Add after the TikTok import lines:

```typescript
import { buildStaticMapUrl } from "@/utils/maps/buildStaticMapUrl";
import { LocationMap } from "@/components/LocationMap";
```

- [ ] **Step 4: Update `BlogPostViewProps` interface**

Add after `tikTokOembed`:

```typescript
  locationMapLight?: string|null
  locationMapDark?: string|null
  locationLat?: number|null
  locationLon?: number|null
```

- [ ] **Step 5: Update `BlogPostView` component signature and rendering**

Add the location props to the destructured props:

```typescript
export const BlogPostView: FC<BlogPostViewProps> = ({ post, playlist, soundCloudOembed, youTubeOembed, tikTokOembed, locationMapLight, locationMapDark, locationLat, locationLon, prevPost, nextPost }) => {
```

Add the LocationMap render after the Playlist embed, before the post nav:

```tsx
            { playlist && <Playlist playlist={ playlist } /> }
            { locationMapLight && locationMapDark && locationLat != null && locationLon != null && (
              <LocationMap
                lightMapUrl={ locationMapLight }
                darkMapUrl={ locationMapDark }
                lat={ locationLat }
                lon={ locationLon }
              />
            ) }
            { ( prevPost || nextPost ) && (
```

- [ ] **Step 6: Update `getStaticProps` to build map URLs**

Add after the TikTok oEmbed fetch:

```typescript
  const locationMapLight = post.fields.location
    ? buildStaticMapUrl( post.fields.location.lat, post.fields.location.lon, "light" ) : null;
  const locationMapDark = post.fields.location
    ? buildStaticMapUrl( post.fields.location.lat, post.fields.location.lon, "dark" ) : null;
  const locationLat = post.fields.location?.lat ?? null;
  const locationLon = post.fields.location?.lon ?? null;
```

Add all four to the returned props object:

```typescript
  return {
    props: {
      post,
      playlist,
      soundCloudOembed,
      youTubeOembed,
      tikTokOembed,
      locationMapLight,
      locationMapDark,
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

---

### Task 4: Add env var and verify

**Files:** None (configuration + manual verification)

- [ ] **Step 1: Add GOOGLE_MAPS_API_KEY to .env.local**

Ask the user to add their Google Maps API key to `.env.local`:

```
GOOGLE_MAPS_API_KEY=<their-key>
```

- [ ] **Step 2: Add to GitHub Actions secrets**

Remind the user to add `GOOGLE_MAPS_API_KEY` to GitHub Actions secrets for the build pipeline.

- [ ] **Step 3: Update CLAUDE.md with the new env var**

Add `GOOGLE_MAPS_API_KEY` to the environment variables section in `CLAUDE.md`.

- [ ] **Step 4: Run the full build**

Run: `yarn build`
Expected: Build completes successfully. Posts with locations render map URLs in the static HTML.

- [ ] **Step 5: Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs: add GOOGLE_MAPS_API_KEY to environment variables"
```

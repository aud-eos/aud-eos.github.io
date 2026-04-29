// @vitest-environment node
import { describe, it, expect } from "vitest";
import { resolveCategoryForTags } from "./backfill-categories.mjs";

describe( "resolveCategoryForTags", () => {
  it( "returns the category when there is a single mapped tag", () => {
    expect( resolveCategoryForTags( [ "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "dj" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "plantlife" ] ) ).toBe( "lifestyle" );
  });

  it( "applies music > events > lifestyle priority on cross-category tags", () => {
    expect( resolveCategoryForTags( [ "dj", "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "nightlife", "graphics" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "plantlife", "merch" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "graphics", "playlists", "dj" ] ) ).toBe( "music" );
  });

  it( "is independent of input order", () => {
    expect( resolveCategoryForTags( [ "releases", "dj" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "dj", "releases" ] ) ).toBe( "music" );
  });

  it( "ignores unknown tags", () => {
    expect( resolveCategoryForTags( [ "unknown-tag", "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "unknown-a", "unknown-b", "graphics" ] ) ).toBe( "lifestyle" );
  });

  it( "returns null when no tags are mapped", () => {
    expect( resolveCategoryForTags( [] ) ).toBeNull();
    expect( resolveCategoryForTags( [ "unknown-only" ] ) ).toBeNull();
    expect( resolveCategoryForTags( [ "unknown-a", "unknown-b" ] ) ).toBeNull();
  });

  it( "maps every tag from the spec's TAG_TO_CATEGORY table", () => {
    expect( resolveCategoryForTags( [ "releases" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "edits" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "radio" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "playlists" ] ) ).toBe( "music" );
    expect( resolveCategoryForTags( [ "dj" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "nightlife" ] ) ).toBe( "events" );
    expect( resolveCategoryForTags( [ "plantlife" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "merch" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "graphics" ] ) ).toBe( "lifestyle" );
    expect( resolveCategoryForTags( [ "technology" ] ) ).toBe( "lifestyle" );
  });
});

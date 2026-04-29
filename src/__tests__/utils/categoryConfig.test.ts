import { describe, it, expect } from "vitest";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { CategoryConfigMap } from "@/types/categoryConfig";

const exampleConfig: CategoryConfigMap = {
  music: { title: "Music", description: "music posts", ogImage: null },
  events: { title: "Events", description: "events posts", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "lifestyle posts", ogImage: null },
};

describe( "validateCategoryConfig", () => {
  it( "returns the config when every post category is a key in the config", () => {
    const result = validateCategoryConfig( exampleConfig, [ "music", "events", "music", "lifestyle" ] );
    expect( result ).toEqual( exampleConfig );
  });

  it( "throws when a post category is missing from the config", () => {
    expect( () =>
      validateCategoryConfig( exampleConfig, [ "music", "deep-cuts" ] ),
    ).toThrowError(
      'Category "deep-cuts" is set on a published post but is missing from data/categories.json',
    );
  });

  it( "throws when a post has an undefined category", () => {
    expect( () =>
      validateCategoryConfig( exampleConfig, [ "music", undefined ] ),
    ).toThrowError(
      "A published post is missing a category. Run the backfill script and ensure the Contentful field is required.",
    );
  });

  it( "returns the config when the post array is empty", () => {
    const result = validateCategoryConfig( exampleConfig, [] );
    expect( result ).toEqual( exampleConfig );
  });

  it( "passes when the config has extra entries not used by any post", () => {
    const result = validateCategoryConfig( exampleConfig, [ "music" ] );
    expect( result ).toEqual( exampleConfig );
  });
});

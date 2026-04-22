import { describe, it, expect } from "vitest";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";
import { TagSeoConfigMap } from "@/types/tagConfig";

describe( "validateTagSeoConfig", () => {
  it( "returns the config for a tag ID that exists in the config", () => {
    const config: TagSeoConfigMap = {
      jazz: {
        title: "Jazz Music",
        description: "Jazz posts on Audeos.com",
        ogImage: null,
      },
    };
    const tagIds = [ "jazz" ];

    const result = validateTagSeoConfig( config, tagIds );

    expect( result ).toEqual( config );
  });

  it( "throws when a tag ID is missing from the config", () => {
    const config: TagSeoConfigMap = {
      jazz: {
        title: "Jazz Music",
        description: "Jazz posts on Audeos.com",
        ogImage: null,
      },
    };
    const tagIds = [ "jazz", "ambient" ];

    expect( () => validateTagSeoConfig( config, tagIds ) ).toThrowError(
      'Tag "ambient" exists in Contentful but is missing from data/tags.json',
    );
  });

  it( "passes when config has extra entries not in Contentful", () => {
    const config: TagSeoConfigMap = {
      jazz: {
        title: "Jazz Music",
        description: "Jazz posts on Audeos.com",
        ogImage: null,
      },
      ambient: {
        title: "Ambient Music",
        description: "Ambient posts on Audeos.com",
        ogImage: null,
      },
    };
    const tagIds = [ "jazz" ];

    const result = validateTagSeoConfig( config, tagIds );

    expect( result ).toEqual( config );
  });
});

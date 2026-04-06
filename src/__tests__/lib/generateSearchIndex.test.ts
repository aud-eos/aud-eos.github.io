// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

vi.mock( "fs", () => ({
  default: {
    writeFileSync: vi.fn(),
  },
}) );

import { generateSearchIndex } from "@/lib/generateSearchIndex";
import { SearchPost } from "@/lib/searchTypes";

const makePost = ( overrides: Partial<SearchPost> = {}): SearchPost => ({
  title: "Test Post",
  slug: "test-post",
  description: "A description",
  body: "Some body text",
  author: "Author Name",
  spotifyText: "",
  tags: [ "tag1" ],
  date: "2024-06-01",
  imageUrl: "",
  ...overrides,
});

describe( "generateSearchIndex", () => {
  beforeEach( () => {
    vi.mocked( fs.writeFileSync ).mockReset();
  });

  it( "writes to search-index.json", () => {
    generateSearchIndex( [ makePost() ] );

    const paths = vi.mocked( fs.writeFileSync ).mock.calls.map( ( [ filePath ] ) => String( filePath ) );
    expect( paths.some( path => path.endsWith( "search-index.json" ) ) ).toBe( true );
  });

  it( "serializes the posts array as JSON", () => {
    const posts = [ makePost({ title: "Alpha" }), makePost({ title: "Beta", slug: "beta" }) ];
    generateSearchIndex( posts );

    const [ , content ] = vi.mocked( fs.writeFileSync ).mock.calls[0];
    expect( JSON.parse( String( content ) ) ).toEqual( posts );
  });

  it( "writes an empty array when given no posts", () => {
    generateSearchIndex( [] );

    const [ , content ] = vi.mocked( fs.writeFileSync ).mock.calls[0];
    expect( JSON.parse( String( content ) ) ).toEqual( [] );
  });
});

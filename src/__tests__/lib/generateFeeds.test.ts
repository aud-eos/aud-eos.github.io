// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";

// Prevent contentfulUtils module-level asserts from running
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "fs", () => ({
  default: {
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}) );

import { generateFeeds } from "@/lib/generateFeeds";
import { SITE_URL, META_TITLE } from "@/constants";

function makeBlogPost( fields: {
  title: string;
  slug: string;
  date?: string;
  description?: string;
  body?: string;
  image?: { fields: { file: { url: string } } };
}, createdAt = "2024-01-01T00:00:00.000Z" ) {
  return {
    sys: { createdAt },
    fields: {
      description: "",
      body: "",
      image: undefined,
      ...fields,
    },
  };
}

function capturedFile( filename: string ): string {
  const calls = vi.mocked( fs.writeFileSync ).mock.calls;
  const call = calls.find( ( [ filePath ] ) => String( filePath ).endsWith( filename ) );
  if( !call ) throw new Error( `writeFileSync was not called with a path ending in "${filename}"` );
  return String( call[1] );
}

describe( "generateFeeds", () => {
  beforeEach( () => {
    vi.mocked( fs.writeFileSync ).mockReset();
    vi.mocked( fs.mkdirSync ).mockReset();
  });

  it( "writes rss.xml, atom.xml and feed.json", () => {
    generateFeeds( [ makeBlogPost({ title: "A Post", slug: "a-post", date: "2024-06-01T00:00:00.000Z" }) ] as never[] );

    const writtenPaths = vi.mocked( fs.writeFileSync ).mock.calls.map( ( [ filePath ] ) => String( filePath ) );
    expect( writtenPaths.some( path => path.endsWith( "rss.xml" ) ) ).toBe( true );
    expect( writtenPaths.some( path => path.endsWith( "atom.xml" ) ) ).toBe( true );
    expect( writtenPaths.some( path => path.endsWith( "feed.json" ) ) ).toBe( true );
  });

  it( "filters out posts with no date", () => {
    generateFeeds( [
      makeBlogPost({ title: "Has Date", slug: "has-date", date: "2024-06-01T00:00:00.000Z" }),
      makeBlogPost({ title: "No Date", slug: "no-date" }),
    ] as never[] );

    const rss = capturedFile( "rss.xml" );
    expect( rss ).toContain( "Has Date" );
    expect( rss ).not.toContain( "No Date" );
  });

  it( "sorts posts newest first in the RSS feed", () => {
    generateFeeds( [
      makeBlogPost({ title: "Older", slug: "older", date: "2024-01-01T00:00:00.000Z" }),
      makeBlogPost({ title: "Newer", slug: "newer", date: "2024-06-01T00:00:00.000Z" }),
    ] as never[] );

    const rss = capturedFile( "rss.xml" );
    expect( rss.indexOf( "Newer" ) ).toBeLessThan( rss.indexOf( "Older" ) );
  });

  it( "escapes XML special characters in titles", () => {
    generateFeeds( [
      makeBlogPost({ title: "A & B < C > D", slug: "special", date: "2024-06-01T00:00:00.000Z" }),
    ] as never[] );

    const rss = capturedFile( "rss.xml" );
    expect( rss ).toContain( "A &amp; B &lt; C &gt; D" );
    expect( rss ).not.toContain( "A & B < C > D" );
  });

  it( "includes the post URL in the RSS feed", () => {
    generateFeeds( [
      makeBlogPost({ title: "Post", slug: "my-post", date: "2024-06-01T00:00:00.000Z" }),
    ] as never[] );

    const rss = capturedFile( "rss.xml" );
    expect( rss ).toContain( `${SITE_URL}/post/my-post` );
  });

  it( "produces valid JSON in feed.json", () => {
    generateFeeds( [
      makeBlogPost({ title: "JSON Post", slug: "json-post", date: "2024-06-01T00:00:00.000Z" }),
    ] as never[] );

    const json = JSON.parse( capturedFile( "feed.json" ) );
    expect( json.title ).toBe( META_TITLE );
    expect( json.items ).toHaveLength( 1 );
    expect( json.items[0].title ).toBe( "JSON Post" );
  });

  it( "includes a media:content tag when the post has an image", () => {
    generateFeeds( [
      makeBlogPost({
        title: "Post With Image",
        slug: "img-post",
        date: "2024-06-01T00:00:00.000Z",
        image: { fields: { file: { url: "//images.ctfassets.net/example.jpg" } } },
      }),
    ] as never[] );

    const rss = capturedFile( "rss.xml" );
    expect( rss ).toContain( "media:content" );
    expect( rss ).toContain( "https://images.ctfassets.net/example.jpg" );
  });

  it( "omits media:content tag when the post has no image", () => {
    generateFeeds( [
      makeBlogPost({ title: "No Image", slug: "no-img", date: "2024-06-01T00:00:00.000Z" }),
    ] as never[] );

    const rss = capturedFile( "rss.xml" );
    expect( rss ).not.toContain( "media:content" );
  });
});

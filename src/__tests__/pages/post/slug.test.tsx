import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "@/utils/contentfulUtils", () => ({
  getBlogPost: vi.fn(),
  getBlogPosts: vi.fn(),
}) );
vi.mock( "@/utils/spotify/getPlaylist", () => ({
  getPlaylist: vi.fn(),
}) );
vi.mock( "@/utils/soundcloud/getOembed", () => ({
  getOembed: vi.fn(),
}) );
vi.mock( "@/utils/youtube/getOembed", () => ({
  getOembed: vi.fn(),
}) );
vi.mock( "@/components/SoundCloudEmbed", () => ({ SoundCloudEmbed: () => null }) );
vi.mock( "@/components/YouTubeEmbed", () => ({ YouTubeEmbed: () => null }) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );
vi.mock( "next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={ src } alt={ alt } />,
}) );
vi.mock( "next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{ children }</>,
}) );
vi.mock( "@/components/Layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <>{ children }</>,
}) );
vi.mock( "@/components/Markdown", () => ({
  Markdown: ({ children }: { children: React.ReactNode }) => <div>{ children }</div>,
}) );
vi.mock( "@/components/Tags", () => ({ Tags: () => null }) );
vi.mock( "@/components/DateTimeFormat", () => ({ default: () => null }) );
vi.mock( "@/components/Playlist", () => ({ default: () => null }) );

import { BlogPostView, getStaticProps } from "@/pages/post/[slug]";
import { getBlogPost, getBlogPosts } from "@/utils/contentfulUtils";
import { getPlaylist } from "@/utils/spotify/getPlaylist";
import { getOembed } from "@/utils/soundcloud/getOembed";
import { getOembed as getYouTubeOembed } from "@/utils/youtube/getOembed";

function makePost( overrides: {
  slug?: string;
  title?: string;
  date?: string;
  createdAt?: string;
} = {}) {
  return {
    sys: {
      createdAt: overrides.createdAt ?? "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    },
    fields: {
      title: overrides.title ?? "Test Post",
      slug: overrides.slug ?? "test-post",
      description: "A test post",
      body: "Post body",
      date: overrides.date,
      author: undefined,
      image: undefined,
      spotifyPlaylistId: undefined,
    },
    metadata: { tags: [] },
  };
}

describe( "BlogPostView — post navigation", () => {
  const post = makePost() as never;

  it( "renders a newer link when nextPost is provided", () => {
    render(
      <BlogPostView post={ post } nextPost={ { slug: "newer-post", title: "Newer Post" } } />,
    );
    expect( screen.getByText( "← Newer" ).closest( "a" ) ).toHaveAttribute( "href", "/post/newer-post" );
  });

  it( "renders an older link when prevPost is provided", () => {
    render(
      <BlogPostView post={ post } prevPost={ { slug: "older-post", title: "Older Post" } } />,
    );
    expect( screen.getByText( "Older →" ).closest( "a" ) ).toHaveAttribute( "href", "/post/older-post" );
  });

  it( "renders the post title inside each navigation link", () => {
    render(
      <BlogPostView
        post={ post }
        nextPost={ { slug: "newer-post", title: "A Newer Post Title" } }
        prevPost={ { slug: "older-post", title: "An Older Post Title" } }
      />,
    );
    expect( screen.getByText( "A Newer Post Title" ) ).toBeInTheDocument();
    expect( screen.getByText( "An Older Post Title" ) ).toBeInTheDocument();
  });

  it( "omits the nav entirely when neither prevPost nor nextPost is provided", () => {
    render( <BlogPostView post={ post } /> );
    expect( screen.queryByRole( "navigation" ) ).toBeNull();
  });

  it( "omits the newer link when nextPost is null", () => {
    render( <BlogPostView post={ post } prevPost={ { slug: "older-post", title: "Older Post" } } /> );
    expect( screen.queryByText( "← Newer" ) ).not.toBeInTheDocument();
  });

  it( "omits the older link when prevPost is null", () => {
    render( <BlogPostView post={ post } nextPost={ { slug: "newer-post", title: "Newer Post" } } /> );
    expect( screen.queryByText( "Older →" ) ).not.toBeInTheDocument();
  });
});

describe( "getStaticProps — post navigation", () => {
  const orderedPosts = [
    makePost({ slug: "oldest", date: "2024-01-01T00:00:00.000Z", title: "Oldest Post" }),
    makePost({ slug: "middle", date: "2024-06-01T00:00:00.000Z", title: "Middle Post" }),
    makePost({ slug: "newest", date: "2024-12-01T00:00:00.000Z", title: "Newest Post" }),
  ];

  beforeEach( () => {
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: orderedPosts } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
  });

  it( "assigns both prevPost and nextPost for a middle post", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( orderedPosts[1] as never );
    const result = await getStaticProps({ params: { slug: "middle" } } as never );
    expect( result ).toMatchObject({
      props: {
        prevPost: { slug: "oldest", title: "Oldest Post" },
        nextPost: { slug: "newest", title: "Newest Post" },
      },
    });
  });

  it( "sets prevPost to null for the oldest post", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( orderedPosts[0] as never );
    const result = await getStaticProps({ params: { slug: "oldest" } } as never );
    expect( result ).toMatchObject({
      props: { prevPost: null, nextPost: { slug: "middle" } },
    });
  });

  it( "sets nextPost to null for the newest post", async () => {
    vi.mocked( getBlogPost ).mockResolvedValue( orderedPosts[2] as never );
    const result = await getStaticProps({ params: { slug: "newest" } } as never );
    expect( result ).toMatchObject({
      props: { prevPost: { slug: "middle" }, nextPost: null },
    });
  });

  it( "correctly orders posts by fields.date regardless of fetch order", async () => {
    const unorderedPosts = [
      makePost({ slug: "second", date: "2024-06-01T00:00:00.000Z", title: "Second" }),
      makePost({ slug: "first", date: "2024-01-01T00:00:00.000Z", title: "First" }),
      makePost({ slug: "third", date: "2024-12-01T00:00:00.000Z", title: "Third" }),
    ];
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: unorderedPosts } as never );
    vi.mocked( getBlogPost ).mockResolvedValue( unorderedPosts[0] as never ); // "second"
    const result = await getStaticProps({ params: { slug: "second" } } as never );
    expect( result ).toMatchObject({
      props: {
        prevPost: { slug: "first" },
        nextPost: { slug: "third" },
      },
    });
  });

  it( "falls back to sys.createdAt for ordering when fields.date is absent", async () => {
    const postsWithoutDate = [
      makePost({ slug: "created-second", createdAt: "2024-06-01T00:00:00.000Z", title: "Created Second" }),
      makePost({ slug: "created-first", createdAt: "2024-01-01T00:00:00.000Z", title: "Created First" }),
    ];
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: postsWithoutDate } as never );
    vi.mocked( getBlogPost ).mockResolvedValue( postsWithoutDate[0] as never ); // "created-second"
    const result = await getStaticProps({ params: { slug: "created-second" } } as never );
    expect( result ).toMatchObject({
      props: { prevPost: { slug: "created-first" }, nextPost: null },
    });
  });
});

describe( "getStaticProps — SoundCloud oEmbed", () => {
  const postWithSoundcloud = makePost({ slug: "sc-post" });
  Object.assign( postWithSoundcloud.fields, {
    soundcloudUrl: "https://soundcloud.com/artist/track",
  });

  const postWithoutSoundcloud = makePost({ slug: "no-sc-post" });

  beforeEach( () => {
    vi.resetAllMocks();
    vi.mocked( getBlogPosts ).mockResolvedValue({ items: [ postWithSoundcloud, postWithoutSoundcloud ] } as never );
    vi.mocked( getPlaylist ).mockResolvedValue( null as never );
    vi.mocked( getOembed ).mockResolvedValue( null );
    vi.mocked( getYouTubeOembed ).mockResolvedValue( null );
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

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  POSTS_PER_TAG_SECTION: 3,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );
vi.mock( "@/components/Home/BlogPostList", () => ({
  default: ({
    posts,
    firstCardPriority,
    tagId,
  }: {
    posts: { fields: { slug: string } }[];
    firstCardPriority?: boolean;
    tagId?: string;
  }) => (
    <ul
      data-testid={ `bpl-${tagId}` }
      data-priority={ firstCardPriority ? "true" : "false" }
      data-count={ posts.length }
    >
      { posts.map( post => <li key={ post.fields.slug }>{ post.fields.slug }</li> ) }
    </ul>
  ),
}) );

import TaggedPostSections from "@/components/Home/TaggedPostSections";

const tagAlpha = { sys: { id: "alpha" } };
const tagBeta = { sys: { id: "beta" } };
const tagEmpty = { sys: { id: "empty" } };

const tagSeoConfig = {
  alpha: { title: "Alpha Title", description: "", ogImage: null },
  beta: { title: "Beta Title", description: "", ogImage: null },
  empty: { title: "Empty Title", description: "", ogImage: null },
};

const makePost = ({
  slug,
  date,
  tagIds,
}: {
  slug: string;
  date: string;
  tagIds: string[];
}) => ({
  sys: { id: slug, createdAt: date },
  fields: { slug, title: slug, date, image: undefined },
  metadata: { tags: tagIds.map( id => ({ sys: { id, type: "Link", linkType: "Tag" } }) ) },
});

beforeEach( () => {
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

describe( "TaggedPostSections", () => {
  it( "renders one section per tag that has at least one post", () => {
    const posts = {
      items: [
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
        makePost({ slug: "b1", date: "2026-04-02", tagIds: [ "beta" ] }),
      ],
    };
    const { container } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta, tagEmpty ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections ).toHaveLength( 2 );
    expect( sections[0].id ).toBe( "tag-alpha" );
    expect( sections[1].id ).toBe( "tag-beta" );
  });

  it( "iterates tags alphabetically by id", () => {
    const posts = {
      items: [
        makePost({ slug: "b1", date: "2026-04-01", tagIds: [ "beta" ] }),
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
      ],
    };
    const { container } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagBeta, tagAlpha ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections[0].id ).toBe( "tag-alpha" );
    expect( sections[1].id ).toBe( "tag-beta" );
  });

  it( "caps each section at POSTS_PER_TAG_SECTION (3) most recent posts", () => {
    const posts = {
      items: [
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
        makePost({ slug: "a2", date: "2026-04-02", tagIds: [ "alpha" ] }),
        makePost({ slug: "a3", date: "2026-04-03", tagIds: [ "alpha" ] }),
        makePost({ slug: "a4", date: "2026-04-04", tagIds: [ "alpha" ] }),
        makePost({ slug: "a5", date: "2026-04-05", tagIds: [ "alpha" ] }),
      ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const list = getByTestId( "bpl-alpha" );
    expect( list.getAttribute( "data-count" ) ).toBe( "3" );
    const slugs = Array.from( list.querySelectorAll( "li" ) ).map( item => item.textContent );
    expect( slugs ).toEqual( [ "a5", "a4", "a3" ] );
  });

  it( "shows a post tagged with two tags in both sections", () => {
    const posts = {
      items: [ makePost({ slug: "shared", date: "2026-04-01", tagIds: [ "alpha", "beta" ] }) ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    expect( getByTestId( "bpl-alpha" ).getAttribute( "data-count" ) ).toBe( "1" );
    expect( getByTestId( "bpl-beta" ).getAttribute( "data-count" ) ).toBe( "1" );
  });

  it( "links the section header to /tags/[tagId] using tagSeoConfig.title", () => {
    const posts = {
      items: [ makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }) ],
    };
    const { container } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    const heading = container.querySelector( "h2 a" );
    expect( heading?.getAttribute( "href" ) ).toBe( "/tags/alpha" );
    expect( heading?.textContent ).toBe( "Alpha Title" );
  });

  it( "passes firstCardPriority only to the first rendered section", () => {
    const posts = {
      items: [
        makePost({ slug: "a1", date: "2026-04-01", tagIds: [ "alpha" ] }),
        makePost({ slug: "b1", date: "2026-04-01", tagIds: [ "beta" ] }),
      ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    expect( getByTestId( "bpl-alpha" ).getAttribute( "data-priority" ) ).toBe( "true" );
    expect( getByTestId( "bpl-beta" ).getAttribute( "data-priority" ) ).toBe( "false" );
  });

  it( "renders nothing when no tags have posts", () => {
    const { container } = render(
      <TaggedPostSections
        posts={ { items: [] } as never }
        tags={ { items: [ tagAlpha, tagBeta ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    expect( container.querySelectorAll( "section" ) ).toHaveLength( 0 );
  });

  it( "passes firstCardPriority to the first rendered section even when earlier tags are empty", () => {
    const posts = {
      items: [ makePost({ slug: "b1", date: "2026-04-01", tagIds: [ "beta" ] }) ],
    };
    const { getByTestId } = render(
      <TaggedPostSections
        posts={ posts as never }
        tags={ { items: [ tagAlpha, tagBeta ] } as never }
        tagSeoConfig={ tagSeoConfig as never }
      />,
    );
    expect( getByTestId( "bpl-beta" ).getAttribute( "data-priority" ) ).toBe( "true" );
  });
});

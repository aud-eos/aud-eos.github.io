import { describe, it, expect } from "vitest";
import { buildHomepageSchema } from "@/lib/homepageSchema";

const makePost = ({
  id,
  slug,
  title,
  date,
  imageUrl,
}: {
  id: string;
  slug: string;
  title: string;
  date: string;
  imageUrl?: string;
}) => ({
  sys: { id, createdAt: date },
  fields: {
    slug,
    title,
    date,
    image: imageUrl
      ? { fields: { file: { url: imageUrl }, description: "" } }
      : undefined,
  },
  metadata: { tags: [] },
});

describe( "buildHomepageSchema", () => {
  it( "returns a CollectionPage with site-level metadata", () => {
    const schema = buildHomepageSchema({
      items: [ makePost({ id: "1", slug: "post-1", title: "Post 1", date: "2026-04-01" }) ],
    } as never );
    expect( schema[ "@context" ] ).toBe( "https://schema.org" );
    expect( schema[ "@type" ] ).toBe( "CollectionPage" );
    expect( schema.name ).toBeDefined();
    expect( schema.description ).toBeDefined();
    expect( schema.url ).toBeDefined();
    expect( schema.isPartOf ).toEqual({
      "@type": "WebSite",
      "name": "Audeos.com",
      "url": "https://www.audeos.com",
    });
  });

  it( "includes one BlogPosting per post in hasPart", () => {
    const schema = buildHomepageSchema({
      items: [
        makePost({ id: "1", slug: "post-1", title: "Post 1", date: "2026-04-01", imageUrl: "//img/1.jpg" }),
        makePost({ id: "2", slug: "post-2", title: "Post 2", date: "2026-04-02" }),
      ],
    } as never );
    expect( schema.hasPart ).toHaveLength( 2 );
    expect( schema.hasPart[0] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "Post 1",
      "url": "https://www.audeos.com/post/post-1",
      "datePublished": "2026-04-01",
      "image": "https://img/1.jpg",
    });
    expect( schema.hasPart[1] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "Post 2",
      "url": "https://www.audeos.com/post/post-2",
      "datePublished": "2026-04-02",
    });
    expect( schema.hasPart[1].image ).toBeUndefined();
  });

  it( "deduplicates posts by slug", () => {
    const post = makePost({ id: "1", slug: "post-1", title: "Post 1", date: "2026-04-01" });
    const schema = buildHomepageSchema({
      items: [ post, post, post ],
    } as never );
    expect( schema.hasPart ).toHaveLength( 1 );
  });
});

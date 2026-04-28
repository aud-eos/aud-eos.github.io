import { BlogPost, BlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate } from "@/utils/blogPostUtils";
import { META_DESCRIPTION, META_TITLE, SITE_URL } from "@/constants";

function dedupeBySlug( posts: BlogPost[] ): BlogPost[] {
  const seen = new Set<string>();
  const unique: BlogPost[] = [];
  posts.forEach( post => {
    const slug = post.fields.slug;
    if( !seen.has( slug ) ) {
      seen.add( slug );
      unique.push( post );
    }
  });
  return unique;
}

export function buildHomepageSchema( posts: BlogPosts ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": META_TITLE,
    "description": META_DESCRIPTION,
    "url": SITE_URL,
    "isPartOf": {
      "@type": "WebSite",
      "name": "Audeos.com",
      "url": SITE_URL,
    },
    "hasPart": dedupeBySlug( posts.items ).map( post => {
      const imageUrl = post.fields.image?.fields.file?.url;
      return {
        "@type": "BlogPosting",
        "headline": post.fields.title,
        "url": `${SITE_URL}/post/${post.fields.slug}`,
        "datePublished": resolvePostDate( post ),
        "image": imageUrl ? `https:${imageUrl}` : undefined,
      };
    }),
  };
}

import { BlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import {
  CATEGORY_IDS,
  META_DESCRIPTION,
  META_TITLE,
  POSTS_PER_CATEGORY_SECTION,
  SITE_URL,
} from "@/constants";

export function buildHomepageSchema( posts: BlogPosts, categoryConfig: CategoryConfigMap ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": META_TITLE,
    "description": META_DESCRIPTION,
    "url": SITE_URL,
    "isPartOf": {
      "@type": "WebSite",
      "name": META_TITLE,
      "url": SITE_URL,
    },
    "hasPart": CATEGORY_IDS.map( categoryId => {
      const config = categoryConfig[categoryId];
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return {
        "@type": "CollectionPage",
        "name": config.title,
        "description": config.description,
        "url": `${SITE_URL}/category/${categoryId}`,
        "hasPart": categoryPosts.map( post => {
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
    }),
  };
}

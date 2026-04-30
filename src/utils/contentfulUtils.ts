import { strict as assert } from "assert";
import { createClient, Entry, EntryCollection, EntryFields, TagCollection } from "contentful";
import { TypeAuthorSkeleton, TypeBlogPostSkeleton } from "@/types";
import { CONTENT_TYPE_AUTHOR, CONTENT_TYPE_BLOG_POST } from "@/constants";

const CONTENTFUL_SPACE_ID: string = process.env[
  "CONTENTFUL_SPACE_ID"
] as string;
const CONTENTFUL_ACCESS_TOKEN: string = process.env[
  "CONTENTFUL_ACCESS_TOKEN"
] as string;


assert( !!CONTENTFUL_SPACE_ID );
assert( !!CONTENTFUL_ACCESS_TOKEN );


const client = createClient({
  space: CONTENTFUL_SPACE_ID,
  accessToken: CONTENTFUL_ACCESS_TOKEN,
});

export type BlogPosts = EntryCollection<TypeBlogPostSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
export type BlogPost = Entry<TypeBlogPostSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
export type AuthorCollection = EntryCollection<TypeAuthorSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
export type Author = Entry<TypeAuthorSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;

// Module-level Promise caches. Next.js's static export build is one Node
// process — a single fetch per collection is shared across every page's
// getStaticPaths and getStaticProps. Cuts per-build CDA calls from ~200 to 3.
// Slug-based lookups derive from the cached collection (no extra fetches).
let blogPostsPromise: Promise<BlogPosts> | null = null;
let tagsPromise: Promise<TagCollection> | null = null;
let authorsPromise: Promise<AuthorCollection> | null = null;

export const getBlogPosts = async (): Promise<BlogPosts> => {
  if( !blogPostsPromise ) {
    blogPostsPromise = client.withoutUnresolvableLinks.getEntries<TypeBlogPostSkeleton>({
      content_type: CONTENT_TYPE_BLOG_POST,
      limit: 1000,
    });
  }
  return blogPostsPromise;
};


export const getBlogPost = async (
  slug: EntryFields.Text,
): Promise<BlogPost | undefined> => {
  const all = await getBlogPosts();
  return all.items.find( post => post.fields.slug === slug );
};


export const getTags = async (): Promise<TagCollection> => {
  if( !tagsPromise ) {
    tagsPromise = client.getTags();
  }
  return tagsPromise;
};

export const getAuthors = async (): Promise<AuthorCollection> => {
  if( !authorsPromise ) {
    authorsPromise = client.withoutUnresolvableLinks.getEntries<TypeAuthorSkeleton>({
      content_type: CONTENT_TYPE_AUTHOR,
      limit: 1000,
    });
  }
  return authorsPromise;
};

export const getAuthor = async ( slug: EntryFields.Text ): Promise<Author | undefined> => {
  const all = await getAuthors();
  return all.items.find( author => author.fields.slug === slug );
};

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

// Retrieve the list of blog posts from Contentful
export const getBlogPosts = async (): Promise<BlogPosts> => {
  const response = await client.withoutUnresolvableLinks.getEntries<TypeBlogPostSkeleton>({
    content_type: CONTENT_TYPE_BLOG_POST,
  });
  return response;
};


export const getBlogPost = async (
  slug: EntryFields.Text,
): Promise<BlogPost | undefined> => {
  // Fetch all results where `fields.slug` is equal to the `slug` param
  const response = await client.withoutUnresolvableLinks.getEntries<TypeBlogPostSkeleton>({
    content_type: CONTENT_TYPE_BLOG_POST,
    "fields.slug": slug,
  });
  return response.items.pop();
};


export const getTags = async (): Promise<TagCollection> => {
  const response = await client.getTags();
  return response;
};

export const getAuthors = async (): Promise<AuthorCollection> => {
  const response = await client.withoutUnresolvableLinks.getEntries<TypeAuthorSkeleton>({
    content_type: CONTENT_TYPE_AUTHOR,
  });
  return response;
};

export const getAuthor = async ( slug: string ): Promise<Author | undefined> => {
  const response = await client.withoutUnresolvableLinks.getEntries<TypeAuthorSkeleton>({
    content_type: CONTENT_TYPE_AUTHOR,
    "fields.slug": slug,
  });
  return response.items[0];
};

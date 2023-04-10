import { strict as assert } from "assert";
import { createClient, EntryFields } from "contentful";
import { TypeBlogPost, TypeBlogPostFields } from "@/types";
import { CONTENT_TYPE_BLOG_POST } from "@/constants";

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

// Retrieve the list of blog posts from Contentful
export const getBlogPosts = async (): Promise<TypeBlogPost[]> => {
  const response = await client.getEntries<TypeBlogPostFields>({
    content_type: CONTENT_TYPE_BLOG_POST,
  });

  return response.items;
};

export const getBlogPost = async (
  slug: EntryFields.Text
): Promise<TypeBlogPost|undefined> => {

  // Fetch all results where `fields.slug` is equal to the `slug` param
  const response = await client.getEntries<TypeBlogPostFields>({
    content_type: CONTENT_TYPE_BLOG_POST,
    "fields.slug": slug,
  });

  return response.items.pop();
};

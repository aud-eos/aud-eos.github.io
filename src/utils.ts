import { Entry, EntryFields, createClient } from "contentful";
import { BlogPost } from "./pages";
import { strict as assert } from "assert";

const CONTENTFUL_SPACE_ID: string = process.env[
  "CONTENTFUL_SPACE_ID"
] as string;
const CONTENTFUL_ACCESS_TOKEN: string = process.env[
  "CONTENTFUL_ACCESS_TOKEN"
] as string;

assert(!!CONTENTFUL_SPACE_ID);
assert(!!CONTENTFUL_ACCESS_TOKEN);

const client = createClient({
  space: CONTENTFUL_SPACE_ID,
  accessToken: CONTENTFUL_ACCESS_TOKEN,
});

// Retrieve the list of blog posts from Contentful
export const getBlogPosts = async (): Promise<Entry<BlogPost>[]> => {
  const response = await client.getEntries<BlogPost>({
    content_type: "blogPost",
  });

  return response.items;
};

export const getBlogPost = async (
  slug: EntryFields.Text
): Promise<Entry<BlogPost> | undefined> => {
  // Fetch all results where `fields.slug` is equal to the `slug` param
  const response = await client.getEntries<BlogPost>({
    content_type: "blogPost",
    "fields.slug": slug,
  });

  return response.items.pop();
};

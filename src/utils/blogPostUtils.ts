import { Tag } from "contentful";
import { BlogPost } from "./contentfulUtils";

/**
 * Returns the effective publish date for a blog post,
 * falling back to the Contentful createdAt timestamp.
 */
export const resolvePostDate = ( post: BlogPost ): string =>
  post.fields.date || post.sys.createdAt;

/**
 * Sort function for an array of TypeBlogPost (newest first)
 */
export const sortBlogPostsByDate = (
  postA: BlogPost,
  postB: BlogPost,
): number => {
  const dateA = new Date( resolvePostDate( postA ) );
  const dateB = new Date( resolvePostDate( postB ) );
  return dateB.getTime() - dateA.getTime();
};


export const sortTagsById = ( tagA: Tag, tagB: Tag ) => {
  return tagA.sys.id.localeCompare( tagB.sys.id );
};

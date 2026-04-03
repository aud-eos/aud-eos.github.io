import { Tag } from "contentful";
import { BlogPost } from "./contentfulUtils";

/**
 * Sort function for an array of TypeBlogPost
 * @param postA
 * @param postB
 * @returns number
 */
export const sortBlogPostsByDate = (
  postA: BlogPost,
  postB: BlogPost,
): number => {
  const dateA = new Date( postA.fields.date || postA.sys.createdAt );
  const dateB = new Date( postB.fields.date || postB.sys.createdAt );
  return dateB.getTime() - dateA.getTime();
};


export const sortTagsByName = ( tagA: Tag, tagB: Tag ) => {
  return tagA.sys.id.localeCompare( tagB.sys.id );
};

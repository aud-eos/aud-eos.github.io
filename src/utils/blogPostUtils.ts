import { TypeBlogPost } from "@/types";
import { TagLink } from "contentful";


/**
 * Sort function for an array of TypeBlogPost
 * @param postA
 * @param postB
 * @returns number
 */
export const sortBlogPostsByDate = ( postA: TypeBlogPost, postB: TypeBlogPost ): number => {
    const dateA = new Date( postA.fields.date || postA.sys.createdAt );
    const dateB = new Date( postB.fields.date || postB.sys.createdAt );
    return dateB.getTime() - dateA.getTime();
  };


export const sortTagsByName = ( tagA: TagLink, tagB: TagLink ) => {
  return tagA.sys.id.localeCompare( tagB.sys.id );
};

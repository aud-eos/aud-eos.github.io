import { TypeBlogPost } from "@/types";


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

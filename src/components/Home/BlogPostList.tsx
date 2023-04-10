import Link from "next/link";
import { TypeBlogPost } from "@/types";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "../DateTimeFormat";


export interface BlogPostListProps {
  posts: TypeBlogPost[];
}


export default function BlogPostList({ posts }: BlogPostListProps ){
  return (
    <ul>
      {
        posts
          .sort( sortBlogPostsByDate )
          .map( post => {
            return (
              <li key={ post.fields.slug }>
                <Link href={ `/post/${post.fields.slug}` }>Post Title: { post.fields.title }</Link>
                <p><DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } /></p>
              </li>
          );
        })
      }
    </ul>
  );
}

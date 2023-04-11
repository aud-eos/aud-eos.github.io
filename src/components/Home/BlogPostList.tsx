import Link from "next/link";
import { TypeBlogPost } from "@/types";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";


const IMAGE_SIZE = 350;


export interface BlogPostListProps {
  posts: TypeBlogPost[];
}

export default function BlogPostList({ posts }: BlogPostListProps ){
  return (
    <ul className={ styles.imageGallery } role="list">
      {
        posts
          .sort( sortBlogPostsByDate )
          .map( post => {
            const url = `/post/${post.fields.slug}`;
            return (
              <li key={ post.sys.id }>
                  <figure>
                    <Link href={ url }>
                      <picture>
                        <img
                          src={ `https:${post.fields.image?.fields.file.url}?h=${IMAGE_SIZE}` }
                          alt={ post.fields.image?.fields.description || "" }
                        />
                      </picture>
                    </Link>
                    <figcaption>
                      <Link href={ url }><h3>{ post.fields.title }</h3></Link>
                      <h5><DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } /></h5>
                    </figcaption>
                  </figure>
              </li>
          );
        })
      }
    </ul>
  );
}

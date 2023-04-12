import Link from "next/link";
import { TypeBlogPost } from "@/types";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import Picture from "@/components/Picture";


const IMAGE_HEIGHT = 350;


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
            const pictureUrl = post.fields.image?.fields.file.url || "";
            const altText = post.fields.image?.fields.description || "";
            const timestamp = post.fields.date || post.sys.createdAt;

            return (
              <li key={ post.sys.id }>
                <figure>
                  <Link href={ url }>
                    <Picture
                      url={ pictureUrl }
                      maxHeight={ IMAGE_HEIGHT }
                      alt={ altText }
                      />
                  </Link>
                  <figcaption>
                    <Link href={ url }><h3>{ post.fields.title }</h3></Link>
                    <DateTimeFormat
                      timestamp={ timestamp }
                      />
                  </figcaption>
                </figure>
              </li>
            );
        })
      }
    </ul>
  );
}

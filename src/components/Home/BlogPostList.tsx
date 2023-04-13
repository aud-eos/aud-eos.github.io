import Link from "next/link";
import { TypeBlogPost } from "@/types";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import Picture from "@/components/Picture";
import { Tags } from "@/components/Tags";


const IMAGE_HEIGHT = 350;


export interface BlogPostListProps {
  posts: TypeBlogPost[];
  slug?: string;
}

export default function BlogPostList({ posts, slug }: BlogPostListProps ){
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
                  <Link href={ url } aria-label={ post.fields.title }>
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
                  <Tags tags={ post.metadata.tags } slug={ slug } />
                </figure>
              </li>
            );
        })
      }
    </ul>
  );
}

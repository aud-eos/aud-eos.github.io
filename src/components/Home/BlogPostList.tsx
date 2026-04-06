import Link from "next/link";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import Picture from "@/components/Picture";
import { Tags } from "@/components/Tags";
import { PAGE_SIZE } from "@/pages";
import { BlogPost } from "@/utils/contentfulUtils";


export interface BlogPostListProps {
  posts: BlogPost[]
  page: number
  tagId?: string
}

export default function BlogPostList({ posts, page, tagId }: BlogPostListProps ) {
  return (
    <ul className={ styles.imageGallery } role="list">
      {
        posts
          .sort( sortBlogPostsByDate )
          .slice( PAGE_SIZE * ( page - 1 ), PAGE_SIZE * page )
          .map( post => {

            const url = `/post/${post.fields.slug}`;
            const pictureUrl = post.fields.image?.fields.file?.url || "";
            const altText = post.fields.image?.fields.description || "";
            const timestamp = post.fields.date || post.sys.createdAt;

            return (
              <li key={ post.sys.id }>
                <figure>
                  <Link href={ url } className={ styles.cardLink }>
                    <div className={ styles.titleBar }>
                      <h3>{ post.fields.title }</h3>
                    </div>
                    <Picture
                      url={ pictureUrl }
                      maxWidth={ 600 }
                      alt={ altText }
                    />
                  </Link>
                  <figcaption className={ styles.statusBar }>
                    <DateTimeFormat
                      timestamp={ timestamp }
                      withDayName={ false }
                      withTime={ false }
                    />
                    <Tags
                      tags={ post.metadata.tags }
                      tagId={ tagId }
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

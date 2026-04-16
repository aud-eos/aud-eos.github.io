import { useEffect, useRef } from "react";
import Link from "next/link";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import Picture from "@/components/Picture";
import { Tags } from "@/components/Tags";
import { PAGE_SIZE } from "@/constants";
import { BlogPost } from "@/utils/contentfulUtils";
import { POSTS_ANCHOR } from "@/constants";


const IMAGE_WIDTH = 800;
const OBSERVER_THRESHOLD = 0.15;


export interface BlogPostListProps {
  posts: BlogPost[]
  page: number
  tagId?: string
}

export default function BlogPostList({ posts, page, tagId }: BlogPostListProps ) {
  const listRef = useRef<HTMLUListElement>( null );

  useEffect( () => {
    const list = listRef.current;
    if( !list ) return;

    const prefersReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    if( prefersReducedMotion ) {
      list.querySelectorAll( "li" ).forEach( item => item.classList.add( styles.visible ) );
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach( entry => {
          if( entry.isIntersecting ) {
            entry.target.classList.add( styles.visible );
            observer.unobserve( entry.target );
          }
        });
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    list.querySelectorAll( "li" ).forEach( item => observer.observe( item ) );

    return () => observer.disconnect();
  }, [ posts, page, tagId ] );

  return (
    <ul id={ POSTS_ANCHOR } className={ styles.imageGallery } role="list" ref={ listRef }>
      {
        [ ...posts ]
          .sort( sortBlogPostsByDate )
          .slice( PAGE_SIZE * ( page - 1 ), PAGE_SIZE * page )
          .map( post => {

            const url = `/post/${post.fields.slug}`;
            const pictureUrl = post.fields.image?.fields.file?.url || "";
            const altText = post.fields.image?.fields.description || "";
            const timestamp = resolvePostDate( post );

            return (
              <li key={ post.sys.id }>
                <figure>
                  <Link href={ url } aria-label={ post.fields.title }>
                    <Picture
                      url={ pictureUrl }
                      maxWidth={ IMAGE_WIDTH }
                      alt={ altText }
                    />
                  </Link>
                  <figcaption>
                    <Link href={ url }><h3>{ post.fields.title }</h3></Link>
                    <DateTimeFormat
                      timestamp={ timestamp }
                    />
                  </figcaption>
                  <Tags
                    tags={ post.metadata.tags }
                    tagId={ tagId }
                  />
                </figure>
              </li>
            );
          })
      }
    </ul>
  );
}

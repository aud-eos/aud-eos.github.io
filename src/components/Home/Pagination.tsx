import { PAGE_SIZE } from "@/pages";
import { TypeBlogPost } from "@/types";
import Link from "next/link";
import styles from "@/styles/Home.module.scss";



interface PaginationProps {
  posts: TypeBlogPost[]
  page: number
  tagId?: string
}


const getPaginatorUrl = ( pageNumber: number, tagId?: string ): string => {
  const base = tagId ? `/tags/${tagId}/` : "/";
  const page = pageNumber === 1 ? "" : `page/${pageNumber}`;
  return base + page;
};


export default function Pagination({ posts, page, tagId }: PaginationProps ){
  const numPages = Math.ceil( posts.length / PAGE_SIZE );
  if( numPages <= 1 ){
    return null;
  }
  return (
    <nav>
      {
        Boolean( page > 1 ) &&
          <Link
            href={ getPaginatorUrl( page - 1, tagId ) }
            rel="prev"
            >prev</Link>
      }
      {
        Array
          .from({ length: numPages }, ( _, idx ) => idx + 1 )
          .map( pageNumber => {
            const isCurrentPage: boolean = pageNumber === page;
            const href: string = getPaginatorUrl( pageNumber, tagId );
            const className: string|undefined = isCurrentPage ? styles.isTagged : undefined;
            return (
              <Link key={ pageNumber }
                href={ href }
                className={ className }
                >{ pageNumber }
              </Link>
            );
          })
      }
      {
        Boolean( page < numPages ) &&
          <Link
            href={ getPaginatorUrl( page + 1, tagId ) }
            rel="next"
            >next</Link>
      }
    </nav>
  );
}

import { PAGE_SIZE } from "@/constants";
import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPost } from "@/utils/contentfulUtils";
import { ArchiveFilter } from "@/types/archiveFilter";


interface PaginationProps {
  posts: BlogPost[]
  page: number
  filter: ArchiveFilter
}


function getPaginatorBase( filter: ArchiveFilter ): string {
  switch ( filter.kind ) {
  case "all": return "/";
  case "tag": return `/tags/${filter.id}/`;
  case "category": return `/category/${filter.id}/`;
  }
}


function getPaginatorUrl( pageNumber: number, filter: ArchiveFilter ): string {
  const base = getPaginatorBase( filter );
  if( pageNumber === 1 && filter.kind !== "all" ) {
    return base.replace( /\/$/, "" );
  }
  return `${base}page/${pageNumber}`;
}


export default function Pagination({ posts, page, filter }: PaginationProps ) {
  const numPages = Math.ceil( posts.length / PAGE_SIZE );
  if( numPages <= 1 ) {
    return null;
  }
  return (
    <nav className={ styles.pagination }>
      {
        Boolean( page > 1 ) &&
          <Link
            href={ getPaginatorUrl( page - 1, filter ) }
            rel="prev"
          >prev</Link>
      }
      {
        Array
          .from({ length: numPages }, ( _, idx ) => idx + 1 )
          .map( pageNumber => {
            const isCurrentPage: boolean = pageNumber === page;
            const href: string = getPaginatorUrl( pageNumber, filter );
            const className: string|undefined = isCurrentPage ? styles.isCurrentPage : undefined;
            return (
              <Link
                key={ pageNumber }
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
            href={ getPaginatorUrl( page + 1, filter ) }
            rel="next"
          >next</Link>
      }
    </nav>
  );
}

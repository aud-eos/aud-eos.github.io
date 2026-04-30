import styles from "@/styles/Home.module.scss";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import Pagination from "@/components/Home/Pagination";
import CategoryNav from "@/components/CategoryNav";
import { SeoHead } from "@/components/SeoHead";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";

export interface FilteredArchiveProps {
  posts: BlogPosts
  filter: ArchiveFilter
  page: number
  seo: ArchiveSeo
}

function filterPosts( posts: BlogPosts, filter: ArchiveFilter ) {
  switch ( filter.kind ) {
  case "all":
    return posts.items;
  case "tag":
    return posts.items.filter( post =>
      post.metadata.tags.some( tag => tag.sys.id === filter.id ) );
  case "category":
    return posts.items.filter( post => post.fields.category === filter.id );
  }
}

export default function FilteredArchive({ posts, filter, page, seo }: FilteredArchiveProps ) {
  const filteredPosts = filterPosts( posts, filter );
  const tagId = filter.kind === "tag" ? filter.id : undefined;
  const currentCategory = filter.kind === "category" ? filter.id : null;

  return (
    <>
      <SeoHead
        title={ seo.title }
        canonicalUrl={ seo.canonical }
        description={ seo.description }
        ogImage={ seo.ogImage }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <CategoryNav currentCategory={ currentCategory } />
          <BlogPostList
            posts={ filteredPosts }
            page={ page }
            tagId={ tagId }
          />
          <Pagination
            posts={ filteredPosts }
            page={ page }
            filter={ filter }
          />
        </main>
      </Layout>
    </>
  );
}

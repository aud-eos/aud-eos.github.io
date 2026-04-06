import Head from "next/head";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import { sortTagsByName } from "@/utils/blogPostUtils";
import Link from "next/link";
import { GetStaticPropsContext } from "next";
import Pagination from "@/components/Home/Pagination";
import { generateFeeds } from "@/lib/generateFeeds";
import { META_DESCRIPTION, META_IMAGE, META_TITLE } from "@/constants";

export const PAGE_SIZE = 12;


export interface HomeProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
}

export default function Home({ posts, page, tags, tagId }: HomeProps ) {
  const filteredBlogPosts = posts.items
    .filter( post => tagId === null || post.metadata.tags
      .find( tag => tag.sys.id == tagId ) );

  return (
    <>
      <Head>
        <title>Audeos.com</title>
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <meta name="description" content={ META_DESCRIPTION } key="desc" />
        <meta property="og:title" content={ META_TITLE } />
        <meta property="og:description" content={ META_DESCRIPTION } />
        <meta property="og:image" content={ META_IMAGE } />
      </Head>
      <Layout>
        <main className={ styles.main }>
          <nav>
            {
              tags.items
                .sort( sortTagsByName )
                .map( tag => {
                  const className = tag.sys.id == tagId ? styles.isTagged : "";
                  const href = tag.sys.id == tagId ? "/" : `/tags/${tag.sys.id}`;
                  return (
                    <Link key={ tag.sys.id }
                      className={ className }
                      href={ href }>
                      { tag.sys.id }
                    </Link>
                  );
                })
            }
          </nav>
          <BlogPostList
            posts={ filteredBlogPosts }
            tagId={ tagId }
            page={ page }
          />
          <Pagination
            posts={ filteredBlogPosts }
            page={ page }
            tagId={ tagId }
          />
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps( context: GetStaticPropsContext ) {
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();
  generateFeeds( posts.items );
  return {
    props: {
      tagId,
      posts,
      tags,
      page,
    },
  };
}

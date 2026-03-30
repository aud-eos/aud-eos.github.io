import Head from "next/head";

import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Container } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import { sortTagsByName } from "@/utils/blogPostUtils";
import Link from "next/link";
import { GetStaticPropsContext } from "next";
import Pagination from "@/components/Home/Pagination";
import { Footer } from "@/components/Layout/Footer";


const META_TITLE = "Audeos.com";
const META_DESCRIPTION = "Official website of DJ Audeos";
const META_IMAGE = "/images/audeos.jpg";
export const PAGE_SIZE = 12;


export interface HomeProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
}

export default function Home({ posts, page, tags, tagId }: HomeProps ){

  const filteredBlogPosts = posts.items
    .filter( post => tagId === null || post.metadata.tags
      .find( tag => tag.sys.id == tagId ) );

  return (
    <>
      <Head>
        <title>Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <meta name="description" content={ META_DESCRIPTION } key="desc" />
        <meta property="og:title" content={ META_TITLE } />
        <meta
          property="og:description"
          content={ META_DESCRIPTION }
        />
        <meta
          property="og:image"
          content={ META_IMAGE }
        />
      </Head>
      <Container>
        <main className={ styles.main }>
          <header>
            <Link href="/">
              <h1 className={ tagId ? "" : styles.isTagged }>Audeos.com</h1>
            </Link>
          </header>
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
            <Footer />
        </main>
      </Container>
    </>
  );
}

export async function getStaticProps( context: GetStaticPropsContext ){
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();
  return {
    props: {
      tagId,
      posts,
      tags,
      page,
    },
  };
}

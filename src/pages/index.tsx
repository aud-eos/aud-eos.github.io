import Head from "next/head";

import styles from "@/styles/Home.module.scss";
import { TypeBlogPost } from "@/types";
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Container } from "@/components/Layout/Layout";
import { TagLink } from "contentful";
import { sortTagsByName } from "@/utils/blogPostUtils";
import Link from "next/link";
import { GetStaticPropsContext } from "next";
import Pagination from "@/components/Home/Pagination";


const META_TITLE = "Audeos.com";
const META_DESCRIPTION = "Official website of DJ Audeos";
const META_IMAGE = "/images/audeos.jpg";
export const PAGE_SIZE = 12;


export interface HomeProps {
  posts: TypeBlogPost[]
  tags: TagLink[]
  page: number
  tagId?: string
}

export default function Home({ posts, page, tags, tagId }: HomeProps ){
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
              tags
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
            posts={ posts }
            tagId={ tagId }
            page={ page }
            />
          <Pagination
            posts={ posts }
            page={ page }
            tagId={ tagId }
            />
        </main>
      </Container>
    </>
  );
}

export async function getStaticProps( context: GetStaticPropsContext ){
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();
  return {
    props: {
      posts,
      tags,
      page,
    },
  };
}

import Head from "next/head";

import styles from "@/styles/Home.module.scss";
import { TypeBlogPost } from "@/types";
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Container } from "@/components/Layout/Layout";
import { TagLink } from "contentful";
import { sortTagsByName } from "@/utils/blogPostUtils";
import Link from "next/link";



export interface HomeProps {
  posts: TypeBlogPost[];
  tags: TagLink[];
}

export default function Home({ posts, tags }: HomeProps ){
  return (
    <>
      <Head>
        <title>Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Container>
        <main className={ styles.main }>
          <header>
            <Link href="/">
              <h1>Audeos.com</h1>
            </Link>
          </header>
          <nav>
            {
              tags.sort( sortTagsByName ).map( tag => {
                return (
                  <Link key={ tag.sys.id }
                    href={ `?tag=${tag.sys.id}` }>
                    <h2>{ tag.sys.id }</h2>
                  </Link>
                );
              })
            }
          </nav>
          <BlogPostList posts={ posts } />
        </main>
      </Container>
    </>
  );
}

export async function getStaticProps(){
  const tags = await getTags();
  const posts = await getBlogPosts();
  return {
    props: {
      posts,
      tags,
    },
  };
}

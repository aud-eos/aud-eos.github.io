import Head from "next/head";

import styles from "@/styles/Home.module.scss";
import { TypeBlogPost } from "@/types";
import { getBlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Container } from "@/components/Layout/Layout";



export interface HomeProps {
  posts: TypeBlogPost[];
}

export default function Home({ posts }: HomeProps ){
  return (
    <>
      <Head>
        <title>Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Container>
        <main className={ styles.main }>
          <BlogPostList posts={ posts } />
        </main>
      </Container>
    </>
  );
}

export async function getStaticProps(){
  const posts = await getBlogPosts();
  return {
    props: {
      posts,
    },
  };
}

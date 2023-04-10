import Head from "next/head";
import Link from "next/link";

import styles from "@/styles/Home.module.css";
import { TypeBlogPost } from "@/types";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { getBlogPosts } from "@/utils/contentfulUtils";



export interface HomeProps {
  posts: TypeBlogPost[];
}

export default function Home({ posts }: HomeProps ){
  console.log( "home component props:", { posts });
  return (
    <>
      <Head>
        <title>Audeos.com</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={ styles.main }>
        <ul>
          {
            posts
              .sort( sortBlogPostsByDate )
              .map( post => {
                return (
                  <li key={ post.fields.slug }>
                    <Link href={ `/post/${post.fields.slug}` }>Post Title: { post.fields.title }</Link>
                    <p>Date: { new Date( post.fields.date || post.sys.createdAt ).toLocaleString() }</p>
                  </li>
                );
            })
          }
        </ul>
      </main>
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

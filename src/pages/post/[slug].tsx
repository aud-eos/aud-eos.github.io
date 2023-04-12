import { FC } from "react";
import { GetStaticPropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { TypeBlogPost } from "@/types";
import { getBlogPost, getBlogPosts } from "@/utils/contentfulUtils";
import styles from "@/styles/BlogPost.module.scss";
import DateTimeFormat from "@/components/DateTimeFormat";
import { Layout } from "@/components/Layout/Layout";
import { Markdown } from "@/components/Markdown";


const IMAGE_SIZE = 750;


export interface BlogPostViewProps {
  post: TypeBlogPost;
}


export const BlogPostView: FC<BlogPostViewProps> = ({ post }) => {
  const metaTitle = `${post.fields.title} | Audeos.com`;
  const metaImage = `https:${post.fields.image?.fields.file.url}?w=${IMAGE_SIZE}`;
  const metaImageDesc = post.fields.image?.fields.description || "";
  const authorProfileImageSrc = `https:${post.fields.author.fields.image?.fields.file.url}?w=50`;
  return (
    <>
      <Head>
        <title>{ metaTitle }</title>
        <meta name="description" content={ post.fields.description } key="desc" />
        <meta property="og:title" content={ metaTitle } />
        <meta
          property="og:description"
          content={ post.fields.description }
        />
        <meta
          property="og:image"
          content={ metaImage }
        />
      </Head>
      <Layout>
        <main className={ styles.main }>
          <article>
            <header>
              <figure>
                <Image
                  src={ metaImage }
                  alt={ metaImageDesc }
                  fill
                  priority
                />
                <figcaption>
                  { metaImageDesc }
                </figcaption>
              </figure>
              <h1>{ post.fields.title }</h1>
              <address>
                <Image
                  src={ authorProfileImageSrc }
                  alt={ post.fields.author.fields.name }
                  width="50"
                  height="50"
                  priority
                />
                <span>
                  By <Link rel="author" href="/">{ post.fields.author.fields.name }</Link>
                  { ` on ` } <DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } />
                </span>
              </address>
              <p>
                { post.fields.description }
              </p>
            </header>
            <Markdown>{ post.fields.body || "" }</Markdown>
          </article>
        </main>
      </Layout>
    </>
  );
};


export async function getStaticProps( context: GetStaticPropsContext ){
  const slug = context.params?.slug;
  if( typeof slug !== "string" ){
    return { props: {} };
  } else {
    const post = await getBlogPost( slug );
    return {
      props: {
        post,
      },
    };
  }
}

export async function getStaticPaths(){
  const posts = await getBlogPosts();

  // Map the result of that query to a list of slugs.
  // This will give Next the list of all blog post pages that need to be
  // rendered at build time.
  const paths = posts.map( post => {
    const slug = post.fields.slug;
    return { params: { slug } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default BlogPostView;

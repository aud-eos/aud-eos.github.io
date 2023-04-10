import { FC } from "react";
import Head from "next/head";
import { GetStaticPropsContext } from "next";
import { TypeBlogPost } from "@/types";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import Link from "next/link";
import { getBlogPost, getBlogPosts } from "@/utils/contentfulUtils";
import Image from "next/image";
import styles from "@/styles/BlogPost.module.scss";
import DateTimeFormat from "@/components/DateTimeFormat";
import { Layout } from "@/components/Layout/Layout";

const IMAGE_SIZE = 750;

export interface SlugProps {
  post: TypeBlogPost;
}


export const BlogPostView: FC<SlugProps> = ({ post }) => {
  const metaTitle = `${post.fields.title} | Audeos.com`;
  const metaImage = `https:${post.fields.image?.fields.file.url}?h=${IMAGE_SIZE}`;
  const metaImageDesc = post.fields.image?.fields.description || "";
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
            <figure>
              <Image
                src={ metaImage }
                alt={ metaImageDesc }
                fill
              />
              <figcaption>
                { metaImageDesc }
              </figcaption>
            </figure>
            <h1>{ post.fields.title }</h1>
            <address>
              By <Link rel="author" href="/">{ post.fields.author.fields.name }</Link>
              { ` ` }on <DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } />
            </address>
            <ReactMarkdown>{ post.fields.body || "" }</ReactMarkdown>
            </article>
          <Link href="/">go back/home</Link>
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

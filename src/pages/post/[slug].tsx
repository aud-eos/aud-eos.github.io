import { FC } from "react";
import Head from "next/head";
import { GetStaticPropsContext } from "next";
import { TypeBlogPost } from "@/types";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import Link from "next/link";
import { getBlogPost, getBlogPosts } from "@/utils/contentfulUtils";


export interface SlugProps {
  post: TypeBlogPost;
}


export const BlogPostView: FC<SlugProps> = ({ post }) => {
  console.log( "title:  " + post.fields.title );
  return (
    <>
      <Head>
        <title>{ `${post.fields.title} - Audeos.com` }</title>
      </Head>
      <h1>{ post.fields.title }</h1>
      <ReactMarkdown>{ post.fields.body || "" }</ReactMarkdown>
      <Link href="/">go back/home</Link>
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

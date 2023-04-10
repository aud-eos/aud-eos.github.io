import { FC } from "react";
import Head from "next/head";
import { GetStaticPropsContext } from "next";
import { getBlogPost, getBlogPosts } from "@/utils";
import { BlogPost } from "..";

export interface SlugProps {
  post: BlogPost;
}

export const BlogPostView: FC<SlugProps> = ({ post }) => {
  return (
    <>
      <Head>
        <title>{ post.title } — My Next.js Static Blog</title>
      </Head>
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

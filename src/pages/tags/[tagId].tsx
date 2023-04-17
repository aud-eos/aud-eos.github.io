import { GetStaticPropsContext } from "next";
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import Home from "@/pages";


export async function getStaticProps( context: GetStaticPropsContext ){
  const tagId = context.params?.tagId;
  const page = context.params?.page || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();
  const filteredPosts = posts
    .filter( post => post.metadata.tags
      .find( tag => tag.sys.id == tagId ) );

  return {
    props: {
      tagId,
      posts: filteredPosts,
      tags,
      page,
    },
  };
}

export async function getStaticPaths(){
  const tags = await getTags();

  // Map the result of that query to a list of slugs.
  // This will give Next the list of all tag index pages that need to be
  // rendered at build time.
  const paths = tags.map( tag => {
    const tagId = tag.sys.id;
    return { params: { tagId } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default Home;

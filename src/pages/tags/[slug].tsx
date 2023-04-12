import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import { GetStaticPropsContext } from "next";
import Home from "..";


export async function getStaticProps( context: GetStaticPropsContext ){
    const slug = context.params?.slug;
    const tags = await getTags();
    const posts = await getBlogPosts();
    const filteredPosts = posts
      .filter( post => post.metadata.tags
        .find( tag => tag.sys.id == slug ) );

    return {
      props: {
        slug,
        posts: filteredPosts,
        tags,
      },
    };
}

export async function getStaticPaths(){
  const tags = await getTags();

  // Map the result of that query to a list of slugs.
  // This will give Next the list of all tag index pages that need to be
  // rendered at build time.
  const paths = tags.map( tag => {
    const slug = tag.sys.id;
    return { params: { slug } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default Home;

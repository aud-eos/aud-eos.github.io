import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import Home, { PAGE_SIZE } from "@/pages";
import { getStaticProps as getStaticPropsBase } from "@/pages/tags/[tagId]";


export const getStaticProps = getStaticPropsBase;


export async function getStaticPaths(){
  const tags = await getTags();
  const posts = await getBlogPosts();
  const paths: { params: { tagId: string, page: string }}[] = [];

  tags.forEach( tag => {
    const tagId = tag.sys.id;
    const filteredPosts = posts
      .filter( post => post.metadata.tags
        .find( __tag => __tag.sys.id == tagId ) );
    const numPages = Math.ceil( filteredPosts.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ){
      paths.push({
        params: {
          tagId,
          page: page.toString(),
        },
      });
    }
  });

  return {
    paths,
    fallback: false,
  };
}

export default Home;

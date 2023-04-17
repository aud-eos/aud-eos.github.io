import { getBlogPosts } from "@/utils/contentfulUtils";
import Home, { PAGE_SIZE, getStaticProps as getStaticPropsHome } from "@/pages";


export const getStaticProps = getStaticPropsHome;

export async function getStaticPaths(){
  const posts = await getBlogPosts();
  const numPages = Math.ceil( posts.length / PAGE_SIZE );
  const paths: { params: { page: string } }[] = [];

  for( let page = 2; page <= numPages; page++ ){
    paths.push({ params: { page: page.toString() } });
  }

  return {
    paths,
    fallback: false,
  };
}

export default Home;

import { getBlogPosts } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getAllStaticProps } from "@/components/FilteredArchive/getAllStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getAllStaticProps;

export async function getStaticPaths() {
  const posts = await getBlogPosts();
  const numPages = Math.ceil( posts.items.length / PAGE_SIZE );
  const paths: { params: { page: string } }[] = [];

  for( let page = 2; page <= numPages; page++ ) {
    paths.push({ params: { page: page.toString() } });
  }

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;

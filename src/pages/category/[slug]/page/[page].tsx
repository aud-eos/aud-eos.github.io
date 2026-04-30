import { getBlogPosts } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../../../data/categories.json";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getCategoryStaticProps;


export async function getStaticPaths() {
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  const posts = await getBlogPosts();
  const paths: { params: { slug: string, page: string } }[] = [];

  for( const slug of Object.keys( categoryConfig ) ) {
    const filteredPosts = posts.items.filter( post => post.fields.category === slug );
    const numPages = Math.ceil( filteredPosts.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ) {
      paths.push({ params: { slug, page: page.toString() } });
    }
  }

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;

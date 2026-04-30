import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";


export const getStaticProps = getCategoryStaticProps;


export async function getStaticPaths() {
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  const paths = Object.keys( categoryConfig ).map( slug => ({ params: { slug } }) );

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;

import { getTags } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getTagStaticProps } from "@/components/FilteredArchive/getTagStaticProps";


export const getStaticProps = getTagStaticProps;


export async function getStaticPaths() {
  const tags = await getTags();
  const paths = tags.items.map( tag => {
    const tagId = tag.sys.id;
    return { params: { tagId } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;

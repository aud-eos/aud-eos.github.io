import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getTagStaticProps } from "@/components/FilteredArchive/getTagStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getTagStaticProps;


export async function getStaticPaths() {
  const tags = await getTags();
  const posts = await getBlogPosts();
  const paths: { params: { tagId: string, page: string }}[] = [];

  tags.items.forEach( tag => {
    const tagId = tag.sys.id;
    const filteredPosts = posts.items
      .filter( post => post.metadata.tags
        .find( postTag => postTag.sys.id === tagId ) );
    const numPages = Math.ceil( filteredPosts.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ) {
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

export default FilteredArchive;

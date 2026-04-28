import { getTags } from "@/utils/contentfulUtils";
import BlogArchive from "@/components/BlogArchive/BlogArchive";
import { getArchiveStaticProps } from "@/components/BlogArchive/getStaticProps";


export const getStaticProps = getArchiveStaticProps;


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

export default BlogArchive;

import { getBlogPosts } from "@/utils/contentfulUtils";
import BlogArchive from "@/components/BlogArchive/BlogArchive";
import { getArchiveStaticProps } from "@/components/BlogArchive/getStaticProps";
import { PAGE_SIZE } from "@/constants";


export const getStaticProps = getArchiveStaticProps;

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

export default BlogArchive;

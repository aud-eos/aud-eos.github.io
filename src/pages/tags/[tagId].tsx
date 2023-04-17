import { getTags } from "@/utils/contentfulUtils";
import Home from "@/pages";
import { getStaticProps as getStaticPropsBase } from "@/pages";


export const getStaticProps = getStaticPropsBase;


export async function getStaticPaths(){
  const tags = await getTags();
  const paths = tags.map( tag => {
    const tagId = tag.sys.id;
    return { params: { tagId } };
  });

  return {
    paths,
    fallback: false,
  };
}

export default Home;

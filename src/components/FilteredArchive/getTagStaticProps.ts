import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_DESCRIPTION, META_IMAGE, SITE_URL } from "@/constants";

export async function getTagStaticProps( context: GetStaticPropsContext ) {
  const tagIdParam = context.params?.tagId;
  if( typeof tagIdParam !== "string" ) {
    throw new Error( "getTagStaticProps: tagId param missing or not a string" );
  }
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  const seo: ArchiveSeo = {
    title: page > 1
      ? `Posts tagged ${tagIdParam} — Page ${page} | Audeos.com`
      : `Posts tagged ${tagIdParam} | Audeos.com`,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: `${SITE_URL}/tags/${tagIdParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  const filter: ArchiveFilter = { kind: "tag", id: tagIdParam };

  return {
    props: { posts, page, filter, seo },
  };
}

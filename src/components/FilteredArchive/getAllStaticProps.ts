import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_DESCRIPTION, META_IMAGE, SITE_URL } from "@/constants";

export async function getAllStaticProps( context: GetStaticPropsContext ) {
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  const seo: ArchiveSeo = {
    title: `Blog — Page ${page} | Audeos.com`,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: `${SITE_URL}/page/${page}`,
  };

  const filter: ArchiveFilter = { kind: "all" };

  return {
    props: { posts, page, filter, seo },
  };
}

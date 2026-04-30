import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_IMAGE, SITE_URL } from "@/constants";

export async function getCategoryStaticProps( context: GetStaticPropsContext ) {
  const slugParam = context.params?.slug;
  if( typeof slugParam !== "string" ) {
    throw new Error( "getCategoryStaticProps: slug param missing or not a string" );
  }
  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  const config = categoryConfig[slugParam];
  if( !config ) {
    throw new Error( `getCategoryStaticProps: no categoryConfig entry for "${slugParam}"` );
  }
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();

  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  const seo: ArchiveSeo = {
    title: page > 1
      ? `${config.title} — Page ${page} | Audeos.com`
      : `${config.title} | Audeos.com`,
    description: config.description,
    ogImage: config.ogImage ?? META_IMAGE,
    canonical: `${SITE_URL}/category/${slugParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  const filter: ArchiveFilter = { kind: "category", id: slugParam };

  return {
    props: { posts, page, filter, seo },
  };
}

import { GetStaticPropsContext } from "next";
import { getBlogPosts, getTags } from "@/utils/contentfulUtils";
import { TagSeoConfigMap } from "@/types/tagConfig";
import tagSeoConfigData from "../../../data/tags.json";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";
import { CategoryConfigMap } from "@/types/categoryConfig";
import categoriesData from "../../../data/categories.json";
import { validateCategoryConfig } from "@/utils/categoryConfig";

export async function getArchiveStaticProps( context: GetStaticPropsContext ) {
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();

  const tagConfig: TagSeoConfigMap = tagSeoConfigData satisfies TagSeoConfigMap;
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagConfig, contentfulTagIds );

  const categoryConfig: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;
  validateCategoryConfig(
    categoryConfig,
    posts.items.map( post => post.fields.category ),
  );

  const resolvedTagId = Array.isArray( tagId ) ? tagId[0] : tagId;
  const tagSeoConfig = resolvedTagId ? tagConfig[resolvedTagId] : null;

  return {
    props: {
      tagId,
      posts,
      tags,
      page,
      tagSeoConfig,
    },
  };
}

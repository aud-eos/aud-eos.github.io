import { CategoryConfigMap } from "@/types/categoryConfig";

export function validateCategoryConfig(
  config: CategoryConfigMap,
  publishedPostCategories: ( string | undefined )[],
): CategoryConfigMap {
  for( const category of publishedPostCategories ) {
    if( category === undefined ) {
      throw new Error(
        "A published post is missing a category. Run the backfill script and ensure the Contentful field is required.",
      );
    }
    if( !( category in config ) ) {
      throw new Error(
        `Category "${category}" is set on a published post but is missing from data/categories.json`,
      );
    }
  }
  return config;
}

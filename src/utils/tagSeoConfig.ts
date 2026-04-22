import { TagSeoConfigMap } from "@/types/tagConfig";

export function validateTagSeoConfig(
  config: TagSeoConfigMap,
  contentfulTagIds: string[],
): TagSeoConfigMap {
  for( const tagId of contentfulTagIds ) {
    if( !( tagId in config ) ) {
      throw new Error(
        `Tag "${tagId}" exists in Contentful but is missing from data/tags.json`,
      );
    }
  }
  return config;
}

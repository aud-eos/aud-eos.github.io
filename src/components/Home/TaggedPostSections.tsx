import Link from "next/link";
import { TagCollection } from "contentful";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { POSTS_PER_TAG_SECTION } from "@/constants";
import { sortBlogPostsByDate, sortTagsById } from "@/utils/blogPostUtils";
import { TagSeoConfigMap } from "@/types/tagConfig";
import styles from "@/styles/Home.module.scss";

export interface TaggedPostSectionsProps {
  posts: BlogPosts;
  tags: TagCollection;
  tagSeoConfig: TagSeoConfigMap;
}

export default function TaggedPostSections({ posts, tags, tagSeoConfig }: TaggedPostSectionsProps ) {
  const sections = [ ...tags.items ]
    .sort( sortTagsById )
    .map( tag => {
      const tagId = tag.sys.id;
      const tagPosts = posts.items
        .filter( post => post.metadata.tags.some( postTag => postTag.sys.id === tagId ) )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_TAG_SECTION );
      return { tagId, tagPosts };
    })
    .filter( section => section.tagPosts.length > 0 );

  return (
    <>
      { sections.map( ( section, sectionIndex ) => {
        const config = tagSeoConfig[section.tagId];
        return (
          <section
            key={ section.tagId }
            id={ `tag-${section.tagId}` }
            className={ styles.tagSection }
          >
            <header className={ styles.tagSectionHeader }>
              <h2>
                <Link href={ `/tags/${section.tagId}` }>{ config.title }</Link>
              </h2>
              <Link href={ `/tags/${section.tagId}` } className={ styles.seeAll }>
                See all →
              </Link>
            </header>
            <BlogPostList
              posts={ section.tagPosts }
              page={ 1 }
              tagId={ section.tagId }
              firstCardPriority={ sectionIndex === 0 }
            />
          </section>
        );
      }) }
    </>
  );
}

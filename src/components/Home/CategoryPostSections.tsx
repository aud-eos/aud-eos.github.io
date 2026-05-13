import Link from "next/link";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { CATEGORY_IDS, POSTS_PER_CATEGORY_SECTION } from "@/constants";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import styles from "@/styles/Home.module.scss";

export interface CategoryPostSectionsProps {
  posts: BlogPosts;
  categoryConfig: CategoryConfigMap;
}

export default function CategoryPostSections({ posts, categoryConfig }: CategoryPostSectionsProps ) {
  const sections = CATEGORY_IDS
    .map( categoryId => {
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return { categoryId, categoryPosts };
    })
    .filter( section => section.categoryPosts.length > 0 );

  return (
    <>
      { sections.map( ( section, sectionIndex ) => {
        const config = categoryConfig[section.categoryId];
        if( !config ) {
          throw new Error( `CategoryPostSections: no categoryConfig entry for "${section.categoryId}"` );
        }
        return (
          <section
            key={ section.categoryId }
            id={ `category-${section.categoryId}` }
            className={ styles.tagSection }
          >
            <header className={ styles.tagSectionHeader }>
              <h2>
                <Link href={ `/category/${section.categoryId}` }>{ config.title }</Link>
              </h2>
            </header>
            <BlogPostList
              posts={ section.categoryPosts }
              page={ 1 }
              firstCardPriority={ sectionIndex === 0 }
            />
            <div className={ styles.seeAllFooter }>
              <Link
                href={ `/category/${section.categoryId}` }
                className={ styles.seeAll }
              >
                See all { config.title } →
              </Link>
            </div>
          </section>
        );
      }) }
    </>
  );
}

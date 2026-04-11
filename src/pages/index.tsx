import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import { sortTagsById } from "@/utils/blogPostUtils";
import { GetStaticPropsContext } from "next";
import Pagination from "@/components/Home/Pagination";
import { generateFeeds } from "@/lib/generateFeeds";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, POSTS_ANCHOR, SITE_URL } from "@/constants";
import { capitalize } from "@/utils/stringUtils";
import { OldSchoolButton } from "@/components/OldSchoolButton";
import { SeoHead } from "@/components/SeoHead";
import { useEffect } from "react";

export interface HomeProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
}

export default function Home({ posts, page, tags, tagId }: HomeProps ) {
  const filteredBlogPosts = posts.items
    .filter( post => tagId === null || post.metadata.tags
      .find( tag => tag.sys.id === tagId ) );

  const isTagPage = Boolean( tagId );
  const isPaginated = page > 1;

  useEffect( () => {
    if( !tagId ) return;
    const isMobile = window.innerWidth <= 768;
    if( !isMobile ) return;
    const postsElement = document.getElementById( POSTS_ANCHOR );
    postsElement?.scrollIntoView({ behavior: "smooth" });
  }, [ tagId ] );
  const tagLabel = tagId ? capitalize( tagId ) : "";

  const pageTitle = isTagPage && isPaginated
    ? `${tagLabel} — Page ${page} | Audeos.com`
    : isTagPage
      ? `${tagLabel} | Audeos.com`
      : isPaginated
        ? `Blog — Page ${page} | ${META_TITLE}`
        : META_TITLE;

  const pageDescription = isTagPage
    ? `Browse all ${tagLabel} posts on Audeos.com`
    : META_DESCRIPTION;

  const canonicalUrl = isTagPage && isPaginated
    ? `${SITE_URL}/tags/${tagId}/page/${page}`
    : isTagPage
      ? `${SITE_URL}/tags/${tagId}`
      : isPaginated
        ? `${SITE_URL}/page/${page}`
        : SITE_URL;

  return (
    <>
      <SeoHead
        title={ pageTitle }
        canonicalUrl={ canonicalUrl }
        description={ pageDescription }
        ogImage={ META_IMAGE }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <nav>
            {
              tags.items
                .sort( sortTagsById )
                .map( tag => {
                  const className = tag.sys.id === tagId ? styles.isTagged : "";
                  const href = tag.sys.id === tagId ? "/" : `/tags/${tag.sys.id}`;
                  return (
                    <div key={ tag.sys.id } className={ styles.navButtonWrapper }>
                      <OldSchoolButton
                        className={ className }
                        href={ href }
                        label={ tag.sys.id }
                      />
                    </div>
                  );
                })
            }
          </nav>
          <BlogPostList
            posts={ filteredBlogPosts }
            tagId={ tagId }
            page={ page }
          />
          <Pagination
            posts={ filteredBlogPosts }
            page={ page }
            tagId={ tagId }
          />
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps( context: GetStaticPropsContext ) {
  const tagId = context.params?.tagId || null;
  const page: number = Number( context.params?.page ) || 1;
  const tags = await getTags();
  const posts = await getBlogPosts();
  if( !tagId && page === 1 ) {
    generateFeeds( posts.items );
  }
  return {
    props: {
      tagId,
      posts,
      tags,
      page,
    },
  };
}

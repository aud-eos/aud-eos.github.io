import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts, getTags } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { Layout } from "@/components/Layout/Layout";
import { TagCollection } from "contentful";
import { sortTagsById } from "@/utils/blogPostUtils";
import { GetStaticPropsContext } from "next";
import Pagination from "@/components/Home/Pagination";
import { generateFeeds } from "@/lib/generateFeeds";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { TagSeoConfig, TagSeoConfigMap } from "@/types/tagConfig";
import tagSeoConfigData from "../../data/tags.json";
import { validateTagSeoConfig } from "@/utils/tagSeoConfig";

export interface HomeProps {
  posts: BlogPosts
  tags: TagCollection
  page: number
  tagId?: string
  tagSeoConfig?: TagSeoConfig
}

export default function Home({ posts, page, tags, tagId, tagSeoConfig }: HomeProps ) {
  const filteredBlogPosts = posts.items
    .filter( post => tagId === null || post.metadata.tags
      .find( tag => tag.sys.id === tagId ) );

  const isTagPage = Boolean( tagId );
  const isPaginated = page > 1;

  const tagLabel = tagSeoConfig?.title ?? "";

  const pageTitle = isTagPage && isPaginated
    ? `${tagLabel} — Page ${page} | Audeos.com`
    : isTagPage
      ? `${tagLabel} | Audeos.com`
      : isPaginated
        ? `Blog — Page ${page} | ${META_TITLE}`
        : META_TITLE;

  const pageDescription = isTagPage && tagSeoConfig
    ? tagSeoConfig.description
    : META_DESCRIPTION;

  const ogImage = isTagPage && tagSeoConfig?.ogImage
    ? tagSeoConfig.ogImage
    : META_IMAGE;

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
        ogImage={ ogImage }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <nav className={ styles.tagNav }>
            {
              tags.items
                .sort( sortTagsById )
                .map( tag => {
                  const isActive = tag.sys.id === tagId;
                  const href = isActive ? "/" : `/tags/${tag.sys.id}`;
                  return (
                    <Link
                      key={ tag.sys.id }
                      href={ href }
                      className={ isActive ? styles.tagActive : styles.tag }
                    >
                      { tag.sys.id }
                    </Link>
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

  const tagConfig = tagSeoConfigData satisfies TagSeoConfigMap;
  const contentfulTagIds = tags.items.map( tag => tag.sys.id );
  validateTagSeoConfig( tagConfig, contentfulTagIds );

  const resolvedTagId = Array.isArray( tagId ) ? tagId[0] : tagId;
  const tagSeoConfig = resolvedTagId ? tagConfig[resolvedTagId] : null;

  if( !tagId && page === 1 ) {
    generateFeeds( posts.items );
  }
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
